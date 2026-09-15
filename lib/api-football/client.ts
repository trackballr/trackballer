import { API_FOOTBALL_ENABLED } from "@/lib/catalog/sync-cron-enabled";

import type {
  ApiFixtureEventItem,
  ApiFixtureItem,
  ApiFixturePlayersItem,
  ApiFootballResponse,
  ApiLeagueTeamItem,
  ApiLineupItem,
  ApiPlayerProfileItem,
  ApiQuotaHeaders,
  ApiSquadItem,
} from "./types";
import { ApiRateLimiter, rateLimitRetryDelayMs } from "./rate-limit";

const DEFAULT_BASE_URL = "https://v3.football.api-sports.io";

export class ApiFootballClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly rateLimiter: ApiRateLimiter;
  lastQuota: ApiQuotaHeaders = {};

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    rateLimiter?: ApiRateLimiter;
  }) {
    this.baseUrl = (
      options?.baseUrl ??
      process.env.API_FOOTBALL_BASE_URL ??
      DEFAULT_BASE_URL
    ).replace(/\/$/, "");
    this.apiKey = options?.apiKey ?? process.env.API_FOOTBALL_KEY ?? "";

    if (!this.apiKey) {
      throw new Error("Missing API_FOOTBALL_KEY");
    }
    this.rateLimiter = options?.rateLimiter ?? new ApiRateLimiter();
  }

  get rateLimit() {
    return {
      requestsPerMinute: this.rateLimiter.requestsPerMinute,
      minIntervalMs: this.rateLimiter.minIntervalMs,
    };
  }

  private async get<T>(
    path: string,
    params: Record<string, string | number>,
  ): Promise<ApiFootballResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    return this.fetchWithRateLimit(url.toString(), path);
  }

  private async fetchWithRateLimit<T>(
    url: string,
    path: string,
    retried = false,
  ): Promise<ApiFootballResponse<T>> {
    if (!API_FOOTBALL_ENABLED) {
      throw new Error(
        "API-Football calls are paused (API_FOOTBALL_ENABLED=false in lib/catalog/sync-cron-enabled.ts)",
      );
    }

    await this.rateLimiter.waitForSlot();

    const res = await fetch(url, {
      headers: { "x-apisports-key": this.apiKey },
      cache: "no-store",
    });

    this.lastQuota = {
      remainingDay: res.headers.get("x-ratelimit-requests-remaining") ?? undefined,
      remainingMinute:
        res.headers.get("x-ratelimit-limit-remaining") ?? undefined,
    };

    if (res.status === 429 && !retried) {
      await new Promise((r) => setTimeout(r, rateLimitRetryDelayMs()));
      return this.fetchWithRateLimit(url, path, true);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API-Football ${res.status} ${path}: ${body}`);
    }

    const json = (await res.json()) as ApiFootballResponse<T>;
    const errors = json.errors;
    if (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors ?? {}).length > 0) {
      throw new Error(
        `API-Football error on ${path}: ${JSON.stringify(errors)}`,
      );
    }

    return json;
  }

  getFixtureRounds(leagueId: number, season: number) {
    return this.get<string[]>("/fixtures/rounds", {
      league: leagueId,
      season,
    });
  }

  getFixturesByRound(leagueId: number, season: number, round: string) {
    return this.get<ApiFixtureItem[]>("/fixtures", {
      league: leagueId,
      season,
      round,
    });
  }

  getFixturesByDateWindow(
    leagueId: number,
    season: number,
    from: string,
    to: string,
    timezone = "UTC",
  ) {
    return this.get<ApiFixtureItem[]>("/fixtures", {
      league: leagueId,
      season,
      from,
      to,
      timezone,
    });
  }

  getFixturesByIds(ids: number[]) {
    if (ids.length === 0) {
      return Promise.resolve({
        get: "/fixtures",
        parameters: {},
        errors: [],
        results: 0,
        response: [] as ApiFixtureItem[],
      } satisfies ApiFootballResponse<ApiFixtureItem[]>);
    }
    if (ids.length > 20) {
      throw new Error("API-Football allows at most 20 fixture ids per request");
    }
    return this.get<ApiFixtureItem[]>("/fixtures", {
      ids: ids.join("-"),
    });
  }

  getTeams(leagueId: number, season: number) {
    return this.get<ApiLeagueTeamItem[]>("/teams", {
      league: leagueId,
      season,
    });
  }

  getSquad(teamId: number) {
    return this.get<ApiSquadItem[]>("/players/squads", { team: teamId });
  }

  getLineups(fixtureId: number) {
    return this.get<ApiLineupItem[]>("/fixtures/lineups", {
      fixture: fixtureId,
    });
  }

  getFixturePlayers(fixtureId: number) {
    return this.get<ApiFixturePlayersItem[]>("/fixtures/players", {
      fixture: fixtureId,
    });
  }

  getFixtureEvents(fixtureId: number) {
    return this.get<ApiFixtureEventItem[]>("/fixtures/events", {
      fixture: fixtureId,
    });
  }

  getPlayerProfile(playerId: number, season: number) {
    return this.get<ApiPlayerProfileItem[]>("/players", {
      id: playerId,
      season,
    });
  }

  getPlayersByTeamSeason(teamId: number, season: number, page = 1) {
    return this.get<ApiPlayerProfileItem[]>("/players", {
      team: teamId,
      season,
      page,
    });
  }

  getPlayersByLeagueSeason(leagueId: number, season: number, page = 1) {
    return this.get<ApiPlayerProfileItem[]>("/players", {
      league: leagueId,
      season,
      page,
    });
  }
}
