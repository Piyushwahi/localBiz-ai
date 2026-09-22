/**
 * About page — project purpose and architecture overview.
 */
import { Shield, Map, Brain, Users, CheckCircle2, AlertTriangle } from 'lucide-react'

const AGENTS = [
  { emoji: '📍', name: 'Location Agent', desc: 'Analyzes geographic context, coordinates, and accessibility' },
  { emoji: '⚔️', name: 'Competition Agent', desc: 'Maps direct competitors from actual Azure Maps data' },
  { emoji: '📊', name: 'Market Agent', desc: 'Analyzes demand indicators from present POI categories only' },
  { emoji: '💰', name: 'Finance Agent', desc: 'Reports available financial context; labels unknowns explicitly' },
  { emoji: '🚗', name: 'Accessibility Agent', desc: 'Evaluates route distance, transit, and parking indicators' },
  { emoji: '🔴', name: 'Critic Agent', desc: 'Challenges unsupported and overconfident conclusions' },
  { emoji: '🔵', name: 'Fact Checker', desc: 'Verifies all claims against Azure Maps geographic data' },
  { emoji: '⚖️', name: 'Judge Agent', desc: 'Synthesizes a balanced final report with evidence-based language' },
]

export default function About() {
  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full space-y-6">
      {/* Header */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 border border-primary-400/30 flex items-center justify-center shadow-lg shadow-primary-600/20">
            <span className="text-white font-black text-2xl">L</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-navy-900">LocalBiz AI</h1>
            <p className="text-sm text-primary-700 font-semibold">Operational Multi-Agent Business Location Intelligence</p>
          </div>
        </div>
        <p className="text-slate-700 leading-relaxed text-sm font-medium">
          LocalBiz AI is an evidence-based decision support system for aspiring entrepreneurs and business owners.
          It combines verified geographic POI data from Azure Maps with a structured 9-agent AI debate pipeline
          to produce transparent, balanced location feasibility analysis — without claiming unverified guarantees.
        </p>
      </div>

      {/* Responsible AI */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold text-amber-900 mb-3 text-base">
          <Shield size={18} className="text-amber-700" /> Responsible AI Commitment
        </h2>
        <ul className="space-y-2.5 text-xs text-amber-950 font-medium">
          <li className="flex gap-2"><CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0 mt-0.5" /> No fabricated geographic data — all POIs from Azure Maps REST APIs</li>
          <li className="flex gap-2"><CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0 mt-0.5" /> No success guarantees — strictly evidence-based and balanced language</li>
          <li className="flex gap-2"><CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0 mt-0.5" /> Missing context explicitly labeled UNKNOWN rather than hallucinated</li>
          <li className="flex gap-2"><CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0 mt-0.5" /> Every claim classified: VERIFIED | CALCULATED | AI_INFERENCE | UNKNOWN</li>
          <li className="flex gap-2"><CheckCircle2 size={15} className="text-emerald-700 flex-shrink-0 mt-0.5" /> Azure credentials and secrets never exposed to the browser client</li>
          <li className="flex gap-2"><AlertTriangle size={15} className="text-amber-700 flex-shrink-0 mt-0.5" /> Physical on-site verification always required prior to commercial lease commitment</li>
        </ul>
      </div>

      {/* Tech stack */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-navy-900 mb-4 flex items-center gap-2 text-base">
          <Map size={18} className="text-primary-600" /> Technology Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Frontend', items: ['React 18 + Vite', 'Tailwind CSS Luxury Theme', 'Azure Maps Web SDK v3', 'Axios + React Router'] },
            { label: 'Backend', items: ['Python FastAPI', 'Pydantic v2 validation', 'httpx (Azure Maps async client)', 'azure-identity + azure-ai-projects'] },
            { label: 'AI Engine', items: ['Azure AI Foundry', 'GPT-5-mini (single shared deployment)', 'AIProjectClient.get_openai_client()', '9 specialized debate agents'] },
            { label: 'Spatial Data', items: ['Azure Maps REST Search & Routing', 'Server-side API proxy', 'VERIFIED geographic coordinates', 'Haversine distance matrix'] },
          ].map(section => (
            <div key={section.label} className="bg-cream-50 border border-slate-900/[0.05] rounded-xl p-4">
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">{section.label}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li key={i} className="text-xs text-slate-700 font-medium flex gap-2">
                    <span className="text-primary-600 font-bold">›</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="glass-card p-6">
        <h2 className="font-bold text-navy-900 mb-2 flex items-center gap-2 text-base">
          <Brain size={18} className="text-primary-600" /> The 9-Agent Cognitive System
        </h2>
        <p className="text-xs text-slate-600 mb-4 font-medium">All agents share a single GPT-5-mini deployment with strict persona grounding.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGENTS.map(agent => (
            <div key={agent.name} className="bg-cream-50 border border-slate-900/[0.05] rounded-xl p-3.5 flex gap-3 items-center">
              <span className="text-2xl flex-shrink-0">{agent.emoji}</span>
              <div>
                <h3 className="text-xs font-bold text-navy-900">{agent.name}</h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">{agent.desc}</p>
              </div>
            </div>
          ))}
          <div className="bg-cream-50 border border-slate-900/[0.05] rounded-xl p-3.5 flex gap-3 items-center">
            <span className="text-2xl flex-shrink-0">🎯</span>
            <div>
              <h3 className="text-xs font-bold text-navy-900">Orchestrator</h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">Controls pipeline flow, data validation, and multi-agent debate coordination</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
