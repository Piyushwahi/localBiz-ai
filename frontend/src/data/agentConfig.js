/**
 * data/agentConfig.js
 * Display names, descriptions, and colours for the 9 AI debate agents.
 * These correspond to the agent roles used by the backend orchestrator.
 */

/**
 * @typedef {Object} AgentConfig
 * @property {string} id          Agent identifier (matches backend event.agent)
 * @property {string} name        Display name
 * @property {string} role        Short role description
 * @property {string} color       Hex accent colour for the UI
 * @property {string} emoji       Emoji icon
 * @property {string} specialty   What this agent focuses on
 */

/** @type {AgentConfig[]} */
export const AGENTS = [
  {
    id: 'market_analyst',
    name: 'Market Analyst',
    role: 'Specialist',
    color: '#3b82f6',
    emoji: '📊',
    specialty: 'Competitive landscape and demand signals',
  },
  {
    id: 'location_scout',
    name: 'Location Scout',
    role: 'Specialist',
    color: '#22c55e',
    emoji: '🗺️',
    specialty: 'Physical location quality and accessibility',
  },
  {
    id: 'demographic_analyst',
    name: 'Demographic Analyst',
    role: 'Specialist',
    color: '#a78bfa',
    emoji: '👥',
    specialty: 'Population density and customer catchment',
  },
  {
    id: 'infrastructure_analyst',
    name: 'Infrastructure Analyst',
    role: 'Specialist',
    color: '#f59e0b',
    emoji: '🏗️',
    specialty: 'Transport links, parking, and local amenities',
  },
  {
    id: 'risk_analyst',
    name: 'Risk Analyst',
    role: 'Specialist',
    color: '#ef4444',
    emoji: '⚠️',
    specialty: 'Risk factors and business vulnerabilities',
  },
  {
    id: 'critic',
    name: 'Critic Agent',
    role: 'Critic',
    color: '#f97316',
    emoji: '🔍',
    specialty: 'Challenges overconfident claims and seeks evidence',
  },
  {
    id: 'fact_checker',
    name: 'Fact Checker',
    role: 'Fact Checker',
    color: '#06b6d4',
    emoji: '✅',
    specialty: 'Verifies claims against Azure Maps ground-truth data',
  },
  {
    id: 'devil_advocate',
    name: "Devil's Advocate",
    role: 'Devil\'s Advocate',
    color: '#ec4899',
    emoji: '😈',
    specialty: 'Constructs the strongest possible counter-argument',
  },
  {
    id: 'judge',
    name: 'Judge Agent',
    role: 'Judge',
    color: '#fbbf24',
    emoji: '⚖️',
    specialty: 'Synthesises debate into a final evidence-weighted report',
  },
]

/**
 * Get an agent's config by its ID string.
 * @param {string} id
 * @returns {AgentConfig}
 */
export function getAgent(id = '') {
  return (
    AGENTS.find((a) => a.id === id || id.toLowerCase().includes(a.id)) ?? {
      id,
      name: id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      role: 'Agent',
      color: '#64748b',
      emoji: '🤖',
      specialty: '',
    }
  )
}

/** Candidate colour palette — index → hex */
export const CANDIDATE_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // violet
]

/**
 * Get the colour for a candidate by its zero-based index.
 * @param {number} index
 * @returns {string}
 */
export function getCandidateColor(index) {
  return CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]
}
