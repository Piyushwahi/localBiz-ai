/**
 * DebateTimeline — live multi-agent debate event feed.
 * Shows the full chronological debate progression.
 */
import { useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'

const EVENT_CONFIG = {
  orchestrator: { dot: 'bg-primary-500', label: 'Orchestrator' },
  maps: { dot: 'bg-emerald-500', label: 'Azure Maps' },
  candidate: { dot: 'bg-violet-500', label: 'Candidate' },
  agent: { dot: 'bg-amber-500', label: 'Agent' },
  critic: { dot: 'bg-red-500', label: 'Critic' },
  revision: { dot: 'bg-orange-500', label: 'Revision' },
  fact_check: { dot: 'bg-blue-500', label: 'Fact Check' },
  judge: { dot: 'bg-emerald-400', label: 'Judge' },
  complete: { dot: 'bg-emerald-400', label: 'Complete' },
  error: { dot: 'bg-red-500', label: 'Error' },
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch { return '' }
}

export default function DebateTimeline({ debateData, compact = false }) {
  const bottomRef = useRef(null)
  const events = debateData?.events || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  if (events.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-slate-500 ${compact ? 'h-24' : 'h-40'}`}>
        <Clock size={20} className="opacity-40" />
        <p className="text-xs">Debate timeline will appear here</p>
      </div>
    )
  }

  return (
    <div className={`overflow-y-auto space-y-1.5 ${compact ? 'max-h-40' : 'max-h-96'}`}>
      {events.map((event, idx) => {
        const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.orchestrator
        return (
          <div
            key={event.id || idx}
            className={`flex gap-3 p-2 rounded-xl border border-slate-900/[0.04] bg-cream-50/70 hover:bg-cream-100/80 transition-colors animate-fade-in ${
              'event-' + event.event_type
            }`}
          >
            {/* Dot */}
            <div className="flex-shrink-0 mt-1.5">
              <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${config.dot}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-navy-900 truncate">{event.message}</span>
                {event.status === 'error' && (
                  <span className="text-[10px] text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded border border-red-200 flex-shrink-0">ERROR</span>
                )}
              </div>
              {event.detail && !compact && (
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{event.detail}</p>
              )}
              {event.candidate_id && (
                <span className="text-[10px] text-primary-700 font-bold uppercase tracking-wider bg-primary-50 px-1.5 py-0.5 rounded border border-primary-200">
                  {event.candidate_id.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {/* Time */}
            <div className="flex-shrink-0 text-[11px] text-slate-400 font-mono font-medium">
              {formatTime(event.timestamp)}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}
