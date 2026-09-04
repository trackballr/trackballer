import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { ApiFootballClient } from "@/lib/api-football/client";
import {
  mapAppearances,
  mapCoaches,
  mapEvents,
  mapFixtureRow,
  mapLineups,
  mapPlayersFromSquad,
  mapTeamFromFixtureSide,
  mapTeamFromLeague,
} from "./mappers";
import {
  auditApiAppearancePlayerIds,
  auditApiLineupIds,
  mergePlayerIdIssues,
  summarizeApiLineups,
  type LineupIdIssue,
} from "./lineup-audit";
import { buildLineupPlayerIdOverrides } from "./lineup-player-resolve";
import { TERMINAL_STATUSES } from "./constants";
import {
  syncDailyWindow as runDailyWindow,
  type DailyWindowOptions,
} from "./daily-window";
import {
  syncMatchdayBatch as runMatchdayBatch,
  type MatchdayBatchOptions,
} from "./matchday-batch";
import {
  isPlaceholderPlayerName,
  mergePlayerProfile,
  mergePlayerStub,
  type PlayerInsert,
} from "./player-merge";
import { mapPlayerProfile } from "./player-profile-picker";

type Db = SupabaseClient<Database>;

export type BootstrapOptions = {
  leagueId?: number;
  seasonYear?: number;
  /** Sync lineups / appearances / events for every terminal fixture (slow). */
  syncFixtureDetails?: boolean;
};

export type SyncStats = {
  rounds: number;
  fixtures: number;
  teams: number;
  players: number;
  squads: number;
  fixtureDetailsSynced?: number;
};

export type FixtureDetailStats = {
  fixtureId: number;
  lineups: number;
  appearances: number;
  events: number;
  skippedEmptyLineups: boolean;
  /** Raw API `response` array lengths (for diagnosis). */
  apiResponseCounts: {
    lineups: number;
    playerBlocks: number;
    events: number;
  };
};

export type SyncFixtureDetailOptions = {
  /** full = lineups + appearances + events; live = lineups + events; events = events only. */
  scope?: "full" | "live" | "events";
};

const SYNC_LOG = "[catalog-sync]";

function syncLog(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (data !== undefined) {
    console.log(SYNC_LOG, message, data);
  } else {
    console.log(SYNC_LOG, message);
  }
}

function apiMeta(res: {
  get: string;
  results: number;
  errors: string[] | Record<string, string>;
  response: unknown[];
}) {
  const errors = res.errors;
  const hasErrors = Array.isArray(errors)
    ? errors.length > 0
    : Object.keys(errors ?? {}).length > 0;
  return {
    endpoint: res.get,
    results: res.results,
    responseLength: res.response.length,
    errors: hasErrors ? errors : undefined,
  };
}

export type PlayerProfileStats = {
  playerId: number;
  name: string;
  updated: boolean;
};

export type RepairPlayersOptions = {
  seasonYear?: number;
  /** Cap API calls per request (rate limit). Default 30. */
  limit?: number;
};

export type RepairPlayersStats = {
  candidates: number;
  repaired: number;
  failed: number;
  failures: Array<{ playerId: number; error: string }>;
};

export type PendingFixtureDetailsOptions = {
  leagueId?: number;
  seasonYear?: number;
  /** Max fixtures to sync this run (optional). Each fixture = 3 API calls. */
  limit?: number;
};

export type PendingFixtureDetailsStats = {
  pending: number;
  skipped: number;
  synced: number;
  failed: number;
  skippedFixtureIds: number[];
  syncedFixtureIds: number[];
  failures: Array<{ fixtureId: number; error: string }>;
};

export type FixtureSyncState = "pending" | "partial" | "complete";

export type FixtureSyncHealthRow = {
  fixtureId: number;
  roundName: string | null;
  homeTeam: string;
  awayTeam: string;
  statusShort: string;
  state: FixtureSyncState;
  lineupsSyncedAt: string | null;
  appearancesSyncedAt: string | null;
  lineupCount: number;
  appearanceCount: number;
  eventCount: number;
};

