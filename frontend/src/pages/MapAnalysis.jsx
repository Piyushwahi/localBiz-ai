/**
 * MapAnalysis page — the main map-centric analysis view.
 * LEFT: SearchPanel | CENTER: Map | RIGHT: Candidate analysis panel | BOTTOM: Debate timeline
 */
import { useState, useCallback } from 'react'
import SearchPanel from '../components/SearchPanel'
import MapView from '../components/MapView'
import CandidateCard from '../components/CandidateCard'
import DebateTimeline from '../components/DebateTimeline'
import AgentStatus from '../components/AgentStatus'
import CompareModal from '../components/CompareModal'
import { useAnalysis } from '../hooks/useAnalysis'
import { findAlternatives } from '../services/api'
import { Loader2, GitCompare, PlusCircle, AlertCircle, Info, MapPin, Copy, Check, FileDown } from 'lucide-react'

export default function MapAnalysis(props) {
  const localAnalysis = useAnalysis()
  const {
    analysisId = localAnalysis.analysisId,
    status = localAnalysis.status,
    analysisData = localAnalysis.analysisData,
    candidates = localAnalysis.candidates,
    debateData = localAnalysis.debateData,
    error = localAnalysis.error,
    runAnalysis = localAnalysis.runAnalysis,
    reset = localAnalysis.reset,
  } = props?.runAnalysis ? props : localAnalysis

  const [homeCoords, setHomeCoords] = useState(null)
  const [radius, setRadius] = useState(2.0)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showCompare, setShowCompare] = useState(false)
  const [alternatives, setAlternatives] = useState([])
  const [altLoading, setAltLoading] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

  const pois = analysisData?.pois || []
  const finalReport = analysisData?.final_report
  const candidateReports = {}
  finalReport?.candidate_reports?.forEach(r => { candidateReports[r.candidate_id] = r })
  const bestId = finalReport?.recommended_candidate_id
  const allCandidates = [...candidates, ...alternatives]

  const handleAnalyze = useCallback((payload) => {
    setRadius(payload.radius_km)
    runAnalysis(payload)
    setAlternatives([])
    setSelectedCandidate(null)
  }, [runAnalysis])

  const handleLocationSelect = useCallback((coords) => {
    setHomeCoords(coords)
  }, [])

  const handleMapClick = useCallback((coords) => {
    setHomeCoords(coords)
  }, [])

  const handleFindAlternatives = async () => {
    if (!analysisId) return
    setAltLoading(true)
    try {
      const result = await findAlternatives(analysisId, candidates.map(c => c.id))
      setAlternatives(result.alternatives || [])
    } catch (e) {
      console.error('Failed to find alternatives:', e)
    } finally {
      setAltLoading(false)
    }
  }

  const handleCopyFullReport = () => {
    if (!analysisData) return
    const text = `
LOCALBIZ AI — STRATEGIC COMMERCIAL LOCATION REPORT
===================================================
Analysis ID: ${analysisId || 'N/A'}
Origin Address: ${analysisData.home_address || 'Selected Location'}
Business Category: ${analysisData.request?.business_type || 'Commercial Enterprise'}
Search Zone Radius: ${radius} km
Total Surrounding POIs Analyzed: ${pois.length}

EXECUTIVE JUDGE VERDICT:
${finalReport?.recommendation_phrase || 'Analysis complete.'}

TOP RECOMMENDED LOCATION:
${allCandidates.find(c => c.id === bestId)?.label || 'Candidate Selected'}

CANDIDATE BREAKDOWN & INTELLIGENCE:
-----------------------------------
${allCandidates.map((c, i) => {
  const r = candidateReports[c.id]
  return `
[Candidate ${i + 1}] ${c.label} (Score: ${r?.ai_analysis_score != null ? `${r.ai_analysis_score}/10` : 'N/A'})
- Verified Address: ${c.formatted_address || 'Coordinates Pinpointed'}
- Coordinates: ${c.coordinates.latitude}, ${c.coordinates.longitude}
- Footfall Tier: ${c.estimated_footfall_tier || 'Commercial Corridor'}
- Prime Hours: ${c.prime_trading_hours || 'Standard Retail'}
- Direct Competitors: ${c.competitor_count} (${c.competitors?.map(x => x.name).join(', ') || 'None (Blue Ocean)'})
- Strategic Verdict: ${r?.executive_verdict || r?.summary || c.geographic_profile}
- Bull Case: ${r?.bull_case || 'Strong baseline commercial flow.'}
- Bear Case: ${r?.bear_case || 'Potential overhead and competitive friction.'}
- Action Steps:
  ${(r?.actionable_recommendations || []).map((step, sIdx) => `  * ${step}`).join('\n')}
`
}).join('\n')}

RESPONSIBLE AI NOTICE:
${finalReport?.responsible_ai_notice || 'Evidence-based decision support only. Physical due diligence required.'}
    `.trim()

    navigator.clipboard?.writeText(text)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  const isRunning = ['starting', 'polling', 'geocoding', 'maps_fetching', 'generating_candidates', 'debating'].includes(status)

  return (
    <div className="flex flex-col h-full bg-cream-50">
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Search panel */}
        <SearchPanel
          onAnalyze={handleAnalyze}
          onLocationSelect={handleLocationSelect}
          status={status}
          onReset={reset}
        />

        {/* CENTER: Map & Timeline (takes main space) */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-cream-100">
          <div className="flex-1 min-h-0 relative">
            <MapView
              homeCoords={homeCoords || (analysisData?.home_coordinates ? {
                latitude: analysisData.home_coordinates.latitude,
                longitude: analysisData.home_coordinates.longitude,
              } : null)}
              radius={radius}
              pois={pois}
              candidates={allCandidates}
              selectedCandidate={selectedCandidate}
              onCandidateSelect={setSelectedCandidate}
              onMapClick={handleMapClick}
            />
          </div>

          {/* BOTTOM: Debate timeline */}
          <div className="bg-white border-t border-slate-900/[0.08] p-3.5 max-h-48 overflow-hidden shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖</span> Multi-Agent Debate Timeline
              </h3>
              {debateData && (
                <span className="text-[11px] text-primary-700 font-bold bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                  {debateData.events?.length || 0} events
                </span>
              )}
            </div>
            <DebateTimeline debateData={debateData} compact={true} />
          </div>
        </div>

        {/* RIGHT: Analysis candidate panel (fixed width, solid cream background) */}
        <div className="w-[420px] min-w-[420px] max-w-[420px] flex-shrink-0 bg-[#faf8f5] border-l border-slate-900/[0.08] flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-[#faf8f5]">
            {/* Config warning */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed font-medium">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {isRunning && (
              <div className="space-y-3">
                <div className="glass-card p-4 text-center">
                  <Loader2 size={24} className="animate-spin text-primary-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-navy-900">Analyzing location...</p>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    {status === 'maps_fetching' ? 'Fetching Azure Maps data...'
                      : status === 'generating_candidates' ? 'Generating candidate areas...'
                      : status === 'debating' ? 'Agents are debating...'
                      : 'Processing...'}
                  </p>
                </div>
                <AgentStatus debateData={debateData} overallStatus={status} />
              </div>
            )}

            {/* Candidates */}
            {allCandidates.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                    Candidate Areas ({allCandidates.length})
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={handleCopyFullReport}
                      className="btn-secondary text-xs py-1 px-2.5 font-bold text-navy-900"
                      title="Copy complete executive location analysis report"
                    >
                      {copiedReport ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedReport ? 'Copied' : 'Export'}
                    </button>
                    {allCandidates.length >= 2 && (
                      <button
                        onClick={() => setShowCompare(true)}
                        className="btn-secondary text-xs py-1 px-2.5"
                      >
                        <GitCompare size={12} /> Compare
                      </button>
                    )}
                    <button
                      onClick={handleFindAlternatives}
                      disabled={altLoading || isRunning}
                      className="btn-secondary text-xs py-1 px-2.5"
                    >
                      {altLoading ? <Loader2 size={12} className="animate-spin" /> : <PlusCircle size={12} />}
                      Alternatives
                    </button>
                  </div>
                </div>

                {allCandidates.map((cand, i) => (
                  <CandidateCard
                    key={cand.id}
                    candidate={cand}
                    report={candidateReports[cand.id]}
                    debateData={debateData}
                    index={i}
                    isSelected={selectedCandidate?.id === cand.id}
                    onSelect={() => setSelectedCandidate(cand)}
                    isRecommended={cand.id === bestId}
                  />
                ))}

                {/* Responsible AI notice */}
                <div className="p-3.5 bg-cream-100/80 border border-slate-900/[0.06] rounded-xl flex gap-2.5">
                  <Info size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {finalReport?.responsible_ai_notice || 'This analysis provides evidence-based decision support only. It does not guarantee business success.'}
                  </p>
                </div>
              </>
            )}

            {/* Empty state */}
            {status === 'idle' && (
              <div className="text-center py-10 text-slate-400">
                <MapPin size={36} className="mx-auto mb-3 opacity-40 text-primary-600" />
                <p className="text-sm font-semibold text-navy-900">Ready to Analyze</p>
                <p className="text-xs text-slate-500 mt-1">Select a location & business type from the left panel to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare modal */}
      {showCompare && (
        <CompareModal
          candidates={allCandidates}
          reports={candidateReports}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}
