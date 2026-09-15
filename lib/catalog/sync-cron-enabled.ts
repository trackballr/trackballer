/**
 * Master switch for all outbound API-Football calls.
 * Temporary while the vendor subscription is inactive.
 *
 * When false: cron sync and admin sync do not hit the API; standings pages serve
 * the last cached table only (~30-day TTL, no new fetches).
 * Set to true when resuming sync and live standings.
 */
export const API_FOOTBALL_ENABLED = false

/** Cron deferred handlers — same gate as API_FOOTBALL_ENABLED. */
export const CATALOG_SYNC_CRON_ENABLED = API_FOOTBALL_ENABLED
