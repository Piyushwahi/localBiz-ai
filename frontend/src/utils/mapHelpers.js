/**
 * utils/mapHelpers.js
 * Map-related utility functions (coordinate math, bounds, marker helpers).
 */

/** WGS-84 earth radius in km */
const EARTH_RADIUS_KM = 6371

/**
 * Convert degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
export function toRad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Haversine great-circle distance between two lat/lon points.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in km
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/**
 * Compute a bounding box that contains all given lat/lon points
 * with an optional padding in degrees.
 * @param {Array<{latitude: number, longitude: number}>} points
 * @param {number} paddingDeg
 * @returns {{ minLat: number, maxLat: number, minLon: number, maxLon: number } | null}
 */
export function boundingBox(points, paddingDeg = 0.02) {
  if (!points?.length) return null
  const lats = points.map((p) => p.latitude)
  const lons = points.map((p) => p.longitude)
  return {
    minLat: Math.min(...lats) - paddingDeg,
    maxLat: Math.max(...lats) + paddingDeg,
    minLon: Math.min(...lons) - paddingDeg,
    maxLon: Math.max(...lons) + paddingDeg,
  }
}

/**
 * Return the centroid of an array of lat/lon coordinate objects.
 * @param {Array<{latitude: number, longitude: number}>} points
 * @returns {{ latitude: number, longitude: number } | null}
 */
export function centroid(points) {
  if (!points?.length) return null
  const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length
  const lon = points.reduce((s, p) => s + p.longitude, 0) / points.length
  return { latitude: lat, longitude: lon }
}

/**
 * Cluster POIs into a grid of cells and return the count per cell.
 * Useful for heatmap overlays.
 * @param {Array<{coordinates: {latitude: number, longitude: number}}>} pois
 * @param {number} gridSize degrees per cell
 * @returns {Array<{lat: number, lon: number, count: number}>}
 */
export function clusterPOIs(pois = [], gridSize = 0.005) {
  const cells = {}
  for (const poi of pois) {
    const { latitude: lat, longitude: lon } = poi.coordinates
    const key = `${Math.round(lat / gridSize)},${Math.round(lon / gridSize)}`
    if (!cells[key]) {
      cells[key] = {
        lat: Math.round(lat / gridSize) * gridSize,
        lon: Math.round(lon / gridSize) * gridSize,
        count: 0,
      }
    }
    cells[key].count++
  }
  return Object.values(cells)
}

/**
 * Map a score 0–10 to a CSS colour string (red→amber→green).
 * @param {number|null} score
 * @returns {string} hex colour
 */
export function scoreToColor(score) {
  if (score == null) return '#64748b' // slate-500 for unknown
  if (score >= 7) return '#22c55e'    // green-500
  if (score >= 4) return '#f59e0b'    // amber-500
  return '#ef4444'                     // red-500
}
