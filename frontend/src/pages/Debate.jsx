/**
 * Debate page — full debate timeline with agent-by-agent reasoning.
 */
import DebateTimeline from '../components/DebateTimeline'
import AgentStatus from '../components/AgentStatus'
import EvidenceBadge from '../components/EvidenceBadge'
import { MessageSquare, CheckCircle2, XCircle, HelpCircle, Shield } from 'lucide-react'

function FactCheckSection({ factCheckResults }) {
  const allChecks = Object.values(factCheckResults || {}).flat()
  if (!allChecks.length) return null

  const verified = allChecks.filter(f => f.status === 'VERIFIED')
  const contradicted = allChecks.filter(f => f.status === 'CONTRADICTED')
  const unsupported = allChecks.filter(f => f.status === 'UNSUPPORTED')

  return (
    <div className="glass-card p-6">
      <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-primary-600" />
        Fact Checker Results
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Verified', count: verified.length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'Contradicted', count: contradicted.length, color: 'text-red-700 bg-red-50 border-red-200' },
          { label: 'Unsupported', count: unsupported.length, color: 'text-slate-700 bg-slate-100 border-slate-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 border text-center ${s.color}`}>
            <div className="text-2xl font-black">{s.count}</div>
            <div className="text-xs font-semibold mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {contradicted.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">Contradicted Claims</h4>
          {contradicted.map((fc, i) => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs">
              <p className="text-slate-800 mb-1 font-medium">"{fc.claim}"</p>
              <p className="text-red-700 font-bold">↳ Actual: {fc.actual_value || fc.reasoning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CriticSection({ challenges }) {
  if (!challenges?.length) return null
  return (
    <div className="glass-card p-6">
      <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
        <Shield size={16} className="text-red-600" />
        Critic Challenges ({challenges.length})
      </h3>
      <div className="space-y-3">
        {challenges.map((ch, i) => (
          <div key={i} className="bg-red-50/70 border border-red-200 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-800 uppercase">{ch.target_agent} Agent</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                ch.severity === 'high' ? 'bg-red-100 text-red-700 border border-red-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>{ch.severity}</span>
            </div>
            <p className="text-sm text-slate-700 mb-2 leading-relaxed">{ch.reasoning}</p>
            {ch.challenged_claims?.length > 0 && (
              <ul className="space-y-1">
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
    </div>
  )
}

export default function Debate({ debateData, status }) {
  if (!debateData && status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <div className="text-center">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30 text-primary-600" />
          <p className="text-sm font-bold text-navy-900">No debate recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">Run an analysis to inspect the multi-agent reasoning timeline.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy-900">Multi-Agent Debate</h1>
        <p className="text-sm text-slate-600 mt-1">
          Full agent-by-agent reasoning timeline — showing how the final assessment was formed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary-600" />
              Debate Timeline
            </h3>
            <DebateTimeline debateData={debateData} compact={false} />
          </div>

          <CriticSection challenges={debateData?.critic_challenges} />
          <FactCheckSection factCheckResults={debateData?.fact_check_results} />
        </div>

        {/* Right: Agent status */}
        <div className="space-y-5">
          <AgentStatus debateData={debateData} overallStatus={status} />

          {/* Debate stats */}
          {debateData && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">Debate Statistics</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between p-2 rounded-lg bg-cream-50">
                  <span className="text-slate-600 font-medium">Round</span>
                  <span className="text-navy-900 font-bold font-mono">{debateData.current_round}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-cream-50">
                  <span className="text-slate-600 font-medium">Total events</span>
                  <span className="text-navy-900 font-bold font-mono">{debateData.events?.length || 0}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-cream-50">
                  <span className="text-slate-600 font-medium">Challenges</span>
                  <span className="text-red-700 font-bold font-mono">{debateData.critic_challenges?.length || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Evidence legend */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">Evidence Classification</h3>
            <div className="space-y-2.5">
              {['VERIFIED', 'CALCULATED', 'AI_INFERENCE', 'UNKNOWN'].map(type => (
                <div key={type} className="flex items-center gap-2">
                  <EvidenceBadge type={type} />
                  <span className="text-xs text-slate-600 font-medium">
                    {type === 'VERIFIED' ? 'From Azure Maps API'
                     : type === 'CALCULATED' ? 'Computed from verified coordinates'
                     : type === 'AI_INFERENCE' ? 'Agent qualitative synthesis'
                     : 'Explicitly labeled missing context'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
