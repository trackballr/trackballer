import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiFootballClient } from "@/lib/api-football/client";
import type { Database } from "@/lib/database.types";
import { mapClubFromLeague, mapPlayersFromClubSquad } from "@/lib/catalog-sync/mappers";
import {
  mergePlayerStub,
  type PlayerInsert,
} from "@/lib/catalog-sync/player-merge";
import {
  TOP_LEAGUE_CLUBS,
  type TopLeagueDefinition,
} from "@/lib/catalog/top-leagues";

type Db = SupabaseClient<Database>;

export type TopLeaguePlayersSeedOptions = {
  seasonYear: number;
  leagueIds?: number[];
  /** Max clubs to process this run. Omit to process all remaining. */
  limit?: number;
  /** Skip first N clubs in the stable league→team order (resume after timeout). */
  offset?: number;
};

export type TopLeaguePlayersSeedResult = {
  seasonYear: number;
  totalTeams: number;
  offset: number;
  teamsProcessed: number;
  newPlayers: number;
  existingPlayersMerged: number;
  squadLinksUpserted: number;
  apiCalls: number;
  nextOffset: number | null;
  byTeam: Array<{
    leagueId: number;
    teamId: number;
    teamName: string;
    playerCount: number;
    newPlayers: number;
    existingPlayers: number;
  }>;
};

type TeamWorkItem = {
  league: TopLeagueDefinition;
  seasonId: number;
  teamId: number;
  teamName: string;
};

function dedupeById<T extends { id: number }>(rows: T[]): T[] {
  const map = new Map<number, T>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

async function ensureSeason(
  db: Db,
  leagueId: number,
  seasonYear: number,
): Promise<number> {
  const { data: existing, error: selectError } = await db
    .from("seasons")
    .select("id")
    .eq("league_id", leagueId)
    .eq("year", seasonYear)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data: inserted, error: insertError } = await db
    .from("seasons")
    .insert({
      league_id: leagueId,
      year: seasonYear,
      is_current: true,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return inserted.id;
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

async function buildTeamWorkList(
  db: Db,
  api: ApiFootballClient,
  leagues: TopLeagueDefinition[],
  seasonYear: number,
): Promise<TeamWorkItem[]> {
  const items: TeamWorkItem[] = [];

  for (const league of leagues) {
    const seasonId = await ensureSeason(db, league.id, seasonYear);
    const teamsRes = await api.getTeams(league.id, seasonYear);
    const teamRows = teamsRes.response.map(mapClubFromLeague);

    if (teamRows.length > 0) {
      const { error } = await db.from("teams").upsert(teamRows, {
        onConflict: "id",
      });
      if (error) throw error;
    }

    for (const item of teamsRes.response) {
      items.push({
        league,
        seasonId,
        teamId: item.team.id,
        teamName: item.team.name,
      });
    }
  }

  return items;
}

export async function seedTopLeaguePlayers(
  db: Db,
  api: ApiFootballClient,
  options: TopLeaguePlayersSeedOptions,
): Promise<TopLeaguePlayersSeedResult> {
  const { seasonYear, limit, offset = 0 } = options;
  const leagueIds = options.leagueIds?.length
    ? options.leagueIds
    : TOP_LEAGUE_CLUBS.map((l) => l.id);

  const leagues = TOP_LEAGUE_CLUBS.filter((l) => leagueIds.includes(l.id));
  if (leagues.length === 0) {
    throw new Error("No matching top-league ids in leagueIds");
  }

  const allTeams = await buildTeamWorkList(db, api, leagues, seasonYear);
  const totalTeams = allTeams.length;
  const sliceEnd =
    limit != null ? Math.min(offset + limit, totalTeams) : totalTeams;
  const batch = allTeams.slice(offset, sliceEnd);

  let apiCalls = leagues.length;
  let newPlayers = 0;
  let existingPlayersMerged = 0;
  let squadLinksUpserted = 0;
  const byTeam: TopLeaguePlayersSeedResult["byTeam"] = [];

  for (const work of batch) {
    const squadRes = await api.getSquad(work.teamId);
    apiCalls += 1;

    const squad = squadRes.response[0];
    if (!squad?.players?.length) {
      byTeam.push({
        leagueId: work.league.id,
        teamId: work.teamId,
        teamName: work.teamName,
        playerCount: 0,
        newPlayers: 0,
        existingPlayers: 0,
      });
      continue;
    }

    const incomingPlayers = mapPlayersFromClubSquad(squad);
    const existingById = await fetchPlayersByIds(
      db,
      incomingPlayers.map((p) => p.id),
    );

    const playerStats = await upsertMergedPlayers(
      db,
      incomingPlayers,
      existingById,
    );
    newPlayers += playerStats.newPlayers;
    existingPlayersMerged += playerStats.existingPlayersMerged;

    const links = incomingPlayers.map((p) => ({
      season_id: work.seasonId,
      team_id: work.teamId,
      player_id: p.id,
    }));

    const { error: linkError } = await db
      .from("player_season_squads")
      .upsert(links, { onConflict: "season_id,team_id,player_id" });
    if (linkError) throw linkError;

    squadLinksUpserted += links.length;
    byTeam.push({
      leagueId: work.league.id,
      teamId: work.teamId,
      teamName: work.teamName,
      playerCount: incomingPlayers.length,
      newPlayers: playerStats.newPlayers,
      existingPlayers: playerStats.existingPlayersMerged,
    });
  }

  const teamsProcessed = batch.length;
  const nextOffset =
    sliceEnd < totalTeams
      ? sliceEnd
      : null;

  return {
    seasonYear,
    totalTeams,
    offset,
    teamsProcessed,
    newPlayers,
    existingPlayersMerged,
    squadLinksUpserted,
    apiCalls,
    nextOffset,
    byTeam,
  };
}
