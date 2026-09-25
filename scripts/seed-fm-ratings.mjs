#!/usr/bin/env node
// Seed players.fm_base_rating from a CSV export (1–100 integer OVR).
// Then refresh provisional career aggregates:
//   node --env-file=.env scripts/backfill-career-aggregates.mjs
//
// Usage:
//   node --env-file=.env scripts/seed-fm-ratings.mjs ../fm_ratings_main_2026.csv
//   node --env-file=.env scripts/seed-fm-ratings.mjs ../players_with_fm_ratings.csv --dry-run

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BATCH_SIZE = 50;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in env.");
  process.exit(1);
}

const csvArg = process.argv.find((arg) => !arg.startsWith("-") && arg.endsWith(".csv"));
if (!csvArg) {
  console.error("Usage: node --env-file=.env scripts/seed-fm-ratings.mjs <path/to/file.csv> [--dry-run]");
  process.exit(1);
}

const isDryRun = process.argv.includes("--dry-run");
const csvPath = resolve(csvArg);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Minimal RFC-style CSV parser (handles quoted fields). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      if (ch === "\r") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  const [header, ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(header.map((key, idx) => [key.trim(), (cells[idx] ?? "").trim()])),
  );
}

/** Accept fm_base_rating (100-scale) or legacy fm_rating (1–10 scale). */
function normalizeFmRating(row) {
  const raw = row.fm_base_rating || row.fm_rating;
  if (!raw) return null;

  const n = Number(raw);
  if (Number.isNaN(n)) return null;

  const score = n <= 10 ? Math.round(n * 10) : Math.round(n);
  if (score < 1 || score > 100) return null;
  return score;
}

let rows;
try {
  rows = parseCsv(readFileSync(csvPath, "utf8"));
} catch (readError) {
  console.error(`Failed to read ${csvPath}:`, readError.message);
  process.exit(1);
}

const updates = [];
const skipped = { noId: 0, noRating: 0, invalidRating: 0 };

for (const row of rows) {
  const id = Number(row.id);
  if (!Number.isInteger(id) || id <= 0) {
    skipped.noId++;
    continue;
  }

  const fm = normalizeFmRating(row);
  if (fm == null) {
    if (row.fm_base_rating || row.fm_rating) skipped.invalidRating++;
    else skipped.noRating++;
    continue;
  }

  updates.push({ id, fm_base_rating: fm });
}

console.log(`CSV: ${csvPath}`);
console.log(`Rows parsed: ${rows.length}`);
console.log(`To seed: ${updates.length}`);
console.log(
  `Skipped: no id=${skipped.noId}, no rating=${skipped.noRating}, invalid=${skipped.invalidRating}`,
);

if (isDryRun) {
  console.log("\nDRY RUN — first 5:");
  for (const u of updates.slice(0, 5)) console.log(`  ${JSON.stringify(u)}`);
  process.exit(0);
}

let ok = 0;
let failed = 0;
let notFound = 0;

for (let i = 0; i < updates.length; i += BATCH_SIZE) {
  const batch = updates.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(
    batch.map(({ id, fm_base_rating }) =>
      supabase
        .from("players")
        .update({ fm_base_rating, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id")
        .then(({ data, error: updateError }) => {
          if (updateError) return { id, ok: false, error: updateError.message };
          if (!data?.length) return { id, ok: false, notFound: true };
          return { id, ok: true };
        }),
    ),
  );

  for (const res of results) {
    if (res.ok) ok++;
    else if (res.notFound) notFound++;
    else failed++;
  }

  process.stdout.write(`\r  progress: ${Math.min(i + BATCH_SIZE, updates.length)}/${updates.length}`);
}
process.stdout.write("\n");

console.log(`Done. updated=${ok} not_found=${notFound} failed=${failed}`);
if (ok > 0) {
  console.log("Next: node --env-file=.env scripts/backfill-career-aggregates.mjs");
}
process.exit(failed > 0 ? 2 : 0);
