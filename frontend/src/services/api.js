/**
 * API service — all requests go to FastAPI backend.
 * Azure credentials are NEVER handled here.
 * The backend communicates with Azure Maps and Foundry.
 */

import axios from 'axios'

const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim()
const sanitizedEnvUrl = rawEnvUrl.replace(/\/+$/, '')
const baseURL = sanitizedEnvUrl
  ? (sanitizedEnvUrl.endsWith('/api') ? sanitizedEnvUrl : `${sanitizedEnvUrl}/api`)
  : '/api'

const api = axios.create({
  baseURL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// Request logging for diagnostics (no secrets exposed)
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response error logging for diagnostics (diagnose Network Error / CORS issues)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const targetUrl = error.config
      ? `${error.config.baseURL || ''}${error.config.url || ''}`
      : 'unknown'
    console.error(`[API Network Error] ${error.config?.method?.toUpperCase() || 'GET'} ${targetUrl}:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      detail: error.response?.data?.detail,
    })
    return Promise.reject(error)
  }
)

// ── Health ──────────────────────────────────────
export const checkHealth = () => api.get('/health').then(r => r.data)

// ── Location / Geocoding / Maps Key ─────────────
export const getMapsKey = () => api.get('/location/maps-key').then(r => r.data)

export const searchAddress = (address) =>
  api.post('/location/search', { address }).then(r => r.data)

export const startAnalysis = (payload) =>
  api.post('/location/analyze', payload).then(r => r.data)

export const getAnalysisStatus = (id) =>
  api.get(`/location/${id}`).then(r => r.data)

// ── Analysis ────────────────────────────────────
export const getFullAnalysis = (id) =>
  api.get(`/analysis/${id}`).then(r => r.data)

export const getPOIs = (id, category = null) => {
  const params = category ? { category } : {}
  return api.get(`/analysis/${id}/pois`, { params }).then(r => r.data)
}

// ── Candidates ──────────────────────────────────
export const getCandidates = (id) =>
  api.get(`/candidates/${id}`).then(r => r.data)

export const findAlternatives = (id, excludeIds = []) =>
  api.post(`/candidates/${id}/alternatives`, {
    analysis_id: id,
    exclude_candidate_ids: excludeIds,
  }).then(r => r.data)

// ── Debate ──────────────────────────────────────
export const getDebate = (id) =>
  api.get(`/debate/${id}`).then(r => r.data)

export const startDebate = (id) =>
  api.post(`/debate/${id}/start`).then(r => r.data)

// ── Error helper ────────────────────────────────
export const getErrorMessage = (error) => {
  if (error?.response?.data?.detail) return error.response.data.detail
  if (error?.message) return error.message
  return 'An unexpected error occurred'
}

export default api
