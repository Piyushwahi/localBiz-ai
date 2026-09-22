/**
 * Dashboard page — Summary overview of current analysis and platform telemetry.
 */
import { useNavigate } from 'react-router-dom'
import {
  Map, Users, Brain, CheckCircle2, AlertTriangle,
  ArrowRight, Sparkles, Activity, ShieldCheck, Cpu,
  Compass, BarChart3, ChevronRight
} from 'lucide-react'

function MetricCard({ icon: Icon, label, value, sublabel, iconColor = 'text-primary-600', iconBg = 'bg-primary-50 border-primary-200' }) {
  return (
    <div className="glass-card p-5 relative overflow-hidden group hover:border-primary-500/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl border ${iconBg} ${iconColor} transition-transform group-hover:scale-110 duration-200`}>
          <Icon size={18} />
        </div>
        <div className="h-1.5 w-6 rounded-full bg-slate-900/10 group-hover:bg-primary-500/40 transition-colors" />
      </div>
      <div className="text-2xl font-bold text-navy-900 tracking-tight mb-1">{value}</div>
      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</div>
      {sublabel && <div className="text-xs text-slate-500 mt-1">{sublabel}</div>}
    </div>
  )
}

export default function Dashboard({ analysisData, debateData, status, health }) {
  const navigate = useNavigate()
  const configured = health?.azure_maps_configured && health?.foundry_configured

  const pois = analysisData?.pois || []
  const candidates = analysisData?.candidates || []
  const finalReport = analysisData?.final_report
  const events = debateData?.events || []

  const verifiedClaims = debateData
    ? Object.values(debateData.fact_check_results || {}).flat().filter(f => f.status === 'VERIFIED').length
    : 0
  const challenges = debateData?.critic_challenges?.length || 0

  const bestCandidate = finalReport?.candidate_reports?.sort((a, b) => b.ai_analysis_score - a.ai_analysis_score)[0]

  return (
    <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Hero Feature Card */}
      <div className="glass-card p-7 md:p-8 bg-white relative overflow-hidden border border-slate-900/[0.08] shadow-sm">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        
        {/* Ambient champagne & royal blue glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-champagne-light border border-champagne/30 text-xs font-bold text-champagne-dark">
              <Sparkles size={13} className="text-champagne-dark" />
              LOCALBIZ AI PLATFORM
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-navy-900 mb-2.5 tracking-tight">
            Multi-Agent <em className="font-serif italic font-normal text-primary-600">Business Location</em> Analysis
          </h1>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl font-normal">
            Evidence-based decision support using Azure Maps spatial data and 9 specialized AI agents.
            Rigorous cross-validation, competitive intelligence, and verifiable reasoning for enterprise site selection.
          </p>

          {/* Config Alert if missing */}
          {!configured && (
            <div className="mt-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5 max-w-2xl">
              <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                {!health?.azure_maps_configured && '⚠ AZURE_MAPS_KEY not configured. '}
                {!health?.foundry_configured && '⚠ FOUNDRY_PROJECT_ENDPOINT not configured. '}
                Please configure <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">backend/.env</code> to enable live Azure AI.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => navigate('/map-analysis')}
              className="btn-primary"
            >
              <Compass size={16} />
              Start Location Analysis
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="btn-secondary"
            >
              System Architecture
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={Map}
          label="POIs Retrieved"
          value={pois.length || '—'}
          sublabel="From Azure Maps (VERIFIED)"
          iconColor="text-teal-700"
          iconBg="bg-teal-50 border-teal-200"
        />
        <MetricCard
          icon={Users}
          label="Candidates"
          value={candidates.length || '—'}
          sublabel="Spatial cluster zones"
          iconColor="text-primary-700"
          iconBg="bg-primary-50 border-primary-200"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Claims Verified"
          value={verifiedClaims || '—'}
          sublabel="By Fact Checker"
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50 border-emerald-200"
        />
        <MetricCard
          icon={Brain}
          label="Agent Events"
          value={events.length || '—'}
          sublabel="Debate event trace"
          iconColor="text-indigo-700"
          iconBg="bg-indigo-50 border-indigo-200"
        />
      </div>

      {/* Recommendation & Debate Breakdown */}
      {finalReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="glass-card p-6 border border-slate-900/[0.08]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                Current Recommendation
              </h3>
              {bestCandidate && (
                <span className="badge-verified">Top Ranked</span>
              )}
            </div>
            {bestCandidate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-cream-50 border border-slate-900/[0.06]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-800 font-extrabold text-base">
                      {bestCandidate.candidate_id.split('_').pop().toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 capitalize text-base">
                      {bestCandidate.candidate_id.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      AI Consensus Score: {bestCandidate.ai_analysis_score.toFixed(1)}/10
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed bg-cream-100/60 p-3 rounded-xl border border-slate-900/[0.04]">
                  "{bestCandidate.recommendation}"
                </p>
                <p className="text-xs text-slate-500">{finalReport.responsible_ai_notice?.slice(0, 140)}...</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run an analysis to see recommendations</p>
            )}
          </div>

          <div className="glass-card p-6 border border-slate-900/[0.08]">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu size={16} className="text-primary-600" />
              Multi-Agent Telemetry
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-cream-50 text-xs">
                <span className="text-slate-600 font-medium">Specialist Analyses Generated</span>
                <span className="text-navy-900 font-bold font-mono">
                  {Object.values(debateData?.specialist_outputs || {}).flat().length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-cream-50 text-xs">
                <span className="text-slate-600 font-medium">Critic Challenges Issued</span>
                <span className="text-amber-700 font-bold font-mono">{challenges}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-cream-50 text-xs">
                <span className="text-slate-600 font-medium">Spatial Fact Checks Run</span>
                <span className="text-sky-700 font-bold font-mono">
                  {Object.values(debateData?.fact_check_results || {}).flat().length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-cream-50 text-xs">
                <span className="text-slate-600 font-medium">Verified Evidence Claims</span>
                <span className="text-emerald-700 font-bold font-mono">{verifiedClaims}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: '/map-analysis', icon: Map, title: 'Map Analysis', desc: 'Interactive geographic exploration with real POIs and candidates' },
          { to: '/candidates', icon: Users, title: 'Candidate Areas', desc: 'Deep dive into area demographics, competition & accessibility' },
          { to: '/debate', icon: Brain, title: 'Debate Timeline', desc: 'Inspect full agent-by-agent debate steps and fact checks' },
        ].map(item => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className="glass-card-hover p-5 text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-600 group-hover:scale-105 transition-transform">
                  <item.icon size={18} />
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-navy-900 text-sm tracking-tight">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
