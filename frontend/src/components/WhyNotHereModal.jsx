/**
 * WhyNotHereModal — shows detailed critique, risks, and evidence gaps for a candidate.
 */
import { X, AlertTriangle, HelpCircle, Shield, XCircle, CheckCircle2 } from 'lucide-react'
import EvidenceBadge from './EvidenceBadge'

export default function WhyNotHereModal({ candidate, report, debateData, onClose }) {
  const candidateId = candidate?.id
  const challenges = debateData?.critic_challenges?.filter(c => c.candidate_id === candidateId) || []
  const factChecks = debateData?.fact_check_results?.[candidateId] || []
  const contradicted = factChecks.filter(f => f.status === 'CONTRADICTED')
  const unsupported = factChecks.filter(f => f.status === 'UNSUPPORTED')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-900/[0.12] rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-cream-50/95 backdrop-blur-md p-5 border-b border-slate-900/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-navy-900">Why Not Here?</h2>
            <p className="text-xs text-slate-600 font-medium">{candidate?.label} — Evidence gaps, competition & counter-arguments</p>
          </div>
          <button onClick={onClose} className="btn-secondary p-2 rounded-full">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Risks */}
          {report?.weaknesses?.length > 0 && (
            <section className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                <AlertTriangle size={15} /> Competition & Location Concerns
              </h3>
              <ul className="space-y-2">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="flex gap-2 text-xs text-amber-950 font-medium leading-relaxed">
                    <span className="text-amber-600 font-bold flex-shrink-0">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Critic challenges */}
          {challenges.length > 0 && (
            <section className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
              <h3 className="flex items-center gap-2 text-sm font-bold text-red-900 mb-3">
                <Shield size={15} /> Critic Objections ({challenges.length})
              </h3>
              <div className="space-y-3">
                {challenges.map((ch, i) => (
                  <div key={i} className="bg-white border border-red-200 rounded-xl p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-red-800 uppercase">{ch.target_agent} Agent Challenged</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        ch.severity === 'high' ? 'bg-red-100 text-red-700 border border-red-200'
                        : ch.severity === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                      }`}>{ch.severity}</span>
                    </div>
                    <p className="text-xs text-slate-700 mb-2 leading-relaxed">{ch.reasoning}</p>
                    {ch.challenged_claims?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {ch.challenged_claims.map((claim, j) => (
                          <li key={j} className="text-xs text-red-800 font-medium flex gap-1.5">
                            <span>↳</span>{claim}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fact check failures */}
          {contradicted.length > 0 && (
            <section className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
              <h3 className="flex items-center gap-2 text-sm font-bold text-red-900 mb-3">
                <XCircle size={15} /> Contradicted Claims
              </h3>
              <div className="space-y-2">
                {contradicted.map((fc, i) => (
                  <div key={i} className="bg-white border border-red-200 rounded-xl p-3 shadow-xs">
                    <p className="text-xs text-slate-800 mb-1 font-medium">"{fc.claim}"</p>
                    <p className="text-xs text-red-700 font-bold">Actual: {fc.actual_value || fc.reasoning}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Unknowns */}
          {report?.uncertainties?.length > 0 && (
            <section className="p-4 rounded-2xl bg-cream-50 border border-slate-900/[0.06]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900 mb-3">
                <HelpCircle size={15} className="text-slate-500" /> Explicit Unknowns & Missing Data
              </h3>
              <ul className="space-y-2">
                {report.uncertainties.map((u, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <EvidenceBadge type="UNKNOWN" />
                    <span className="text-xs text-slate-600 font-medium leading-relaxed">{u}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Physical verification required */}
          {report?.items_requiring_physical_verification?.length > 0 && (
            <section className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-3">
                <CheckCircle2 size={15} /> Requires Physical Verification
              </h3>
              <ul className="space-y-1.5">
                {report.items_requiring_physical_verification.map((item, i) => (
                  <li key={i} className="text-xs text-amber-950 font-medium flex gap-2">
                    <span className="text-amber-600 font-bold">◻</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-950 leading-relaxed font-medium">
            ℹ️ This analysis is evidence-based decision support only. It does NOT guarantee business success or failure.
            All concerns should be verified through independent research and physical site visits.
          </div>
        </div>
      </div>
    </div>
  )
}
