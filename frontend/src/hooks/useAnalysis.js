/**
 * useAnalysis hook — manages the full analysis workflow state.
 */
import { useState, useCallback, useRef } from 'react'
import {
  startAnalysis,
  getAnalysisStatus,
  getFullAnalysis,
  getCandidates,
  getDebate,
  checkHealth,
  getErrorMessage,
} from '../services/api'

const POLL_INTERVAL = 3000
const TERMINAL_STATUSES = ['complete', 'error']

export function useAnalysis() {
  const [analysisId, setAnalysisId] = useState(null)
  const [status, setStatus] = useState('idle') // idle | starting | polling | complete | error
  const [analysisData, setAnalysisData] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [debateData, setDebateData] = useState(null)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState(null)
  const pollRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const h = await checkHealth()
      setHealth(h)
      return h
    } catch (err) {
      console.error('Failed to fetch backend health:', err)
      const errorDetail =
        err?.response?.data?.detail ||
        (err?.message === 'Network Error'
          ? 'Network Error — Backend unreachable or CORS origin blocked'
          : err?.message || 'Unable to connect to backend')
      setHealth({
        status: 'unreachable',
        azure_maps_configured: false,
        foundry_configured: false,
        error: errorDetail,
      })
      return null
    }
  }, [])

  const poll = useCallback(async (id) => {
    try {
      const [statusData, debData] = await Promise.all([
        getAnalysisStatus(id),
        getDebate(id).catch(() => null),
      ])

      if (debData) setDebateData(debData)

      if (TERMINAL_STATUSES.includes(statusData.status)) {
        stopPolling()
        if (statusData.status === 'complete') {
          const [full, cands] = await Promise.all([
            getFullAnalysis(id),
            getCandidates(id),
          ])
          setAnalysisData(full)
          setCandidates(cands.candidates || [])
          setStatus('complete')
        } else {
          setError(statusData.error_message || 'Analysis failed')
          setStatus('error')
        }
      } else {
        setStatus(statusData.status)
      }
    } catch (e) {
      stopPolling()
      setError(getErrorMessage(e))
      setStatus('error')
    }
  }, [stopPolling])

  const runAnalysis = useCallback(async (payload) => {
    stopPolling()
    setError(null)
    setAnalysisData(null)
    setCandidates([])
    setDebateData(null)
    setStatus('starting')

    try {
      const result = await startAnalysis(payload)
      const id = result.analysis_id
      setAnalysisId(id)
      setStatus('polling')

      pollRef.current = setInterval(() => poll(id), POLL_INTERVAL)
      poll(id)

      return id
    } catch (e) {
      setError(getErrorMessage(e))
      setStatus('error')
    }
  }, [poll, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setAnalysisId(null)
    setStatus('idle')
    setAnalysisData(null)
    setCandidates([])
    setDebateData(null)
    setError(null)
  }, [stopPolling])

  return {
    analysisId,
    status,
    analysisData,
    candidates,
    debateData,
    error,
    health,
    fetchHealth,
    runAnalysis,
    reset,
  }
}
