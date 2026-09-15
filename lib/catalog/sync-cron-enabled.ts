/**
 * Master switch for all outbound API-Football calls.
 * Temporary while the vendor subscription is inactive.
 *
 * When false: cron sync, page-load standings, and admin sync routes do not hit the API.
 * Set to true when resuming sync and live standings.
 */
export const API_FOOTBALL_ENABLED = false

/** Cron deferred handlers — same gate as API_FOOTBALL_ENABLED. */
export const CATALOG_SYNC_CRON_ENABLED = API_FOOTBALL_ENABLED