export type FixtureSyncHealthReport = {
  seasonYear: number;
  seasonId: number;
  summary: {
    total: number;
    pending: number;
    partial: number;
    complete: number;
  };
  /** No lineups yet — use POST /fixture-details/pending or /fixture/:id */
  pendingFixtureIds: number[];
  /** Lineups saved but appearances/events incomplete — re-run POST /fixture/:id */
  partialFixtureIds: number[];
  completeFixtureIds: number[];
  fixtures: FixtureSyncHealthRow[];
};

function dedupeById<T extends { id: number }>(rows: T[]): T[] {
  const map = new Map<number, T>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

/** PostgREST returns at most 1000 rows per request unless paginated. */
const SUPABASE_PAGE_SIZE = 1000;

type FixtureChildTable =
  | "fixture_lineups"
  | "fixture_appearances"
  | "fixture_events";

async function countRowsByFixtureId(
  db: Db,
  table: FixtureChildTable,
  fixtureIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (fixtureIds.length === 0) return counts;

  let offset = 0;
  while (true) {
    const { data, error } = await db
      .from(table)
      .select("fixture_id")
      .in("fixture_id", fixtureIds)
      .order("id", { ascending: true })
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

    if (error) throw error;
    const batch = data ?? [];
    if (batch.length === 0) break;

    for (const row of batch) {
      counts.set(row.fixture_id, (counts.get(row.fixture_id) ?? 0) + 1);
    }

    if (batch.length < SUPABASE_PAGE_SIZE) break;
    offset += SUPABASE_PAGE_SIZE;
  }

  return counts;
}

export class CatalogSync {
  constructor(
    readonly db: Db,
    readonly api: ApiFootballClient = new ApiFootballClient(),
  ) {}

  get rateLimitInfo() {
    return this.api.rateLimit;
  }

  async ensureSeason(leagueId: number, seasonYear: number): Promise<number> {
    const { data: existing, error: selectError } = await this.db
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .eq("year", seasonYear)
      .maybeSingle();

    if (selectError) throw selectError;
    if (existing) return existing.id;

    const { data: inserted, error: insertError } = await this.db
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

  private async upsertTeams(
    rows: Database["public"]["Tables"]["teams"]["Insert"][],
  ): Promise<number> {
    if (rows.length === 0) return 0;
    const unique = dedupeById(rows);
    const { error } = await this.db.from("teams").upsert(unique, {
      onConflict: "id",
    });
    if (error) throw error;
    return unique.length;
  }

  private async fetchPlayersByIds(ids: number[]) {
    if (ids.length === 0) {
      return new Map<
        number,
        Database["public"]["Tables"]["players"]["Row"]
      >();
    }
    const { data, error } = await this.db
      .from("players")
      .select("*")
      .in("id", ids);
    if (error) throw error;
    return new Map((data ?? []).map((row) => [row.id, row]));
  }

  private async fetchSquadNationalTeamId(
    playerId: number,
  ): Promise<number | null> {
    const { data, error } = await this.db
      .from("player_season_squads")
      .select("team_id")
      .eq("player_id", playerId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.team_id ?? null;
  }

  private async upsertPlayers(
    rows: PlayerInsert[],
    options?: { mergeWithExisting?: boolean },
  ): Promise<void> {
    if (rows.length === 0) return;
    const unique = dedupeById(rows);
    const merge = options?.mergeWithExisting !== false;

    let toWrite = unique;
    if (merge) {
      const existing = await this.fetchPlayersByIds(unique.map((r) => r.id));
      toWrite = unique.map((incoming) =>
        mergePlayerStub(existing.get(incoming.id) ?? null, incoming),
      );
    }

    const { error } = await this.db.from("players").upsert(toWrite, {
      onConflict: "id",
      ignoreDuplicates: false,
    });
    if (error) throw error;
  }

  private async upsertPlayerProfile(
    row: PlayerInsert,
    clubTeam?: Database["public"]["Tables"]["teams"]["Insert"] | null,
  ): Promise<void> {
    if (clubTeam) {
      await this.upsertTeams([clubTeam]);
    }
    const existing = (await this.fetchPlayersByIds([row.id])).get(row.id) ?? null;
    const squadTeamId = await this.fetchSquadNationalTeamId(row.id);
    const merged = mergePlayerProfile(existing, row, squadTeamId);
    const { error } = await this.db.from("players").upsert(merged, {
      onConflict: "id",
    });
    if (error) throw error;
  }

  /**
   * Full profile from GET /players?id&season — firstname, lastname, nationality, birth_date.
   * Preserves national_team_id when already set or linked via player_season_squads.
   */
  async syncPlayerProfile(
    playerId: number,
    seasonYear?: number,
  ): Promise<PlayerProfileStats> {
    const season =
      seasonYear ?? Number(process.env.API_FOOTBALL_SEASON ?? 2022);
    const res = await this.api.getPlayerProfile(playerId, season);
    const item = res.response[0];
    if (!item?.player) {
      throw new Error(`No profile returned for player ${playerId} season ${season}`);
    }

    const existing = (await this.fetchPlayersByIds([playerId])).get(playerId) ?? null;
    const nationalTeamId =
      existing?.national_team_id ?? (await this.fetchSquadNationalTeamId(playerId));
    const { player: row, clubTeam } = mapPlayerProfile(item, {
      nationalTeamId,
    });
    await this.upsertPlayerProfile(row, clubTeam);

    return {
      playerId,
      name: row.name,
      updated: true,
    };
  }

  async findPlayersNeedingRepair(): Promise<number[]> {
    const { data: players, error: playersError } = await this.db
      .from("players")
      .select("id, name, national_team_id");
    if (playersError) throw playersError;

    const { data: appearances, error: appError } = await this.db
      .from("fixture_appearances")
      .select("player_id");
    if (appError) throw appError;

    const appearanceIds = new Set((appearances ?? []).map((a) => a.player_id));
    const ids = new Set<number>();

    for (const p of players ?? []) {
      if (isPlaceholderPlayerName(p.name)) {
        ids.add(p.id);
        continue;
      }
      if (p.national_team_id == null && appearanceIds.has(p.id)) {
        ids.add(p.id);
      }
    }

    return [...ids].sort((a, b) => a - b);
  }

  async repairPlayers(
    options: RepairPlayersOptions = {},
  ): Promise<RepairPlayersStats> {
    const limit = options.limit ?? 30;
    const candidates = await this.findPlayersNeedingRepair();
    const batch = candidates.slice(0, limit);

    const stats: RepairPlayersStats = {
      candidates: candidates.length,
      repaired: 0,
      failed: 0,
      failures: [],
    };

    for (const playerId of batch) {
      try {
        await this.syncPlayerProfile(playerId, options.seasonYear);
        stats.repaired += 1;
      } catch (err) {
        stats.failed += 1;
        stats.failures.push({
          playerId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return stats;
  }

  /**
   * Job 0 — Bootstrap season catalog (WC 2022 in dev).
   * Order: rounds → fixtures (upsert teams inline) → teams → squads.
   */
  async bootstrapSeason(options: BootstrapOptions = {}): Promise<SyncStats> {
    const leagueId = options.leagueId ?? Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 1);
    const seasonYear =
      options.seasonYear ?? Number(process.env.API_FOOTBALL_SEASON ?? 2022);
    const seasonId = await this.ensureSeason(leagueId, seasonYear);
    const stats: SyncStats = {
      rounds: 0,
      fixtures: 0,
      teams: 0,
      players: 0,
      squads: 0,
    };

    const roundsRes = await this.api.getFixtureRounds(leagueId, seasonYear);
    const roundNames = roundsRes.response;

    const roundIdByName = new Map<string, number>();
    for (let i = 0; i < roundNames.length; i++) {
      const name = roundNames[i];
      const { data, error } = await this.db
        .from("rounds")
        .upsert(
          { season_id: seasonId, name, sort_order: i },
          { onConflict: "season_id,name" },
        )
        .select("id, name")
        .single();
      if (error) throw error;
      roundIdByName.set(name, data.id);
      stats.rounds += 1;
    }

    const teamRows: Database["public"]["Tables"]["teams"]["Insert"][] = [];
    const fixtureRows: Database["public"]["Tables"]["fixtures"]["Insert"][] = [];

    for (const roundName of roundNames) {
      const fixturesRes = await this.api.getFixturesByRound(
        leagueId,
        seasonYear,
        roundName,
      );

      const items = fixturesRes.response;
      if (items.length === 0) {
        continue;
      }

      const roundId = roundIdByName.get(roundName) ?? null;

      for (const item of items) {
        teamRows.push(
          mapTeamFromFixtureSide(item.teams.home, { isNational: true }),
          mapTeamFromFixtureSide(item.teams.away, { isNational: true }),
        );
        fixtureRows.push(
          mapFixtureRow(item, seasonId, roundId, roundName),
        );
      }
    }

    stats.teams += await this.upsertTeams(teamRows);

    if (fixtureRows.length > 0) {
      const uniqueFixtures = dedupeById(fixtureRows);
      const { error } = await this.db.from("fixtures").upsert(uniqueFixtures, {
        onConflict: "id",
      });
      if (error) throw error;
      stats.fixtures = uniqueFixtures.length;
    }

    const teamsRes = await this.api.getTeams(leagueId, seasonYear);
    const leagueTeams = teamsRes.response.map(mapTeamFromLeague);
    stats.teams += await this.upsertTeams(leagueTeams);

    for (const team of leagueTeams) {
      const squadRes = await this.api.getSquad(team.id);
      const squad = squadRes.response[0];
      if (!squad?.players?.length) {
        continue;
      }

      const players = mapPlayersFromSquad(squad);
      await this.upsertPlayers(players);
      stats.players += players.length;

      const links = players.map((p) => ({
        season_id: seasonId,
        team_id: team.id,
        player_id: p.id,
      }));

      const { error } = await this.db
        .from("player_season_squads")
        .upsert(links, { onConflict: "season_id,team_id,player_id" });
      if (error) throw error;
      stats.squads += 1;
    }

    if (options.syncFixtureDetails) {
      const { data: terminalFixtures, error } = await this.db
        .from("fixtures")
        .select("id, status_short")
        .eq("season_id", seasonId)
        .in("status_short", [...TERMINAL_STATUSES]);

      if (error) throw error;

      let detailCount = 0;
      for (const fx of terminalFixtures ?? []) {
        await this.syncFixtureDetail(fx.id);
        detailCount += 1;
      }
      stats.fixtureDetailsSynced = detailCount;
    }

    return stats;
  }

  /**
   * Sync lineups, appearances, and events for terminal fixtures still missing
   * either flag (pending = no lineups yet; partial = lineups ok, appearances not).
   * Skips matches already fully detail-synced.
   */
  async syncPendingFixtureDetails(
    options: PendingFixtureDetailsOptions = {},
  ): Promise<PendingFixtureDetailsStats> {
    const leagueId =
      options.leagueId ?? Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 1);
    const seasonYear =
      options.seasonYear ?? Number(process.env.API_FOOTBALL_SEASON ?? 2022);

    const { data: season, error: seasonError } = await this.db
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .eq("year", seasonYear)
      .maybeSingle();

    if (seasonError) throw seasonError;
    if (!season) {
      throw new Error(
        `Season ${seasonYear} not found — run POST /api/admin/sync/bootstrap first`,
      );
    }

    const { data: fixtures, error: fixturesError } = await this.db
      .from("fixtures")
      .select("id, lineups_synced_at, appearances_synced_at")
      .eq("season_id", season.id)
      .in("status_short", [...TERMINAL_STATUSES])
      .order("kickoff_at", { ascending: true });

    if (fixturesError) throw fixturesError;

    const skippedFixtureIds: number[] = [];
    const pendingIds: number[] = [];

    for (const fx of fixtures ?? []) {
      if (fx.lineups_synced_at && fx.appearances_synced_at) {
        skippedFixtureIds.push(fx.id);
      } else {
        pendingIds.push(fx.id);
      }
    }

    const batch =
      options.limit != null ? pendingIds.slice(0, options.limit) : pendingIds;

    syncLog("pending fixture-details batch start", {
      leagueId,
      seasonYear,
      seasonId: season.id,
      limit: options.limit ?? null,
      pendingTotal: pendingIds.length,
      skippedAlreadySynced: skippedFixtureIds.length,
      batchSize: batch.length,
      batchFixtureIds: batch,
    });

    const stats: PendingFixtureDetailsStats = {
      pending: pendingIds.length,
      skipped: skippedFixtureIds.length,
      synced: 0,
      failed: 0,
      skippedFixtureIds,
      syncedFixtureIds: [],
      failures: [],
    };

    for (const fixtureId of batch) {
      syncLog(`fixture ${fixtureId} — starting detail sync`);
      try {
        const detail = await this.syncFixtureDetail(fixtureId);
        stats.syncedFixtureIds.push(fixtureId);
        stats.synced += 1;
        syncLog(`fixture ${fixtureId} — done`, { ...detail });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        stats.failed += 1;
        stats.failures.push({ fixtureId, error: message });
        console.error(SYNC_LOG, `fixture ${fixtureId} — failed`, message, err);
      }
    }

    syncLog("pending fixture-details batch complete", {
      synced: stats.synced,
      failed: stats.failed,
      syncedFixtureIds: stats.syncedFixtureIds,
      failures: stats.failures,
      remainingPending: pendingIds.length - stats.synced,
    });

    return stats;
  }

  /**
   * Sync lineups, appearances, and events for one fixture.
   * Empty lineup response (200 + []) does not delete existing rows.
   */
  async syncFixtureDetail(
    fixtureId: number,
    options: SyncFixtureDetailOptions = {},
  ): Promise<FixtureDetailStats> {
    const scope = options.scope ?? "full";
    const now = new Date().toISOString();
    const result: FixtureDetailStats = {
      fixtureId,
      lineups: 0,
      appearances: 0,
      events: 0,
      skippedEmptyLineups: false,
      apiResponseCounts: { lineups: 0, playerBlocks: 0, events: 0 },
    };

    const { data: fxMeta } = await this.db
      .from("fixtures")
      .select("status_short, round_name, kickoff_at")
      .eq("id", fixtureId)
      .maybeSingle();

    const fetchLineups = scope === "full" || scope === "live";
    const fetchPlayers = scope === "full";
    const apiSteps =
      scope === "events"
        ? "events"
        : scope === "live"
          ? "lineups → events"
          : "lineups → players → events";

    syncLog(`fixture ${fixtureId} — fetching API (${apiSteps})`, {
      scope,
      statusShort: fxMeta?.status_short ?? null,
      roundName: fxMeta?.round_name ?? null,
      kickoffAt: fxMeta?.kickoff_at ?? null,
    });

    const lineupsRes = fetchLineups
      ? await this.api.getLineups(fixtureId)
      : null;
    if (lineupsRes) {
      syncLog(`fixture ${fixtureId} — API lineups`, {
        ...apiMeta(lineupsRes),
        quota: this.api.lastQuota,
      });
    }

    const playersRes = fetchPlayers
      ? await this.api.getFixturePlayers(fixtureId)
      : null;
    if (playersRes) {
      syncLog(`fixture ${fixtureId} — API players`, {
        ...apiMeta(playersRes),
        quota: this.api.lastQuota,
      });
    }

    const eventsRes = await this.api.getFixtureEvents(fixtureId);
    syncLog(`fixture ${fixtureId} — API events`, {
      ...apiMeta(eventsRes),
      quota: this.api.lastQuota,
    });

    const lineups = lineupsRes?.response ?? [];
    const playerBlocks = playersRes?.response ?? [];
    const events = eventsRes.response;
    const lineupIdIssues =
      fetchLineups && lineups.length > 0 ? auditApiLineupIds(lineups) : [];
    const appearanceIdIssues =
      scope === "full" && playerBlocks.length > 0
        ? auditApiAppearancePlayerIds(playerBlocks)
        : [];
    const playerIdGaps = mergePlayerIdIssues(lineupIdIssues, appearanceIdIssues);

    if (lineupIdIssues.length > 0) {
      for (const issue of lineupIdIssues) {
        syncLog(`fixture ${fixtureId} — invalid lineup slot`, {
          team: issue.teamName,
          role: issue.role,
          playerName: issue.playerName,
          rawPlayerJson: JSON.stringify(issue.rawPlayer),
        });
      }
      syncLog(`fixture ${fixtureId} — API lineups player ids`, {
        teams: summarizeApiLineups(lineups),
        invalidIdCount: lineupIdIssues.length,
      });
    }

    if (appearanceIdIssues.length > 0) {
      for (const issue of appearanceIdIssues) {
        syncLog(`fixture ${fixtureId} — invalid appearance player id`, {
          team: issue.teamName,
          playerName: issue.playerName,
          rawPlayerJson: JSON.stringify(issue.rawPlayer),
        });
      }
    }

    let playerIdOverrides = new Map<string, number>();
    if (playerIdGaps.length > 0) {
      const { overrides, resolved, unresolved } = await buildLineupPlayerIdOverrides(
        this.db,
        playerIdGaps,
      );
      playerIdOverrides = overrides;
      for (const row of resolved) {
        syncLog(`fixture ${fixtureId} — resolved player id from DB`, row);
      }
      for (const row of unresolved) {
        syncLog(`fixture ${fixtureId} — could not resolve player id from DB`, row);
      }
    }

    result.apiResponseCounts = {
      lineups: lineups.length,
      playerBlocks: playerBlocks.length,
      events: events.length,
    };

    if (fetchLineups && lineups.length > 0) {
      const { lineups: lineupRows, playerStubs, skipped } = mapLineups(
        fixtureId,
        lineups,
        { playerIdOverrides },
      );
      if (skipped.length > 0) {
        syncLog(`fixture ${fixtureId} — skipped lineup slots after mapping`, {
          count: skipped.length,
          skipped,
        });
      }
      const coachRows = mapCoaches(fixtureId, lineups);
      syncLog(`fixture ${fixtureId} — writing lineups`, {
        lineupRows: lineupRows.length,
        playerStubs: playerStubs.length,
        coachRows: coachRows.length,
      });
      await this.upsertPlayers(playerStubs);
      await this.db.from("fixture_lineups").delete().eq("fixture_id", fixtureId);
      const { error } = await this.db.from("fixture_lineups").insert(lineupRows);
      if (error) {
        syncLog(`fixture ${fixtureId} — lineups insert failed`, {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        throw error;
      }
      result.lineups = lineupRows.length;

      await this.db.from("fixture_coaches").delete().eq("fixture_id", fixtureId);
      if (coachRows.length > 0) {
        const { error: coachError } = await this.db
          .from("fixture_coaches")
          .insert(coachRows);
        if (coachError) {
          syncLog(`fixture ${fixtureId} — coaches insert failed`, {
            message: coachError.message,
          });
          throw coachError;
        }
      }

      const { error: tsError } = await this.db
        .from("fixtures")
        .update({ lineups_synced_at: now })
        .eq("id", fixtureId);
      if (tsError) {
        syncLog(`fixture ${fixtureId} — lineups_synced_at update failed`, {
          message: tsError.message,
        });
        throw tsError;
      }
      syncLog(`fixture ${fixtureId} — lineups saved`, {
        rows: result.lineups,
        lineups_synced_at: now,
      });
    } else if (fetchLineups) {
      result.skippedEmptyLineups = true;
      syncLog(`fixture ${fixtureId} — skipped lineups (API returned empty)`, {
        note: "lineups_synced_at not set; existing DB rows preserved",
      });
    }

    if (scope === "full" && playerBlocks.length > 0) {
      const { appearances, playerStubs, skipped } = mapAppearances(
        fixtureId,
        playerBlocks,
        { playerIdOverrides },
      );
      if (skipped.length > 0) {
        syncLog(`fixture ${fixtureId} — skipped appearances (no player id)`, {
          count: skipped.length,
          skipped,
        });
      }
      syncLog(`fixture ${fixtureId} — writing appearances`, {
        appearances: appearances.length,
        playerStubs: playerStubs.length,
      });
      await this.upsertPlayers(playerStubs);
      await this.db
        .from("fixture_appearances")
        .delete()
        .eq("fixture_id", fixtureId);
      const { error } = await this.db
        .from("fixture_appearances")
        .insert(appearances);
      if (error) {
        syncLog(`fixture ${fixtureId} — appearances insert failed`, {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        throw error;
      }
      result.appearances = appearances.length;

      const { error: tsError } = await this.db
        .from("fixtures")
        .update({ appearances_synced_at: now })
        .eq("id", fixtureId);
      if (tsError) {
        syncLog(`fixture ${fixtureId} — appearances_synced_at update failed`, {
          message: tsError.message,
        });
        throw tsError;
      }
      syncLog(`fixture ${fixtureId} — appearances saved`, {
        rows: result.appearances,
        appearances_synced_at: now,
      });
    } else if (scope === "full") {
      syncLog(`fixture ${fixtureId} — skipped appearances (API returned empty)`, {
        note: "appearances_synced_at not set",
      });
    }

    if (events.length > 0) {
      const eventRows = mapEvents(fixtureId, events);
      syncLog(`fixture ${fixtureId} — writing events`, {
        eventRows: eventRows.length,
      });
      const playerIds = new Set<number>();
      for (const e of eventRows) {
        if (e.player_id) playerIds.add(e.player_id);
        if (e.assist_player_id) playerIds.add(e.assist_player_id);
      }
      if (playerIds.size > 0) {
        const stubs: PlayerInsert[] = [...playerIds].map((id) => {
          const fromEvent = events.find((ev) => ev.player.id === id);
          const eventName = fromEvent?.player.name?.trim();
          return {
            id,
            name: eventName || `Player ${id}`,
          };
        });
        await this.upsertPlayers(stubs);
      }

      await this.db.from("fixture_events").delete().eq("fixture_id", fixtureId);
      const { error } = await this.db.from("fixture_events").insert(eventRows);
      if (error) {
        syncLog(`fixture ${fixtureId} — events insert failed`, {
          code: error.code,
          message: error.message,
          details: error.details,
        });
        throw error;
      }
      result.events = eventRows.length;
      syncLog(`fixture ${fixtureId} — events saved`, { rows: result.events });
    } else {
      syncLog(`fixture ${fixtureId} — skipped events (API returned empty)`);
    }

    if (fxMeta && TERMINAL_STATUSES.has(fxMeta.status_short)) {
      await this.db
        .from("fixtures")
        .update({ ratings_unlocked_at: now })
        .eq("id", fixtureId)
        .is("ratings_unlocked_at", null);
    }

    const gaps: string[] = [];
    if (result.apiResponseCounts.lineups > 0 && result.lineups === 0) {
      gaps.push("API had lineups but none written");
    }
    if (result.apiResponseCounts.playerBlocks > 0 && result.appearances === 0) {
      gaps.push("API had players but no appearances written");
    }
    if (result.apiResponseCounts.events > 0 && result.events === 0) {
      gaps.push("API had events but none written");
    }
    if (result.skippedEmptyLineups && result.apiResponseCounts.events === 0) {
      gaps.push("no lineups and no events from API");
    }

    syncLog(`fixture ${fixtureId} — summary`, {
      api: result.apiResponseCounts,
      written: {
        lineups: result.lineups,
        appearances: result.appearances,
        events: result.events,
      },
      skippedEmptyLineups: result.skippedEmptyLineups,
      ...(gaps.length > 0 ? { warnings: gaps } : {}),
    });

    return result;
  }

  async getCatalogStatus(seasonYear?: number) {
    const year =
      seasonYear ?? Number(process.env.API_FOOTBALL_SEASON ?? 2022);
    const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 1);

    const { data: season } = await this.db
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .eq("year", year)
      .maybeSingle();

    if (!season) {
      return { seasonYear: year, bootstrapped: false, apiQuota: this.api.lastQuota };
    }

    const seasonId = season.id;

    const countFor = async (
      table: "rounds" | "fixtures" | "player_season_squads",
    ) => {
      const { count, error } = await this.db
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("season_id", seasonId);
      if (error) throw error;
      return count ?? 0;
    };

    const { count: teamCount, error: teamError } = await this.db
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("is_national", true);
    if (teamError) throw teamError;

    const { count: playerCount, error: playerError } = await this.db
      .from("players")
      .select("*", { count: "exact", head: true });
    if (playerError) throw playerError;

    const { count: lineupCount, error: lineupError } = await this.db
      .from("fixture_lineups")
      .select("*", { count: "exact", head: true });
    if (lineupError) throw lineupError;

    const { count: appearanceCount, error: appearanceError } = await this.db
      .from("fixture_appearances")
      .select("*", { count: "exact", head: true });
    if (appearanceError) throw appearanceError;

    const { count: eventCount, error: eventError } = await this.db
      .from("fixture_events")
      .select("*", { count: "exact", head: true });
    if (eventError) throw eventError;

    return {
      seasonYear: year,
      seasonId,
      bootstrapped: true,
      counts: {
        rounds: await countFor("rounds"),
        fixtures: await countFor("fixtures"),
        teams: teamCount ?? 0,
        players: playerCount ?? 0,
        squads: await countFor("player_season_squads"),
        fixture_lineups: lineupCount ?? 0,
        fixture_appearances: appearanceCount ?? 0,
        fixture_events: eventCount ?? 0,
      },
      apiQuota: this.api.lastQuota,
    };
  }

  /**
   * Per-fixture sync state from DB timestamps (source of truth after any interrupted run).
   * - pending: lineups_synced_at IS NULL → not started or failed before lineups saved
   * - partial: lineups ok but appearances_synced_at IS NULL → interrupted mid-detail
   * - complete: lineups + appearances synced
   */
  async getFixtureSyncHealth(seasonYear?: number): Promise<FixtureSyncHealthReport> {
    const year =
      seasonYear ?? Number(process.env.API_FOOTBALL_SEASON ?? 2022);
    const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? 1);

    const { data: season, error: seasonError } = await this.db
      .from("seasons")
      .select("id")
      .eq("league_id", leagueId)
      .eq("year", year)
      .maybeSingle();

    if (seasonError) throw seasonError;
    if (!season) {
      throw new Error(`Season ${year} not found`);
    }

    const { data: rows, error } = await this.db
      .from("fixtures")
      .select(
        `
        id,
        round_name,
        status_short,
        kickoff_at,
        lineups_synced_at,
        appearances_synced_at,
        home_team:teams!fixtures_home_team_id_fkey(name),
        away_team:teams!fixtures_away_team_id_fkey(name)
      `,
      )
      .eq("season_id", season.id)
      .in("status_short", [...TERMINAL_STATUSES])
      .order("kickoff_at", { ascending: true });

    if (error) throw error;

    const fixtureIds = (rows ?? []).map((r) => r.id);
    const [lineupCounts, appearanceCounts, eventCounts] = await Promise.all([
      countRowsByFixtureId(this.db, "fixture_lineups", fixtureIds),
      countRowsByFixtureId(this.db, "fixture_appearances", fixtureIds),
      countRowsByFixtureId(this.db, "fixture_events", fixtureIds),
    ]);

    const pendingFixtureIds: number[] = [];
    const partialFixtureIds: number[] = [];
    const completeFixtureIds: number[] = [];
    const fixtures: FixtureSyncHealthRow[] = [];

    for (const fx of rows ?? []) {
      const home = fx.home_team as { name: string } | null;
      const away = fx.away_team as { name: string } | null;
      const lineupCount = lineupCounts.get(fx.id) ?? 0;
      const appearanceCount = appearanceCounts.get(fx.id) ?? 0;
      const eventCount = eventCounts.get(fx.id) ?? 0;

      let state: FixtureSyncState;
      if (!fx.lineups_synced_at) {
        state = "pending";
        pendingFixtureIds.push(fx.id);
      } else if (!fx.appearances_synced_at) {
        state = "partial";
        partialFixtureIds.push(fx.id);
      } else {
        state = "complete";
        completeFixtureIds.push(fx.id);
      }

      fixtures.push({
        fixtureId: fx.id,
        roundName: fx.round_name,
        homeTeam: home?.name ?? "?",
        awayTeam: away?.name ?? "?",
        statusShort: fx.status_short,
        state,
        lineupsSyncedAt: fx.lineups_synced_at,
        appearancesSyncedAt: fx.appearances_synced_at,
        lineupCount,
        appearanceCount,
        eventCount,
      });
    }

    return {
      seasonYear: year,
      seasonId: season.id,
      summary: {
        total: fixtures.length,
        pending: pendingFixtureIds.length,
        partial: partialFixtureIds.length,
        complete: completeFixtureIds.length,
      },
      pendingFixtureIds,
      partialFixtureIds,
      completeFixtureIds,
      fixtures,
    };
  }

  /** Job 1 — forward fixture window (kickoff, status, postponements). */
  syncDailyWindow(options?: DailyWindowOptions) {
    return runDailyWindow(this, options);
  }

  /** Job 2 — today/yesterday refresh + terminal detail sync. */
  syncMatchdayBatch(options?: MatchdayBatchOptions) {
    return runMatchdayBatch(this, options);
  }
}
