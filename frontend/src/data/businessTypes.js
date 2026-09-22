/**
 * data/businessTypes.js
 * Static configuration for each supported business type.
 * These correspond exactly to the backend BusinessType enum in app/schemas/requests.py
 */

/**
 * @typedef {Object} BusinessTypeConfig
 * @property {string} value        Backend enum value
 * @property {string} label        Display label
 * @property {string} emoji        Icon emoji for quick rendering
 * @property {string} description  Short description for the UI
 * @property {string[]} keywords   POI search keywords used by Azure Maps
 */

/** @type {BusinessTypeConfig[]} */
export const BUSINESS_TYPES = [
  {
    value: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    description: 'Full-service dining establishment',
    keywords: ['restaurant', 'dining', 'eatery'],
  },
  {
    value: 'cafe',
    label: 'Café / Coffee Shop',
    emoji: '☕',
    description: 'Coffee shop or casual café',
    keywords: ['cafe', 'coffee', 'espresso'],
  },
  {
    value: 'retail',
    label: 'Retail Store',
    emoji: '🛍️',
    description: 'General retail or specialty shop',
    keywords: ['shop', 'store', 'retail'],
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy',
    emoji: '💊',
    description: 'Pharmacy or chemist',
    keywords: ['pharmacy', 'chemist', 'drugstore'],
  },
  {
    value: 'gym',
    label: 'Gym / Fitness',
    emoji: '🏋️',
    description: 'Gym, fitness centre or studio',
    keywords: ['gym', 'fitness', 'sports'],
  },
  {
    value: 'salon',
    label: 'Hair / Beauty Salon',
    emoji: '💇',
    description: 'Hair salon, barber or beauty studio',
    keywords: ['salon', 'barber', 'beauty'],
  },
  {
    value: 'office',
    label: 'Office / Co-working',
    emoji: '🏢',
    description: 'Professional office or co-working space',
    keywords: ['office', 'coworking', 'business centre'],
  },
  {
    value: 'clinic',
    label: 'Medical Clinic',
    emoji: '🏥',
    description: 'GP practice, specialist clinic or health centre',
    keywords: ['clinic', 'medical', 'doctor', 'gp'],
  },
  {
    value: 'bakery',
    label: 'Bakery',
    emoji: '🥐',
    description: 'Artisan bakery or patisserie',
    keywords: ['bakery', 'patisserie', 'bread'],
  },
  {
    value: 'bar',
    label: 'Bar / Pub',
    emoji: '🍺',
    description: 'Bar, pub or cocktail lounge',
    keywords: ['bar', 'pub', 'tavern', 'lounge'],
  },
]

/**
 * Look up a BusinessTypeConfig by its value string.
 * Falls back to a sensible default so nothing crashes on unknown types.
 * @param {string} value
 * @returns {BusinessTypeConfig}
 */
export function getBusinessType(value) {
  return (
    BUSINESS_TYPES.find((t) => t.value === value) ?? {
      value,
      label: value,
      emoji: '📍',
      description: '',
      keywords: [],
    }
  )
}

/**
 * Options array formatted for a <select> element.
 * @returns {Array<{value: string, label: string}>}
 */
export const BUSINESS_TYPE_OPTIONS = BUSINESS_TYPES.map(({ value, label, emoji }) => ({
  value,
  label: `${emoji} ${label}`,
}))
