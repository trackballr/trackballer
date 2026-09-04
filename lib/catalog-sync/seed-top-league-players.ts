import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiFootballClient } from "@/lib/api-football/client";
import type { Database } from "@/lib/database.types";
import { mapClubFromLeague } from "@/lib/catalog-sync/mappers";
import { syncClubSquad } from "@/lib/catalog-sync/sync-club-squad";
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
    apiCalls += 1;
    const stats = await syncClubSquad(db, api, {
      seasonId: work.seasonId,
      teamId: work.teamId,
      leagueId: work.league.id,
    });

    newPlayers += stats.newPlayers;
    existingPlayersMerged += stats.existingPlayers;
    squadLinksUpserted += stats.squadLinksUpserted;

    byTeam.push({
      leagueId: work.league.id,
      teamId: work.teamId,
      teamName: work.teamName,
      playerCount: stats.playerCount,
      newPlayers: stats.newPlayers,
      existingPlayers: stats.existingPlayers,
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
