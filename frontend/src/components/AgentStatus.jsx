/**
 * AgentStatus — shows live agent analysis status indicators.
 */
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'

const AGENTS = [
  { id: 'location', label: 'Location Intel', emoji: '📍' },
  { id: 'competition', label: 'Competition', emoji: '⚔️' },
  { id: 'market', label: 'Market/Demand', emoji: '📊' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'accessibility', label: 'Accessibility', emoji: '🚗' },
  { id: 'critic', label: 'Critic', emoji: '🔴' },
  { id: 'fact_checker', label: 'Fact Checker', emoji: '🔵' },
  { id: 'judge', label: 'Judge', emoji: '⚖️' },
]

function getAgentStatus(agentId, events) {
  const agentEvents = events?.filter(e => e.agent === agentId) || []
  if (agentEvents.some(e => e.status === 'error')) return 'error'
  if (agentEvents.some(e => e.event_type === 'complete')) return 'complete'
  if (agentEvents.length > 0) {
    const last = agentEvents[agentEvents.length - 1]
    if (last.status === 'success') return 'complete'
    if (last.event_type === 'agent' || last.event_type === agentId) return 'running'
  }
  return 'pending'
}

export default function AgentStatus({ debateData, overallStatus }) {
  const events = debateData?.events || []
  const isRunning = overallStatus === 'debating' || debateData?.status === 'running'

  return (
    <div className="glass-card p-4">
      <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-3">Agent Orchestration Status</h3>
      <div className="grid grid-cols-2 gap-2">
        {AGENTS.map(agent => {
          const status = getAgentStatus(agent.id, events)
          const isThisRunning = isRunning && status === 'running'
          return (
            <div
              key={agent.id}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all duration-300 ${
                status === 'complete' ? 'bg-emerald-50 border border-emerald-300'
                : status === 'running' ? 'bg-primary-50 border border-primary-300'
                : status === 'error' ? 'bg-red-50 border border-red-300'
                : 'bg-cream-50 border border-slate-900/[0.05]'
              }`}
            >
              <span>{agent.emoji}</span>
              <span className={`flex-1 font-bold truncate ${
                status === 'complete' ? 'text-emerald-800'
                : status === 'running' ? 'text-primary-700'
                : status === 'error' ? 'text-red-700'
                : 'text-slate-500'
              }`}>{agent.label}</span>
              {status === 'complete' && <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" />}
              {status === 'running' && <Loader2 size={13} className="text-primary-600 animate-spin flex-shrink-0" />}
              {status === 'error' && <XCircle size={13} className="text-red-600 flex-shrink-0" />}
              {status === 'pending' && isRunning && <Clock size={13} className="text-slate-400 flex-shrink-0" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
