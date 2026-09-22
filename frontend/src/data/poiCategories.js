/**
 * data/poiCategories.js
 * Mapping from Azure Maps POI category strings → display label + colour.
 * Used by MapView and CandidateCard to consistently style POI markers/tags.
 */

/**
 * @typedef {Object} POICategoryConfig
 * @property {string} label       Short display label
 * @property {string} color       Hex colour for map markers / badges
 * @property {string} emoji       Emoji icon
 */

/** @type {Record<string, POICategoryConfig>} */
const POI_CATEGORY_MAP = {
  restaurant:        { label: 'Restaurant',   color: '#f97316', emoji: '🍽️' },
  cafe:              { label: 'Café',          color: '#a78bfa', emoji: '☕' },
  coffee:            { label: 'Coffee',        color: '#a78bfa', emoji: '☕' },
  bar:               { label: 'Bar',           color: '#60a5fa', emoji: '🍺' },
  pub:               { label: 'Pub',           color: '#60a5fa', emoji: '🍺' },
  bakery:            { label: 'Bakery',        color: '#fbbf24', emoji: '🥐' },
  pharmacy:          { label: 'Pharmacy',      color: '#34d399', emoji: '💊' },
  chemist:           { label: 'Chemist',       color: '#34d399', emoji: '💊' },
  gym:               { label: 'Gym',           color: '#f43f5e', emoji: '🏋️' },
  fitness:           { label: 'Fitness',       color: '#f43f5e', emoji: '🏋️' },
  salon:             { label: 'Salon',         color: '#ec4899', emoji: '💇' },
  beauty:            { label: 'Beauty',        color: '#ec4899', emoji: '💇' },
  supermarket:       { label: 'Supermarket',   color: '#4ade80', emoji: '🛒' },
  grocery:           { label: 'Grocery',       color: '#4ade80', emoji: '🥦' },
  school:            { label: 'School',        color: '#facc15', emoji: '🏫' },
  hospital:          { label: 'Hospital',      color: '#ef4444', emoji: '🏥' },
  clinic:            { label: 'Clinic',        color: '#fb923c', emoji: '🏥' },
  park:              { label: 'Park',          color: '#86efac', emoji: '🌳' },
  bank:              { label: 'Bank',          color: '#6ee7b7', emoji: '🏦' },
  atm:               { label: 'ATM',           color: '#6ee7b7', emoji: '💳' },
  hotel:             { label: 'Hotel',         color: '#93c5fd', emoji: '🏨' },
  parking:           { label: 'Parking',       color: '#94a3b8', emoji: '🅿️' },
  transport:         { label: 'Transport',     color: '#818cf8', emoji: '🚌' },
  transit:           { label: 'Transit',       color: '#818cf8', emoji: '🚇' },
  office:            { label: 'Office',        color: '#cbd5e1', emoji: '🏢' },
  retail:            { label: 'Retail',        color: '#fde68a', emoji: '🛍️' },
  shop:              { label: 'Shop',          color: '#fde68a', emoji: '🛍️' },
}

/**
 * Get display config for a POI category string.
 * Falls back to a generic grey pin for unknown categories.
 * @param {string} category
 * @returns {POICategoryConfig}
 */
export function getPOICategory(category = '') {
  const key = category.toLowerCase().split(/[\s_/]+/)[0]
  return (
    POI_CATEGORY_MAP[key] ?? { label: category, color: '#64748b', emoji: '📍' }
  )
}

export default POI_CATEGORY_MAP
