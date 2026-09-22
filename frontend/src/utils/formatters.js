/**
 * utils/formatters.js
 * Formatting helpers for display values across the app.
 */

/**
 * Format a distance value for display.
 * @param {number|null} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (km == null) return 'Unknown'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

/**
 * Format a duration in minutes for display.
 * @param {number|null} minutes
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (minutes == null) return 'Unknown'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

/**
 * Format an AI score (0–10) to 1 decimal place.
 * @param {number|null} score
 * @returns {string}
 */
export function formatScore(score) {
  if (score == null) return '—'
  return `${score.toFixed(1)}/10`
}

/**
 * Format a timestamp ISO string to a readable local time.
 * @param {string} iso
 * @returns {string}
 */
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Truncate a string to a maximum length, appending "…" if cut.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max = 120) {
  if (!str || str.length <= max) return str ?? ''
  return str.slice(0, max).trimEnd() + '…'
}

/**
 * Convert a snake_case or underscore_id to Title Case for display.
 * @param {string} id
 * @returns {string}
 */
export function idToLabel(id = '') {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Return the competition level label and colour class for a competitor count.
 * @param {number} count
 * @returns {{ level: string, colorClass: string }}
 */
export function competitorLevel(count) {
  if (count >= 4) return { level: 'High', colorClass: 'text-red-400' }
  if (count >= 2) return { level: 'Medium', colorClass: 'text-amber-400' }
  return { level: 'Low', colorClass: 'text-emerald-400' }
}

/**
 * Map an analysis status string to a human-readable label.
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  const labels = {
    idle: 'Ready',
    starting: 'Starting…',
    geocoding: 'Geocoding location…',
    maps_fetching: 'Fetching map data…',
    generating_candidates: 'Generating candidates…',
    debating: 'AI agents debating…',
    complete: 'Analysis complete',
    error: 'Error',
    polling: 'Waiting for results…',
  }
  return labels[status] ?? status
}

/**
 * Summarise a POI summary object as a short readable string.
 * e.g. { restaurant: 3, cafe: 2 } → "3 restaurants, 2 cafes"
 * @param {Record<string, number>} summary
 * @param {number} limit
 * @returns {string}
 */
export function summarisePOIs(summary = {}, limit = 3) {
  return Object.entries(summary)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([cat, n]) => `${n} ${cat}`)
    .join(', ')
}
