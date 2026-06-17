import type { Database } from "@/lib/database.types";
import type {
  ApiFixtureEventItem,
  ApiFixtureItem,
  ApiFixturePlayersItem,
  ApiLeagueTeamItem,
  ApiLineupItem,
  ApiLineupPlayer,
  ApiSquadItem,
  ApiTeamRef,
} from "@/lib/api-football/types";
import { filterDisplayFixtureEvents } from "@/lib/match/fixture-event-filters";
import { TERMINAL_STATUSES } from "./constants";
import {
  isValidLineupPlayerId,
  lineupPlayerOverrideKey,
} from "./lineup-audit";

type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
type FixtureInsert = Database["public"]["Tables"]["fixtures"]["Insert"];
type LineupInsert = Database["public"]["Tables"]["fixture_lineups"]["Insert"];
type AppearanceInsert =
  Database["public"]["Tables"]["fixture_appearances"]["Insert"];
type EventInsert = Database["public"]["Tables"]["fixture_events"]["Insert"];
type CoachInsert = Database["public"]["Tables"]["fixture_coaches"]["Insert"];

export function normalizePosition(raw?: string | null): string | null {
  if (!raw) return null;
  const p = raw.toLowerCase();
  if (p.includes("goal")) return "GK";
  if (p.includes("def")) return "DEF";
  if (p.includes("mid")) return "MID";
  if (p.includes("att") || p.includes("for") || p.includes("strik")) {
    return "FWD";
  }
  const short = raw.toUpperCase();
  if (["GK", "DEF", "MID", "FWD"].includes(short)) return short;
  if (short === "G") return "GK";
  if (short === "D") return "DEF";
  if (short === "M") return "MID";
  if (short === "F" || short === "A") return "FWD";
  return null;
}

export function mapTeamFromFixtureSide(
  side: ApiTeamRef,
  options?: { isNational?: boolean },
): TeamInsert {
  return {
    id: side.id,
    name: side.name,
    logo_url: side.logo ?? null,
    is_national: options?.isNational ?? false,
  };
}

/** National squads from a competition season (e.g. World Cup). */
export function mapTeamFromLeague(item: ApiLeagueTeamItem): TeamInsert {
  return mapTeamFromLeagueItem(item, { isNational: true });
}

/** Club sides from domestic leagues (PL, La Liga, etc.). */
export function mapClubFromLeague(item: ApiLeagueTeamItem): TeamInsert {
  return mapTeamFromLeagueItem(item, { isNational: false });
}

function mapTeamFromLeagueItem(
  item: ApiLeagueTeamItem,
  options: { isNational: boolean },
): TeamInsert {
  return {
    id: item.team.id,
    name: item.team.name,
    code: item.team.code ?? null,
    country: item.team.country ?? null,
    logo_url: item.team.logo ?? null,
    is_national: options.isNational,
  };
}

export function mapPlayersFromSquad(
  squad: ApiSquadItem,
): PlayerInsert[] {
  return squad.players.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age ?? null,
    photo_url: p.photo ?? null,
    primary_position: normalizePosition(p.position),
    national_team_id: squad.team.id,
  }));
}

/** Club squads from domestic leagues — sets current club, not national team. */
export function mapPlayersFromClubSquad(
  squad: ApiSquadItem,
): PlayerInsert[] {
  const clubTeamId = squad.team.id;
  return squad.players.map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age ?? null,
    photo_url: p.photo ?? null,
    primary_position: normalizePosition(p.position),
    club_team_id: clubTeamId,
  }));
}

export function mapFixtureRow(
  item: ApiFixtureItem,
  seasonId: number,
  roundId: number | null,
  roundName: string,
): FixtureInsert {
  const statusShort = item.fixture.status.short;
  const homeWinner = item.teams.home.winner === true;
  const awayWinner = item.teams.away.winner === true;
  const winnerTeamId = homeWinner
    ? item.teams.home.id
    : awayWinner
      ? item.teams.away.id
      : null;

  return {
    id: item.fixture.id,
    season_id: seasonId,
    round_id: roundId,
    round_name: roundName,
    home_team_id: item.teams.home.id,
    away_team_id: item.teams.away.id,
    venue: item.fixture.venue?.name ?? null,
    kickoff_at: item.fixture.date,
    status_short: statusShort,
    status_long: item.fixture.status.long,
    home_goals_ft: item.score.fulltime?.home ?? item.goals.home,
    away_goals_ft: item.score.fulltime?.away ?? item.goals.away,
    home_goals_et: item.score.extratime?.home ?? null,
    away_goals_et: item.score.extratime?.away ?? null,
    home_goals_pen: item.score.penalty?.home ?? null,
    away_goals_pen: item.score.penalty?.away ?? null,
    winner_team_id: winnerTeamId,
    ratings_unlocked_at: TERMINAL_STATUSES.has(statusShort)
      ? new Date().toISOString()
      : null,
  };
}

export type SkippedLineupSlot = {
  teamId: number;
  playerName: string;
  reason: "missing_player_id";
};

function resolveCatalogPlayerId(
  teamId: number,
  player: { id: unknown; name: string },
  overrides: Map<string, number>,
): number | null {
  if (isValidLineupPlayerId(player.id)) {
    return typeof player.id === "number" ? player.id : Number(player.id);
  }

  return overrides.get(lineupPlayerOverrideKey(teamId, player.name)) ?? null;
}

