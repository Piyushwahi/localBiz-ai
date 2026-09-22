/**
 * CompareModal — side-by-side candidate comparison.
 */
import { X, Star } from 'lucide-react'
import EvidenceBadge from './EvidenceBadge'

const CANDIDATE_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']

const METRICS = [
  { key: 'score', label: 'AI Analysis Score', note: '(Not success probability)' },
  { key: 'straight_line', label: 'Straight-line Distance' },
  { key: 'driving', label: 'Driving Distance' },
  { key: 'walking', label: 'Walking Distance' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'evidence_quality', label: 'Evidence Quality' },
]

function getValue(candidate, report, key) {
  switch (key) {
    case 'score': return report?.ai_analysis_score != null ? `${report.ai_analysis_score.toFixed(1)}/10` : 'N/A'
    case 'straight_line': return `${candidate.route_info.straight_line_km} km`
    case 'driving': return candidate.route_info.driving_km ? `${candidate.route_info.driving_km} km` : 'UNKNOWN'
    case 'walking': return candidate.route_info.walking_km ? `${candidate.route_info.walking_km} km` : 'UNKNOWN'
    case 'competitors': return String(candidate.competitor_count)
    case 'evidence_quality': return report?.evidence_quality || 'N/A'
    default: return 'N/A'
  }
}

export default function CompareModal({ candidates, reports = {}, onClose }) {
  const displayCandidates = candidates.slice(0, 3)
  const bestId = Object.entries(reports)
    .sort(([, a], [, b]) => (b?.ai_analysis_score ?? 0) - (a?.ai_analysis_score ?? 0))[0]?.[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white border border-slate-900/[0.12] rounded-3xl shadow-2xl max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50/95 backdrop-blur-md p-5 border-b border-slate-900/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-navy-900">Compare Candidates</h2>
            <p className="text-xs text-slate-600 font-medium">Side-by-side evidence comparison and spatial metrics</p>
          </div>
          <button onClick={onClose} className="btn-secondary p-2 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-6">
          {/* Candidate headers */}
          <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `200px repeat(${displayCandidates.length}, 1fr)` }}>
            <div />
            {displayCandidates.map((cand, i) => (
              <div key={cand.id} className="text-center p-3 rounded-2xl bg-cream-50 border border-slate-900/[0.05]">
                <div
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-white shadow-md"
                  style={{ background: CANDIDATE_COLORS[i] }}
                >
                  {cand.label.split(' ')[1]}
                </div>
                <h3 className="font-bold text-navy-900 text-sm">{cand.label}</h3>
                {cand.id === bestId && (
                  <span className="text-[11px] text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full px-2 py-0.5 inline-flex items-center gap-1 font-bold mt-1">
                    <Star size={10} /> Strongest
                  </span>
                )}
                <p className="text-xs text-slate-500 mt-1 font-medium">{cand.geographic_profile?.split('|')[0]?.trim()}</p>
              </div>
            ))}
          </div>

          {/* Metric rows */}
          <div className="space-y-1">
            {METRICS.map(m => (
              <div
                key={m.key}
                className={`grid gap-4 py-2.5 px-3 rounded-xl border-b border-slate-900/[0.04] hover:bg-cream-50/50`}
                style={{ gridTemplateColumns: `200px repeat(${displayCandidates.length}, 1fr)` }}
              >
                <div className="text-xs font-bold text-navy-900">
                  {m.label}
                  {m.note && <span className="block text-slate-400 font-normal text-[10px]">{m.note}</span>}
                </div>
                {displayCandidates.map((cand, i) => {
                  const val = getValue(cand, reports[cand.id], m.key)
                  const isUnknown = val === 'UNKNOWN' || val === 'N/A'
                  return (
                    <div key={cand.id} className="text-center flex flex-col items-center justify-center">
                      <span className={`text-xs font-bold ${isUnknown ? 'text-slate-400' : 'text-navy-900'}`}>
                        {val}
                      </span>
                      {isUnknown && <div className="mt-0.5"><EvidenceBadge type="UNKNOWN" /></div>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Risks */}
          <div className={`grid gap-4 mt-6 p-4 rounded-2xl bg-red-50/50 border border-red-200/60`} style={{ gridTemplateColumns: `200px repeat(${displayCandidates.length}, 1fr)` }}>
            <div className="text-xs font-bold text-red-800">Key Risks & Concerns</div>
            {displayCandidates.map((cand) => {
              const report = reports[cand.id]
              return (
                <ul key={cand.id} className="space-y-1.5">
                  {report?.weaknesses?.slice(0, 3).map((w, i) => (
                    <li key={i} className="text-xs text-slate-700 font-medium">• {w}</li>
                  )) || <li className="text-xs text-slate-400">No data</li>}
                </ul>
              )
            })}
          </div>

          {/* Unknowns */}
          <div className={`grid gap-4 mt-4 p-4 rounded-2xl bg-cream-50 border border-slate-900/[0.06]`} style={{ gridTemplateColumns: `200px repeat(${displayCandidates.length}, 1fr)` }}>
            <div className="text-xs font-bold text-slate-600">Explicit Unknowns</div>
            {displayCandidates.map((cand) => {
              const report = reports[cand.id]
              return (
                <ul key={cand.id} className="space-y-1.5">
                  {report?.uncertainties?.slice(0, 3).map((u, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <EvidenceBadge type="UNKNOWN" />
                      <span className="text-xs text-slate-600 font-medium">{u.slice(0, 60)}...</span>
                    </li>
                  )) || <li className="text-xs text-slate-400">No data</li>}
                </ul>
              )
            })}
          </div>

          <div className="mt-6 p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-900 font-medium">
            ℹ️ AI Analysis Scores reflect evidence strength from Azure Maps data, not business success probability. All information requires independent on-site verification.
          </div>
        </div>
      </div>
    </div>
  )
}
