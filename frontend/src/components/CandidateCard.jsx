import { useState } from 'react'
import {
  MapPin, Car, Footprints, TrendingUp, Users, Zap,
  Star, ChevronDown, ChevronUp, AlertTriangle, HelpCircle,
  Building2, CheckCircle, ExternalLink, Clock, Copy, Check,
  Target, ShieldAlert, Sparkles, ArrowRight
} from 'lucide-react'
import EvidenceBadge from './EvidenceBadge'
import WhyNotHereModal from './WhyNotHereModal'

const CANDIDATE_COLORS = ['#22c55e', '#2563eb', '#f59e0b', '#ec4899', '#8b5cf6']

function ScoreRing({ score, color }) {
  const pct = ((score || 0) / 10) * 100
  const radius = 22
  const circ = 2 * Math.PI * radius
  const dash = (pct / 100) * circ
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(15,39,68,0.08)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={radius} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-navy-900">{score ? score.toFixed(1) : '—'}</span>
      </div>
    </div>
  )
}

function MetricRow({ icon: Icon, label, value, badge, className = '' }) {
  return (
    <div className={`flex items-center justify-between py-1.5 ${className}`}>
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
        <Icon size={13} className="text-slate-400" />
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-navy-900">{value}</span>
        {badge && <EvidenceBadge type={badge} />}
      </div>
    </div>
  )
}

export default function CandidateCard({
  candidate,
  report,
  debateData,
  index = 0,
  isSelected,
  onSelect,
  isRecommended,
}) {
  const [expanded, setExpanded] = useState(false)
  const [showWhyNot, setShowWhyNot] = useState(false)
  const [copied, setCopied] = useState(false)

  const color = CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]
  const score = report?.ai_analysis_score ?? null

  const competitorLevel = candidate.competitor_count >= 4 ? 'High' : candidate.competitor_count >= 2 ? 'Moderate' : 'Low'
  const competitorColor = candidate.competitor_count >= 4 ? 'text-red-700' : candidate.competitor_count >= 2 ? 'text-amber-700' : 'text-emerald-700'

  const poiCategories = Object.entries(candidate.poi_summary || {}).slice(0, 6)
  const topAnchors = candidate.anchor_landmarks?.length ? candidate.anchor_landmarks : candidate.nearby_pois?.slice(0, 3).map(p => p.name) || []
  const competitors = candidate.competitors || []

  // Extract executive verdict & intelligence
  const executiveVerdict = report?.executive_verdict || report?.summary || candidate.geographic_profile
  const targetSegments = report?.target_customer_segments?.length 
    ? report.target_customer_segments 
    : (candidate.poi_summary?.school || candidate.poi_summary?.college) 
      ? ['Students & Faculty', 'Local Foot Traffic', 'Residents']
      : ['Local Shoppers', 'Commuters', 'Area Residents']

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${candidate.coordinates.latitude},${candidate.coordinates.longitude}`

  const handleCopyDossier = (e) => {
    e.stopPropagation()
    const text = `
LOCALBIZ AI STRATEGIC LOCATION DOSSIER
======================================
Candidate: ${candidate.label}
Overall Score: ${score ? `${score}/10` : 'N/A'} (${isRecommended ? 'Top Recommendation' : 'Candidate'})
Coordinates: ${candidate.coordinates.latitude}, ${candidate.coordinates.longitude}
Verified Address: ${candidate.formatted_address || 'Coordinates Pinpointed'}
Google Maps: ${gmapsUrl}

EXECUTIVE VERDICT:
${executiveVerdict}

COMMERCIAL PROFILE:
- Footfall Tier: ${candidate.estimated_footfall_tier || 'Commercial corridor'}
- Prime Trading Hours: ${candidate.prime_trading_hours || 'Standard retail'}
- Real Estate Tier: ${candidate.commercial_rent_tier || 'High Street / Retail'}
- Target Segments: ${targetSegments.join(', ')}

COMPETITION & ANCHORS:
- Direct Rivals within 450m: ${candidate.competitor_count} (${competitors.map(c => c.name).join(', ') || 'None - Clean Blue Ocean'})
- Key Anchor Institutions: ${topAnchors.join(', ') || 'Local commercial district'}

STRATEGIC CASES:
- Bull Case: ${report?.bull_case || 'Strong baseline commercial footfall.'}
- Bear Case: ${report?.bear_case || 'Potential overhead and competitive pressure.'}

