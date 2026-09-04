import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiFootballClient } from "@/lib/api-football/client";
import type { Database } from "@/lib/database.types";
import { mapPlayersFromClubSquad } from "@/lib/catalog-sync/mappers";
import {
  mergePlayerStub,
  type PlayerInsert,
} from "@/lib/catalog-sync/player-merge";

type Db = SupabaseClient<Database>;

export type ClubSquadSyncResult = {
  playerCount: number;
  newPlayers: number;
  existingPlayers: number;
  squadLinksUpserted: number;
};

function dedupeById<T extends { id: number }>(rows: T[]): T[] {
  const map = new Map<number, T>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

async function fetchPlayersByIds(
  db: Db,
  ids: number[],
): Promise<Map<number, Database["public"]["Tables"]["players"]["Row"]>> {
  if (ids.length === 0) {
    return new Map();
  }
  const { data, error } = await db.from("players").select("*").in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

async function upsertMergedPlayers(
  db: Db,
  rows: PlayerInsert[],
  existingById: Map<number, Database["public"]["Tables"]["players"]["Row"]>,
): Promise<{ newPlayers: number; existingPlayersMerged: number }> {
  if (rows.length === 0) {
    return { newPlayers: 0, existingPlayersMerged: 0 };
  }

  const unique = dedupeById(rows);
  let newPlayers = 0;
  let existingPlayersMerged = 0;

  const toWrite = unique.map((incoming) => {
    const existing = existingById.get(incoming.id) ?? null;
    if (existing) existingPlayersMerged += 1;
    else newPlayers += 1;
    return mergePlayerStub(existing, incoming);
  });

  const { error } = await db.from("players").upsert(toWrite, {
    onConflict: "id",
  });
  if (error) throw error;

  return { newPlayers, existingPlayersMerged };
}

/** Pull one club squad from API-Football and upsert players + season links. */
export async function syncClubSquad(
  db: Db,
  api: ApiFootballClient,
  work: {
    seasonId: number;
    teamId: number;
    leagueId: number;
  },
): Promise<ClubSquadSyncResult> {
  const squadRes = await api.getSquad(work.teamId);
  const squad = squadRes.response[0];

  if (!squad?.players?.length) {
    return {
      playerCount: 0,
      newPlayers: 0,
      existingPlayers: 0,
      squadLinksUpserted: 0,
    };
  }

  const incomingPlayers = mapPlayersFromClubSquad(squad);
  const existingById = await fetchPlayersByIds(
    db,
    incomingPlayers.map((p) => p.id),
  );

  const playerStats = await upsertMergedPlayers(db, incomingPlayers, existingById);

  const links = incomingPlayers.map((p) => ({
    season_id: work.seasonId,
    team_id: work.teamId,
    player_id: p.id,
  }));

  const { error: linkError } = await db
    .from("player_season_squads")
    .upsert(links, { onConflict: "season_id,team_id,player_id" });
  if (linkError) throw linkError;

  return {
    playerCount: incomingPlayers.length,
    newPlayers: playerStats.newPlayers,
    existingPlayers: playerStats.existingPlayersMerged,
    squadLinksUpserted: links.length,
  };
}