function resolveLineupPlayerId(
  teamId: number,
  entry: ApiLineupPlayer,
  playerIdOverrides: Map<string, number>,
): number | null {
  return resolveCatalogPlayerId(teamId, entry.player, playerIdOverrides);
}

function mapLineupPlayer(
  fixtureId: number,
  teamId: number,
  entry: ApiLineupPlayer,
  isStarter: boolean,
  playerId: number,
): LineupInsert {
  return {
    fixture_id: fixtureId,
    team_id: teamId,
    player_id: playerId,
    is_starter: isStarter,
    shirt_number: entry.player.number ?? null,
    formation_position: entry.player.pos ?? null,
    grid: entry.player.grid ?? null,
  };
}

export function mapLineups(
  fixtureId: number,
  lineups: ApiLineupItem[],
  options?: { playerIdOverrides?: Map<string, number> },
): {
  lineups: LineupInsert[];
  playerStubs: PlayerInsert[];
  skipped: SkippedLineupSlot[];
} {
  const lineupsOut: LineupInsert[] = [];
  const playerStubs: PlayerInsert[] = [];
  const skipped: SkippedLineupSlot[] = [];
  const overrides = options?.playerIdOverrides ?? new Map<string, number>();

  for (const teamLineup of lineups) {
    const teamId = teamLineup.team.id;
    for (const entry of teamLineup.startXI) {
      const playerId = resolveLineupPlayerId(teamId, entry, overrides);
      if (playerId == null) {
        skipped.push({
          teamId,
          playerName: entry.player.name,
          reason: "missing_player_id",
        });
        continue;
      }
      lineupsOut.push(mapLineupPlayer(fixtureId, teamId, entry, true, playerId));
      playerStubs.push({
        id: playerId,
        name: entry.player.name,
      });
    }
    for (const entry of teamLineup.substitutes) {
      const playerId = resolveLineupPlayerId(teamId, entry, overrides);
      if (playerId == null) {
        skipped.push({
          teamId,
          playerName: entry.player.name,
          reason: "missing_player_id",
        });
        continue;
      }
      lineupsOut.push(mapLineupPlayer(fixtureId, teamId, entry, false, playerId));
      playerStubs.push({
        id: playerId,
        name: entry.player.name,
      });
    }
  }

  return { lineups: lineupsOut, playerStubs, skipped };
}

export function mapCoaches(
  fixtureId: number,
  lineups: ApiLineupItem[],
): CoachInsert[] {
  const rows: CoachInsert[] = [];
  for (const teamLineup of lineups) {
    const name = teamLineup.coach?.name?.trim();
    if (!name) continue;
    rows.push({
      fixture_id: fixtureId,
      team_id: teamLineup.team.id,
      name,
      photo_url: teamLineup.coach?.photo ?? null,
    });
  }
  return rows;
}

export function mapAppearances(
  fixtureId: number,
  teams: ApiFixturePlayersItem[],
  options?: { playerIdOverrides?: Map<string, number> },
): {
  appearances: AppearanceInsert[];
  playerStubs: PlayerInsert[];
  skipped: SkippedLineupSlot[];
} {
  const appearances: AppearanceInsert[] = [];
  const playerStubs: PlayerInsert[] = [];
  const skipped: SkippedLineupSlot[] = [];
  const overrides = options?.playerIdOverrides ?? new Map<string, number>();
  const seenPlayerIds = new Set<number>();

  for (const teamBlock of teams) {
    const teamId = teamBlock.team.id;
    for (const row of teamBlock.players) {
      const playerId = resolveCatalogPlayerId(teamId, row.player, overrides);
      if (playerId == null) {
        skipped.push({
          teamId,
          playerName: row.player.name,
          reason: "missing_player_id",
        });
        continue;
      }
      if (seenPlayerIds.has(playerId)) continue;
      seenPlayerIds.add(playerId);

      const stats = row.statistics[0]?.games;
      const minutes = stats?.minutes ?? 0;
      appearances.push({
        fixture_id: fixtureId,
        team_id: teamId,
        player_id: playerId,
        minutes_played: minutes,
        is_starter: stats?.substitute === false,
        position: normalizePosition(stats?.position) ?? stats?.position ?? null,
      });
      playerStubs.push({
        id: playerId,
        name: row.player.name,
        photo_url: row.player.photo ?? null,
        primary_position: normalizePosition(stats?.position),
      });
    }
  }

  return { appearances, playerStubs, skipped };
}

/** Subst events: API-Football `player` leaves, `assist` enters (stored as player_id / assist_player_id). */
export function mapEvents(
  fixtureId: number,
  events: ApiFixtureEventItem[],
): EventInsert[] {
  const rows = events.map((e) => ({
    fixture_id: fixtureId,
    team_id: e.team.id,
    player_id: e.player.id ?? null,
    assist_player_id: e.assist?.id ?? null,
    minute: e.time.elapsed,
    extra_minute: e.time.extra ?? null,
    type: e.type,
    detail: e.detail,
  }));

  return filterDisplayFixtureEvents(rows);
}