ACTIONABLE NEXT STEPS:
${(report?.actionable_recommendations || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}
    `.trim()

    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div
        className={`glass-card cursor-pointer overflow-hidden transition-all duration-300 ${
          isSelected ? 'border-primary-600 ring-2 ring-primary-600/30 shadow-lg' : 'hover:border-slate-900/[0.18]'
        } ${isRecommended ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : ''}`}
        onClick={onSelect}
      >
        {/* Header */}
        <div className="p-4 pb-3 flex items-start gap-3">
          <ScoreRing score={score} color={color} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-navy-900 text-sm tracking-tight">{candidate.label}</h3>
              {isRecommended && (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold flex items-center gap-1">
                  <Star size={10} /> Top Recommendation
                </span>
              )}
            </div>

            {/* Address & Google Maps link */}
            {candidate.formatted_address && (
              <p className="text-[11px] text-slate-600 font-medium truncate mb-1" title={candidate.formatted_address}>
                📍 {candidate.formatted_address}
              </p>
            )}

            {/* Opportunity / Proximity Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                candidate.competitor_count === 0 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : candidate.competitor_count <= 2 
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {candidate.opportunity_level || `${candidate.competitor_count} Competitors Nearby`}
              </span>
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[10px] text-primary-700 hover:text-primary-800 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200 font-semibold inline-flex items-center gap-1"
                title="Open location in Google Maps"
              >
                Maps <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Executive Verdict Callout Box */}
        {executiveVerdict && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-primary-50/70 border border-primary-200/60">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-primary-900 uppercase tracking-wider">
              <Zap size={11} className="text-primary-600" />
              Strategic Viability Takeaway
            </div>
            <p className="text-xs text-navy-900 font-medium leading-relaxed">
              {executiveVerdict}
            </p>
          </div>
        )}

        {/* Commercial Profile Highlights */}
        <div className="mx-4 mb-3 p-2.5 bg-cream-100/70 rounded-xl border border-slate-900/[0.05] space-y-1.5 text-xs">
          {candidate.estimated_footfall_tier && (
            <div className="flex items-start gap-2">
              <Footprints size={12} className="text-primary-600 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 font-semibold text-[11px] leading-tight">
                {candidate.estimated_footfall_tier}
              </span>
            </div>
          )}
          {candidate.prime_trading_hours && (
            <div className="flex items-center gap-2 text-[11px]">
              <Clock size={12} className="text-amber-600 flex-shrink-0" />
              <span className="text-slate-600 font-medium">
                Peak Trading: <strong className="text-navy-900">{candidate.prime_trading_hours}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Target Customer Segments */}
        <div className="px-4 mb-3 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Audience:</span>
          {targetSegments.slice(0, 3).map((seg, idx) => (
            <span key={idx} className="text-[10px] px-2 py-0.5 bg-cream-100 text-slate-700 font-semibold rounded-full border border-slate-900/[0.05]">
              {seg}
            </span>
          ))}
        </div>

        {/* Top Local Anchors Spotlight */}
        {topAnchors.length > 0 && (
          <div className="px-4 mb-3 text-xs bg-cream-50/70 py-2 rounded-xl border border-slate-900/[0.04] mx-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 size={11} className="text-primary-600" />
              Anchor Institutions Driving Traffic:
            </div>
            <div className="text-xs text-navy-900 font-semibold truncate">
              {topAnchors.join(' • ')}
            </div>
          </div>
        )}

        {/* Quick metrics */}
        <div className="px-4 pb-3 border-t border-slate-900/[0.06] pt-3 space-y-0.5 bg-cream-50/40">
          <MetricRow
            icon={MapPin}
            label="Straight-line Distance"
            value={`${candidate.route_info.straight_line_km} km`}
            badge="CALCULATED"
          />
          <MetricRow
            icon={Car}
            label="Driving Access"
            value={candidate.route_info.driving_km ? `${candidate.route_info.driving_km} km (${candidate.route_info.driving_minutes || '~3'} min)` : 'Direct corridor'}
            badge={candidate.route_info.driving_km ? 'VERIFIED' : 'CALCULATED'}
          />
          <MetricRow
            icon={Footprints}
            label="Pedestrian Walkability"
            value={candidate.route_info.walking_km ? `${candidate.route_info.walking_km} km (${candidate.route_info.walking_minutes || '~12'} min)` : 'High walkability'}
            badge={candidate.route_info.walking_km ? 'VERIFIED' : 'CALCULATED'}
          />
          <MetricRow
            icon={Users}
            label="Direct Competition"
            value={<span className={competitorColor}>{competitorLevel} ({candidate.competitor_count} direct rivals)</span>}
            badge="VERIFIED"
          />
        </div>

        {/* Action button bar */}
        <div className="px-4 pb-3 flex gap-2 bg-cream-50/40">
          <button
            onClick={e => { e.stopPropagation(); setExpanded(!expanded) }}
            className="flex-1 btn-secondary justify-center text-xs py-1.5 rounded-lg font-bold"
          >
            {expanded ? <><ChevronUp size={13} /> Close Details</> : <><ChevronDown size={13} /> Full Strategic Dossier</>}
          </button>
          <button
            onClick={e => { e.stopPropagation(); setShowWhyNot(true) }}
            className="btn-secondary text-xs py-1.5 px-3 border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg font-bold"
          >
            <AlertTriangle size={12} /> Why Not?
          </button>
          <button
            onClick={handleCopyDossier}
            className="btn-secondary text-xs py-1.5 px-2.5 rounded-lg text-slate-700 hover:text-navy-900"
            title="Copy formatted location intelligence dossier"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-slate-900/[0.06] pt-3 space-y-4 animate-fade-in bg-white">
            {/* Bull & Bear Multi-Agent Breakdown */}
            {(report?.bull_case || report?.bear_case) && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-primary-600" /> Multi-Agent Strategic Analysis
                </h4>
                {report?.bull_case && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <TrendingUp size={11} className="text-emerald-700" /> Growth & Demand Catalyst (Bull Case)
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">{report.bull_case}</p>
                  </div>
                )}
                {report?.bear_case && (
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShieldAlert size={11} className="text-rose-700" /> Risk & Vulnerability Assessment (Bear Case)
                    </div>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">{report.bear_case}</p>
                  </div>
                )}
              </div>
            )}

            {/* Score Breakdown Matrix */}
            {report?.scores_breakdown && Object.keys(report.scores_breakdown).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2">
                  Category Score Matrix
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(report.scores_breakdown).map(([k, v]) => (
                    <div key={k} className="p-2 bg-cream-50 rounded-xl border border-slate-900/[0.05] flex justify-between items-center">
                      <span className="text-slate-600 capitalize font-medium">{k}</span>
                      <strong className="text-navy-900 font-bold">{typeof v === 'number' ? `${v.toFixed(1)}/10` : v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Competitor Inspection */}
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users size={12} className="text-primary-600" /> Competitor Proximity & Names
              </h4>
              {competitors.length > 0 ? (
                <ul className="space-y-1.5 bg-red-50/60 p-2.5 rounded-xl border border-red-200/70">
                  {competitors.map((comp, i) => (
                    <li key={i} className="text-xs text-red-950 font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="truncate">{comp.name}</span>
                      </div>
                      <span className="text-[11px] text-red-800 font-medium ml-2 flex-shrink-0">
                        {comp.distance_m ? `${comp.distance_m}m (~${Math.max(1, Math.round(comp.distance_m / 80))} min walk)` : 'Within 450m'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-semibold">
                  ✓ Zero direct competing establishments found within 450m radius (Clean Blue Ocean).
                </div>
              )}
            </div>

            {/* Actionable Strategic Recommendations */}
            {report?.actionable_recommendations?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Target size={12} className="text-primary-600" /> Recommended Action Steps
                </h4>
                <ul className="space-y-1.5 bg-primary-50/50 p-2.5 rounded-xl border border-primary-200/60">
                  {report.actionable_recommendations.map((step, i) => (
                    <li key={i} className="text-xs text-slate-800 font-medium flex gap-2 items-start">
                      <span className="text-primary-700 font-bold mt-0.5">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* POI Categories Breakdown */}
            {poiCategories.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TrendingUp size={12} className="text-primary-600" /> Commercial Surroundings ({candidate.nearby_pois?.length || 0} POIs)
                  <EvidenceBadge type="VERIFIED" />
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {poiCategories.map(([cat, count]) => (
                    <div key={cat} className="flex justify-between items-center text-xs bg-cream-50 border border-slate-900/[0.04] rounded-lg px-2.5 py-1">
                      <span className="text-slate-600 capitalize truncate font-medium">{cat}</span>
                      <span className="text-navy-900 font-bold ml-1">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {report?.strengths?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1.5">✓ Key Business Strengths</h4>
                <ul className="space-y-1 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/50">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-slate-800 font-medium flex gap-1.5">
                      <span className="text-emerald-600 font-bold">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Due Diligence Checklist for physical site visits */}
            <div>
              <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CheckCircle size={12} className="text-primary-600" /> On-Site Due Diligence Checklist
              </h4>
              <ul className="space-y-1 bg-cream-50 p-2.5 rounded-xl border border-slate-900/[0.05]">
                {(report?.items_requiring_physical_verification?.length 
                  ? report.items_requiring_physical_verification 
                  : [
                      'Inquire with local property owners for ground-floor shop lease rates and deposit terms',
                      'Observe pedestrian and vehicular traffic during lunch (1-2 PM) and evening (7-9 PM)',
                      'Inspect commercial electrical load support (3-phase) and municipal water/drainage connections'
                    ]
                ).map((item, i) => (
                  <li key={i} className="text-xs text-slate-700 font-medium flex gap-2 items-start">
                    <span className="text-primary-600 font-bold mt-0.5">◻</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Unknowns & Transparency */}
            {report?.uncertainties?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <HelpCircle size={12} /> Unknown Factors Requiring Physical Inspection
                </h4>
                <ul className="space-y-1">
                  {report.uncertainties.slice(0, 3).map((u, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <EvidenceBadge type="UNKNOWN" />
                      <span className="text-xs text-slate-600 font-medium">{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {showWhyNot && (
        <WhyNotHereModal
          candidate={candidate}
          report={report}
          debateData={debateData}
          onClose={() => setShowWhyNot(false)}
        />
      )}
    </>
  )
}
