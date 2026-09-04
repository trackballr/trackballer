import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApiFixtureItem } from "@/lib/api-football/types";
import type { Database } from "@/lib/database.types";
import {
  mapFixtureRow,
  mapTeamFromFixtureSide,
} from "@/lib/catalog-sync/mappers";
import { roundSortOrderFromName } from "@/lib/catalog/rounds";

type Db = SupabaseClient<Database>;

function dedupeById<T extends { id: number }>(rows: T[]): T[] {
  const map = new Map<number, T>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

async function upsertTeams(
  db: Db,
  rows: Database["public"]["Tables"]["teams"]["Insert"][],
): Promise<number> {
  if (rows.length === 0) return 0;
  const unique = dedupeById(rows);
  const { error } = await db.from("teams").upsert(unique, { onConflict: "id" });
  if (error) throw error;
  return unique.length;
}

async function ensureRoundIds(
  db: Db,
  seasonId: number,
  roundNames: string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(roundNames.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const rows = unique.map((name) => ({
    season_id: seasonId,
    name,
    sort_order: roundSortOrderFromName(name),
  }));

  const { error: upsertError } = await db
    .from("rounds")
    .upsert(rows, { onConflict: "season_id,name" });
  if (upsertError) throw upsertError;

  const { data, error } = await db
    .from("rounds")
    .select("id, name")
    .eq("season_id", seasonId)
    .in("name", unique);

  if (error) throw error;
  return new Map((data ?? []).map((r) => [r.name, r.id]));
}

/** Upsert teams and fixtures from API-Football fixture list items. */
export async function upsertApiFixtureBatch(
  db: Db,
  seasonId: number,
  items: ApiFixtureItem[],
  options: { isNational?: boolean } = {},
): Promise<{ fixtures: number; teams: number }> {
  if (items.length === 0) return { fixtures: 0, teams: 0 };

  const isNational = options.isNational ?? true;
  const teamRows: Database["public"]["Tables"]["teams"]["Insert"][] = [];
  for (const item of items) {
    teamRows.push(
      mapTeamFromFixtureSide(item.teams.home, { isNational }),
      mapTeamFromFixtureSide(item.teams.away, { isNational }),
    );
  }
  const teams = await upsertTeams(db, teamRows);

  const roundNames = items.map((item) => item.league.round ?? "Unknown");
  const roundIdByName = await ensureRoundIds(db, seasonId, roundNames);

  const fixtureRows: Database["public"]["Tables"]["fixtures"]["Insert"][] =
    items.map((item) => {
      const roundName = item.league.round ?? "Unknown";
      return mapFixtureRow(
        item,
        seasonId,
        roundIdByName.get(roundName) ?? null,
        roundName,
      );
    });

  const uniqueFixtures = dedupeById(fixtureRows);
  const { error } = await db.from("fixtures").upsert(uniqueFixtures, {
    onConflict: "id",
  });
  if (error) throw error;

  return { fixtures: uniqueFixtures.length, teams };
}
