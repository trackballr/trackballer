import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiFootballClient } from "@/lib/api-football/client";
import { getT5SeasonYear } from "@/lib/catalog/config";
import {
  TOP_LEAGUE_CLUBS,
  UCL_COMPETITION,
} from "@/lib/catalog/top-leagues";
import type { Database } from "@/lib/database.types";
import { mapClubFromLeague } from "@/lib/catalog-sync/mappers";
import { syncClubSquad } from "@/lib/catalog-sync/sync-club-squad";

type Db = SupabaseClient<Database>;

const T5_LEAGUE_IDS = TOP_LEAGUE_CLUBS.map((league) => league.id);

export type UclPlayersSeedOptions = {
  seasonYear: number;
  limit?: number;
  offset?: number;
};

export type UclPlayersSeedResult = {
  seasonYear: number;
  totalTeams: number;
  offset: number;
  teamsProcessed: number;
  teamsSkippedT5: number;
  newPlayers: number;
  existingPlayersMerged: number;
  squadLinksUpserted: number;
  apiCalls: number;
  nextOffset: number | null;
  byTeam: Array<{
    teamId: number;
    teamName: string;
    skipped: boolean;
    playerCount: number;
    newPlayers: number;
    existingPlayers: number;
  }>;
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

async function getT5SeededTeamIds(db: Db, seasonYear: number): Promise<Set<number>> {
  const { data: seasons, error: seasonError } = await db
    .from("seasons")
    .select("id")
    .in("league_id", T5_LEAGUE_IDS)
    .eq("year", seasonYear);

  if (seasonError) throw seasonError;
  const seasonIds = (seasons ?? []).map((row) => row.id);
  if (seasonIds.length === 0) return new Set();

  const teamIds = new Set<number>();
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await db
      .from("player_season_squads")
      .select("team_id")
      .in("season_id", seasonIds)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      teamIds.add(row.team_id);
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return teamIds;
}

async function getUclTeamsFromFixtures(
  db: Db,
  seasonId: number,
): Promise<Array<{ teamId: number; teamName: string }>> {
  const teamMap = new Map<number, string>();
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await db
      .from("fixtures")
      .select(
        "home_team_id, away_team_id, home_team:teams!fixtures_home_team_id_fkey(id, name), away_team:teams!fixtures_away_team_id_fkey(id, name)",
      )
      .eq("season_id", seasonId)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      const home = row.home_team as { id: number; name: string } | null;
      const away = row.away_team as { id: number; name: string } | null;
      if (home) teamMap.set(home.id, home.name);
      if (away) teamMap.set(away.id, away.name);
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return [...teamMap.entries()]
    .map(([teamId, teamName]) => ({ teamId, teamName }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));
}

/**
 * UCL squads from fixture clubs — skips teams already seeded via T5 leagues.
 */
export async function seedUclPlayers(
  db: Db,
  api: ApiFootballClient,
  options: UclPlayersSeedOptions,
): Promise<UclPlayersSeedResult> {
  const { seasonYear, limit, offset = 0 } = options;
  const t5SeasonYear = getT5SeasonYear();
  const uclSeasonId = await ensureSeason(db, UCL_COMPETITION.id, seasonYear);
  const t5TeamIds = await getT5SeededTeamIds(db, t5SeasonYear);
  const allTeams = await getUclTeamsFromFixtures(db, uclSeasonId);

  const totalTeams = allTeams.length;
  const sliceEnd = limit != null ? Math.min(offset + limit, totalTeams) : totalTeams;
  const batch = allTeams.slice(offset, sliceEnd);

  let apiCalls = 0;
  let teamsSkippedT5 = 0;
  let newPlayers = 0;
  let existingPlayersMerged = 0;
  let squadLinksUpserted = 0;
  const byTeam: UclPlayersSeedResult["byTeam"] = [];

  for (const team of batch) {
    if (t5TeamIds.has(team.teamId)) {
      teamsSkippedT5 += 1;
      byTeam.push({
        teamId: team.teamId,
        teamName: team.teamName,
        skipped: true,
        playerCount: 0,
        newPlayers: 0,
        existingPlayers: 0,
      });
      continue;
    }

    apiCalls += 1;
    const stats = await syncClubSquad(db, api, {
      seasonId: uclSeasonId,
      teamId: team.teamId,
      leagueId: UCL_COMPETITION.id,
    });

    newPlayers += stats.newPlayers;
    existingPlayersMerged += stats.existingPlayers;
    squadLinksUpserted += stats.squadLinksUpserted;

    byTeam.push({
      teamId: team.teamId,
      teamName: team.teamName,
      skipped: false,
      playerCount: stats.playerCount,
      newPlayers: stats.newPlayers,
      existingPlayers: stats.existingPlayers,
    });
  }

  return {
    seasonYear,
    totalTeams,
    offset,
    teamsProcessed: batch.length,
    teamsSkippedT5,
    newPlayers,
    existingPlayersMerged,
    squadLinksUpserted,
    apiCalls,
    nextOffset: sliceEnd < totalTeams ? sliceEnd : null,
    byTeam,
  };
}

/** Upsert UCL participant clubs from API when fixtures are not seeded yet. */
export async function seedUclTeamsFromApi(
  db: Db,
  api: ApiFootballClient,
  seasonYear: number,
): Promise<number> {
  const teamsRes = await api.getTeams(UCL_COMPETITION.id, seasonYear);
  const teamRows = teamsRes.response.map(mapClubFromLeague);
  if (teamRows.length === 0) return 0;

  const { error } = await db.from("teams").upsert(teamRows, { onConflict: "id" });
  if (error) throw error;
  return teamRows.length;
}
