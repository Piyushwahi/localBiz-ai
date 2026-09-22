/**
 * types/index.js
 * JSDoc type definitions for all LocalBiz AI data shapes.
 * These mirror the backend Pydantic models in app/schemas/requests.py
 */

/**
 * @typedef {Object} Coordinates
 * @property {number} latitude
 * @property {number} longitude
 */

/**
 * @typedef {Object} RouteInfo
 * @property {number} straight_line_km
 * @property {number|null} driving_km
 * @property {number|null} driving_minutes
 * @property {number|null} walking_km
 * @property {number|null} walking_minutes
 */

/**
 * @typedef {Object} Candidate
 * @property {string} id
 * @property {string} label
 * @property {Coordinates} coordinates
 * @property {number} competitor_count
 * @property {number} amenity_count
 * @property {number} population_proxy_score
 * @property {RouteInfo} route_info
 * @property {Record<string, number>} poi_summary
 * @property {string} geographic_profile
 */

/**
 * @typedef {Object} POI
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {Coordinates} coordinates
 * @property {string} [address]
 */

/**
 * @typedef {Object} CandidateReport
 * @property {string} candidate_id
 * @property {number} ai_analysis_score
 * @property {string} summary
 * @property {string[]} strengths
 * @property {string[]} weaknesses
 * @property {string[]} uncertainties
 * @property {string} recommendation
 */

/**
 * @typedef {Object} FinalReport
 * @property {string} overall_recommendation
 * @property {CandidateReport[]} candidate_reports
 * @property {string} responsible_ai_notice
 * @property {string} methodology_note
 */

/**
 * @typedef {Object} DebateEvent
 * @property {string} id
 * @property {string} agent
 * @property {string} event_type
 * @property {string} content
 * @property {string} timestamp
 * @property {string} candidate_id
 */

/**
 * @typedef {Object} DebateData
 * @property {string} status
 * @property {number} current_round
 * @property {DebateEvent[]} events
 * @property {Record<string, any[]>} specialist_outputs
 * @property {any[]} critic_challenges
 * @property {Record<string, any[]>} fact_check_results
 */

/**
 * @typedef {Object} AnalysisData
 * @property {string} analysis_id
 * @property {string} status
 * @property {Coordinates} home_coordinates
 * @property {string} home_address
 * @property {POI[]} pois
 * @property {Candidate[]} candidates
 * @property {FinalReport|null} final_report
 * @property {boolean} demo_mode
 */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status
 * @property {boolean} azure_maps_configured
 * @property {boolean} foundry_configured
 * @property {boolean} demo_mode
 * @property {string} model_deployment
 */

/**
 * @typedef {'idle'|'starting'|'geocoding'|'maps_fetching'|'generating_candidates'|'debating'|'complete'|'error'} AnalysisStatus
 */

/**
 * @typedef {'restaurant'|'cafe'|'retail'|'pharmacy'|'gym'|'salon'|'office'|'clinic'|'bakery'|'bar'} BusinessType
 */

export const ANALYSIS_STATUSES = /** @type {const} */ ({
  IDLE: 'idle',
  STARTING: 'starting',
  GEOCODING: 'geocoding',
  MAPS_FETCHING: 'maps_fetching',
  GENERATING_CANDIDATES: 'generating_candidates',
  DEBATING: 'debating',
  COMPLETE: 'complete',
  ERROR: 'error',
})

export const EVIDENCE_TYPES = /** @type {const} */ ({
  VERIFIED: 'VERIFIED',
  CALCULATED: 'CALCULATED',
  ESTIMATED: 'ESTIMATED',
  UNKNOWN: 'UNKNOWN',
  AI_GENERATED: 'AI_GENERATED',
})
