/**
 * Evidence badge component.
 * Displays classification: VERIFIED | CALCULATED | AI_INFERENCE | UNKNOWN
 */
import { CheckCircle, Calculator, Brain, HelpCircle } from 'lucide-react'

const BADGE_CONFIG = {
  VERIFIED: {
    cls: 'badge-verified',
    icon: CheckCircle,
    label: 'VERIFIED',
  },
  CALCULATED: {
    cls: 'badge-calculated',
    icon: Calculator,
    label: 'CALCULATED',
  },
  AI_INFERENCE: {
    cls: 'badge-inference',
    icon: Brain,
    label: 'AI INFERENCE',
  },
  UNKNOWN: {
    cls: 'badge-unknown',
    icon: HelpCircle,
    label: 'UNKNOWN',
  },
}

export default function EvidenceBadge({ type, size = 'sm' }) {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG.UNKNOWN
  const Icon = config.icon

  return (
    <span className={config.cls}>
      <Icon size={10} />
      {config.label}
    </span>
  )
}
