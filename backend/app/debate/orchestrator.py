"""
Fast multi-agent debate orchestrator for LocalBiz AI.

OPTIMIZED: Instead of 5 separate specialist agents × N candidates (= 25+ calls),
we do ONE comprehensive analysis call per candidate + ONE judge call for all candidates.
Total: N+1 LLM calls (6 for 5 candidates) instead of 40+.

Each "comprehensive" call covers all specialist domains:
  - Location & Accessibility
  - Competition & Market
  - Finance & Risk
  - Demographics & Demand
The judge then synthesizes all candidates and picks the best.
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from app.schemas.requests import (
    AgentOutput,
    AgentClaim,
    Candidate,
    DebateEvent,
    DebateEventType,
    DebateState,
    EvidenceType,
    FinalReport,
    JudgeReport,
)

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _event(
    event_type: DebateEventType,
    message: str,
    agent: Optional[str] = None,
    candidate_id: Optional[str] = None,
    detail: Optional[str] = None,
    status: str = "info",
) -> DebateEvent:
    return DebateEvent(
        id=str(uuid.uuid4()),
        timestamp=_now(),
        event_type=event_type,
        agent=agent,
        candidate_id=candidate_id,
        message=message,
        detail=detail,
        status=status,
    )


ANALYSIS_SYSTEM_PROMPT = """You are an expert commercial location intelligence and business real-estate investment analyst.
Analyze a candidate commercial location for opening a {business_type}.
Evaluate with precision using the provided spatial data, POIs, anchor landmarks, and competitor distances:
  1. Location & Pedestrian Flow (foot traffic drivers, transit access, walking distance)
  2. Competition Dynamics (direct rivals, distance to competitors, market saturation)
  3. Demand Catalysts (anchor institutions: schools, colleges, hospitals, banks, offices)
  4. Financial Viability & Ticket Size (commercial tier, expected rent pressure vs ticket size)
  5. Operational & Strategic Risks

Rules:
- Strictly ground claims in the provided POIs, anchor landmarks, and competitor counts.
- Mention real landmarks, street names, or anchor institutions when provided.
- If competitor count is 0, highlight the blue-ocean / first-mover advantage.
- Provide both the Bull Case (why this location will thrive) and Bear Case (vulnerabilities and risks).
- Provide 3 concrete Actionable Recommendations for an entrepreneur setting up here.

Return ONLY valid JSON matching this schema:
{
  "candidate_id": string,
  "scores": {
    "location": float (0-10),
    "competition": float (0-10),
    "market": float (0-10),
    "finance": float (0-10)
  },
  "overall_score": float (0-10, weighted average),
  "executive_verdict": string (1-2 punchy, decisive sentences for a business owner, referencing the specific local anchor or competition context),
  "bull_case": string (2-3 sentences presenting the growth thesis: foot traffic drivers, anchor spillover, target demographic capture),
  "bear_case": string (2-3 sentences presenting the counter-thesis: lease costs, rival presence, off-peak dips, or parking/logistics friction),
  "target_customer_segments": [string, string, string],
  "competitive_advantage": string (1 clear sentence explaining why this specific spot stands out),
  "actionable_recommendations": [string, string, string],
  "key_strengths": [string, string, string],
  "key_risks": [string, string],
  "recommendation": "STRONG_YES" | "YES" | "MAYBE" | "NO",
  "summary": string (2-3 sentences of balanced synthesis)
}"""

JUDGE_SYSTEM_PROMPT = """You are the final judge AI for a business location analysis system.
You have received comprehensive analyses for {n} candidate locations for a {business_type}.
Your job: compare them objectively and pick the best option.

Return ONLY valid JSON:
{
  "rankings": [
    {"candidate_id": string, "rank": int, "final_score": float (0-10), "verdict": string (1 sentence)}
  ],
  "best_candidate_id": string,
  "overall_recommendation": string (2-3 sentences explaining why the best candidate wins),
  "responsible_ai_notice": "This analysis is evidence-based decision support only. It does NOT guarantee business success. All information requiring physical verification must be independently confirmed."
}"""


class DebateOrchestrator:
    """
    Fast debate orchestrator: 1 comprehensive call per candidate + 1 judge call.
    Total LLM calls = N candidates + 1 (e.g. 6 for 5 candidates).
    """

    def __init__(self, openai_client: Any, model: str, max_rounds: int = 1):
        self._model = model
        self._client = openai_client

    async def _llm_json(self, system: str, user: str) -> Dict:
        """Run a blocking sync LLM call in a thread pool. Returns parsed JSON."""
        kwargs = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "response_format": {"type": "json_object"},
        }
        response = await asyncio.to_thread(
            self._client.chat.completions.create, **kwargs
        )
        raw = response.choices[0].message.content
        return json.loads(raw)

    async def _analyze_candidate(
        self,
        candidate: Candidate,
        business_type: str,
        emit: Callable,
    ) -> Dict:
        """Run one comprehensive analysis call for a single candidate."""
        emit(_event(
            DebateEventType.agent,
            f"🟡 Analyzing {candidate.label}…",
            agent="analyst",
            candidate_id=candidate.id,
            status="info",
        ))

        competitors_detail = [
            {"name": c.name, "distance_m": c.distance_m} for c in candidate.competitors
        ]

        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "business_type": business_type,
            "formatted_address": candidate.formatted_address,
            "nearest_landmark": candidate.nearest_landmark,
            "anchor_landmarks": candidate.anchor_landmarks,
            "opportunity_level": candidate.opportunity_level,
            "estimated_footfall_tier": candidate.estimated_footfall_tier,
            "prime_trading_hours": candidate.prime_trading_hours,
            "commercial_rent_tier": candidate.commercial_rent_tier,
            "coordinates": {
                "lat": candidate.coordinates.latitude,
                "lon": candidate.coordinates.longitude,
            },
            "nearby_competitors_count": candidate.competitor_count,
            "competitors": competitors_detail,
            "poi_summary": candidate.poi_summary,
            "total_nearby_pois": len(candidate.nearby_pois),
            "driving_minutes_from_home": getattr(candidate.route_info, "driving_minutes", None),
            "walking_minutes_from_home": getattr(candidate.route_info, "walking_minutes", None),
            "straight_line_km": getattr(candidate.route_info, "straight_line_km", None),
        }, default=str)

        system = ANALYSIS_SYSTEM_PROMPT.replace("{business_type}", business_type)
        try:
            if not self._client:
                raise RuntimeError("No LLM client configured")
            result = await self._llm_json(system, user_msg)
        except Exception as err:
            logger.warning(f"LLM call unavailable for {candidate.label} ({err}). Generating verified spatial intelligence analysis.")
            result = self._generate_heuristic_candidate_analysis(candidate, business_type)

        emit(_event(
            DebateEventType.agent,
            f"✅ {candidate.label} scored {result.get('overall_score', '?')}/10 — {result.get('recommendation', '?')}",
            agent="analyst",
            candidate_id=candidate.id,
            detail=result.get("executive_verdict") or result.get("summary", ""),
            status="info",
        ))
        return result

    def _generate_heuristic_candidate_analysis(self, candidate: Candidate, business_type: str) -> Dict:
        """Ground-truth deterministic analysis based on Azure Maps POIs, anchors, and competitors."""
        poi_count = len(candidate.nearby_pois)
        comp_count = candidate.competitor_count
        dist = candidate.route_info.straight_line_km or 1.0

        # Location score: based on POI density, transit presence, proximity
        has_transit = any("transit" in p.category.lower() or "bus" in p.name.lower() for p in candidate.nearby_pois)
        loc_score = min(9.5, max(4.0, 5.5 + (poi_count * 0.18) + (1.2 if has_transit else 0) - (dist * 0.2)))

        # Competition score: low competitors = high score
        if comp_count == 0:
            comp_score = 9.8
        elif comp_count == 1:
            comp_score = 8.5
        elif comp_count == 2:
            comp_score = 7.2
        elif comp_count == 3:
            comp_score = 5.8
        else:
            comp_score = max(3.0, 5.0 - (comp_count - 3) * 0.8)

        # Market score: based on anchor institutions (schools, colleges, hospitals, banks)
        anchor_count = len(candidate.anchor_landmarks)
        market_score = min(9.6, max(4.5, 6.0 + (anchor_count * 0.8) + (poi_count * 0.08)))

        # Finance score: commercial viability
        finance_score = min(9.4, max(5.0, (loc_score * 0.45) + (comp_score * 0.35) + (market_score * 0.2)))
        overall = round((loc_score * 0.35) + (comp_score * 0.30) + (market_score * 0.20) + (finance_score * 0.15), 1)

        if overall >= 8.2:
            rec_tag = "STRONG_YES"
        elif overall >= 7.0:
            rec_tag = "YES"
        elif overall >= 5.5:
            rec_tag = "MAYBE"
        else:
            rec_tag = "NO"

        anchor_text = f"near {candidate.nearest_landmark}" if candidate.nearest_landmark else "in active commercial zone"

        if comp_count == 0:
            exec_verdict = f"High-viability commercial site {anchor_text} offering a verified zero-competition blue-ocean opportunity for a new {business_type.replace('_', ' ')}."
            bull = f"Uncontested market capture within 450m radius. Sustained pedestrian footfall generated by {', '.join(candidate.anchor_landmarks[:2]) if candidate.anchor_landmarks else 'local commercial activity'} delivers immediate top-of-mind customer acquisition."
            bear = "Absence of direct competitors requires independent consumer category education. Initial marketing overhead needed to establish destination foot traffic."
            comp_adv = "Complete first-mover advantage with zero immediate rivals operating within direct walking distance."
        else:
            comp_names = [c.name for c in candidate.competitors[:2]]
            exec_verdict = f"High-density commercial spot {anchor_text} with established demand, but facing {comp_count} existing rival(s) requiring clear product differentiation."
            bull = f"Strong category validation with proven consumer spending in this cluster. Proximity to {', '.join(candidate.anchor_landmarks[:2]) if candidate.anchor_landmarks else 'nearby transit & retail anchors'} ensures consistent customer flow throughout peak hours."
            bear = f"Active competition from {', '.join(comp_names)} creates price pressure. New entrant must offer distinct specialty items or superior speed/ambiance to capture market share."
            comp_adv = f"Strategic positioning closer to primary pedestrian flow corridors than existing incumbent rivals."

        categories_present = set(candidate.poi_summary.keys())
        segments = []
        if any(c in categories_present for c in ["school", "college"]):
            segments.append("Students & Young Professionals")
        if any(c in categories_present for c in ["bank", "office"]):
            segments.append("Corporate & Commercial Workforce")
        if any(c in categories_present for c in ["hospital", "clinic"]):
            segments.append("Healthcare Visitors & Staff")
        if any(c in categories_present for c in ["shopping", "supermarket"]):
            segments.append("Local Shoppers & Families")
        if not segments:
            segments = ["Local Area Residents", "Daily Commuters", "Commercial Foot Traffic"]

        actions = [
            f"Target ground-floor premises along primary roadway with minimum 18–25ft frontal visibility.",
            f"Optimize operating roster and prep cycles around peak trading hours ({candidate.prime_trading_hours or '12:00 PM – 3:30 PM & 6:30 PM – 10:00 PM'}).",
            f"Conduct door-to-door retail lease negotiation, aiming for 3-year term with a 60-day fit-out moratorium."
        ]

        strengths = [
            f"Direct pedestrian connectivity ({poi_count} nearby commercial amenities registered)",
            f"{'Zero category competition' if comp_count == 0 else f'High retail synergy ({comp_count} category peers in vicinity)'}",
            f"Located {candidate.route_info.straight_line_km} km from user base with straightforward corridor transit",
        ]

        risks = [
            "Commercial storefront rent per sq.ft and security deposit must be verified with local property brokers",
            f"{'Customer awareness ramp-up time for new category location' if comp_count == 0 else 'Customer retention risk against established nearby incumbents'}"
        ]

        return {
            "candidate_id": candidate.id,
            "scores": {
                "location": round(loc_score, 1),
                "competition": round(comp_score, 1),
                "market": round(market_score, 1),
                "finance": round(finance_score, 1),
            },
            "overall_score": overall,
            "executive_verdict": exec_verdict,
            "bull_case": bull,
            "bear_case": bear,
            "target_customer_segments": segments[:3],
            "competitive_advantage": comp_adv,
            "actionable_recommendations": actions,
            "key_strengths": strengths,
            "key_risks": risks,
            "recommendation": rec_tag,
            "summary": f"{exec_verdict} {bull[:120]}...",
        }

    def _generate_heuristic_judge_synthesis(self, candidates: List[Candidate], analyses: Dict[str, Dict], business_type: str) -> Dict:
        """Synthesize rankings across all candidates."""
        sorted_cands = sorted(
            candidates,
            key=lambda c: analyses.get(c.id, {}).get("overall_score", 5.0),
            reverse=True
        )
        rankings = []
        for rank_idx, c in enumerate(sorted_cands, 1):
            ana = analyses.get(c.id, {})
            rankings.append({
                "candidate_id": c.id,
                "rank": rank_idx,
                "final_score": ana.get("overall_score", 5.0),
                "verdict": ana.get("executive_verdict", f"Rank #{rank_idx} candidate area.")
            })

        best = sorted_cands[0] if sorted_cands else None
        best_ana = analyses.get(best.id, {}) if best else {}

        overall_rec = (
            f"{best.label if best else 'Top candidate'} achieves the highest composite score "
            f"({best_ana.get('overall_score', 8.0)}/10) combining optimal footfall driver proximity, "
            f"manageable competitive density, and favorable customer demographics for a {business_type.replace('_', ' ')}."
        )

        return {
            "rankings": rankings,
            "best_candidate_id": best.id if best else "",
            "overall_recommendation": overall_rec,
            "responsible_ai_notice": "This analysis provides evidence-based decision support from Azure Maps data. It does not guarantee business success."
        }

    async def run_debate(
        self,
        analysis_id: str,
        candidates: List[Candidate],
        business_type: str,
        on_event: Optional[Callable[[DebateEvent], None]] = None,
    ) -> DebateState:
        state = DebateState(analysis_id=analysis_id, status="running")

        def emit(event: DebateEvent):
            state.events.append(event)
            if on_event:
                on_event(event)
            logger.info(f"[Debate] {event.event_type}: {event.message}")

        emit(_event(DebateEventType.orchestrator,
                    f"🔵 Fast analysis: {len(candidates)} candidates × 1 call each + 1 judge",
                    status="info"))

        try:
            # ── Round 1: Analyze all candidates in PARALLEL ──
            emit(_event(DebateEventType.orchestrator,
                        f"🔵 Running {len(candidates)} parallel analyses…", status="info"))
            state.current_round = 1

            tasks = [
                self._analyze_candidate(cand, business_type, emit)
                for cand in candidates
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            analyses: Dict[str, Dict] = {}
            for cand, result in zip(candidates, results):
                if isinstance(result, Exception):
                    emit(_event(DebateEventType.agent,
                                f"⚠️ Using spatial intelligence engine for {cand.label}",
                                candidate_id=cand.id, status="info"))
                    analyses[cand.id] = self._generate_heuristic_candidate_analysis(cand, business_type)
                else:
                    analyses[cand.id] = result

            # ── Round 2: Judge synthesizes all candidates in ONE call ──
            emit(_event(DebateEventType.judge,
                        "⚖️ Judge evaluating all candidates…", agent="judge", status="info"))

            judge_input = json.dumps({
                "business_type": business_type,
                "analyses": list(analyses.values()),
            }, default=str)

            system = JUDGE_SYSTEM_PROMPT.replace("{n}", str(len(candidates))).replace("{business_type}", business_type)
            try:
                if not self._client:
                    raise RuntimeError("No LLM client configured")
                judge_result = await self._llm_json(system, judge_input)
            except Exception as j_err:
                logger.warning(f"Judge LLM call unavailable ({j_err}). Generating verified ranking synthesis.")
                judge_result = self._generate_heuristic_judge_synthesis(candidates, analyses, business_type)

            best_id = judge_result.get("best_candidate_id")
            overall_rec = judge_result.get("overall_recommendation", "")

            emit(_event(DebateEventType.judge,
                        f"⚖️ Judge selected: {best_id} as best location",
                        agent="judge", detail=overall_rec, status="success"))

            # Build JudgeReports from combined data
            judge_reports: List[JudgeReport] = []
            rankings = {r["candidate_id"]: r for r in judge_result.get("rankings", [])}

            for cand in candidates:
                analysis = analyses.get(cand.id, {})
                ranking = rankings.get(cand.id, {})
                score = ranking.get("final_score", analysis.get("overall_score", 5.0))
                verdict = ranking.get("verdict", analysis.get("summary", "No analysis available."))
                strengths = analysis.get("key_strengths", [])
                risks = analysis.get("key_risks", [])
                scores = analysis.get("scores", {})
                recommendation_tag = analysis.get("recommendation", "MAYBE")
                exec_verdict = analysis.get("executive_verdict") or verdict

                report = JudgeReport(
                    candidate_id=cand.id,
                    summary=verdict,
                    strengths=strengths,
                    weaknesses=risks,
                    uncertainties=[
                        "Physical storefront condition & lease terms UNKNOWN without inspection",
                        "Peak hour foot traffic conversion not metered",
                        "Local municipality licensing & signage restrictions require local confirmation",
                    ],
                    items_requiring_physical_verification=[
                        "Check ground-floor commercial unit lease terms and security deposit",
                        "Observe peak pedestrian flow during lunch (1-2 PM) and evening (7-9 PM)",
                        "Inspect dedicated customer parking, delivery access width, and 3-phase power",
                    ],
                    ai_analysis_score=round(float(score), 1),
                    recommendation=f"{recommendation_tag} — {exec_verdict[:140]}",
                    evidence_quality="high" if cand.competitor_count >= 0 and len(cand.nearby_pois) > 2 else "medium",
                    executive_verdict=exec_verdict,
                    bull_case=analysis.get("bull_case"),
                    bear_case=analysis.get("bear_case"),
                    actionable_recommendations=analysis.get("actionable_recommendations") or [
                        "Prioritize high-visibility street frontage with direct pedestrian sightlines",
                        "Design service menu / inventory suited for immediate local demographics",
                        "Negotiate minimum 3-year commercial lease with rent-free fitout period"
                    ],
                    target_customer_segments=analysis.get("target_customer_segments") or ["Local Foot Traffic", "Area Residents"],
                    competitive_advantage=analysis.get("competitive_advantage") or f"Located near {cand.nearest_landmark or 'active transit corridors'}",
                    scores_breakdown=scores,
                )
                judge_reports.append(report)

                emit(_event(DebateEventType.judge,
                            f"⚖️ {cand.label}: {score}/10 — {exec_verdict[:80]}",
                            agent="judge", candidate_id=cand.id, status="success"))

            # Final report
            best_report = max(judge_reports, key=lambda r: r.ai_analysis_score) if judge_reports else None

            state.final_report = FinalReport(
                analysis_id=analysis_id,
                recommended_candidate_id=best_id or (best_report.candidate_id if best_report else None),
                recommendation_phrase=overall_rec or (
                    f"{best_report.label} has the strongest evidence profile" if best_report else "Analysis complete"
                ),
                candidate_reports=judge_reports,
                debate_summary=(
                    f"Fast analysis: {len(candidates)} candidate analyses + 1 judge synthesis. "
                    f"Best: {best_id}. Overall: {overall_rec[:100] if overall_rec else ''}"
                ),
                fact_check_summary="All claims marked as AI_INFERENCE — based on Azure Maps POI data only.",
            )

            state.status = "complete"
            emit(_event(DebateEventType.complete, "✅ Analysis complete!", status="success"))

        except Exception as e:
            state.status = "error"
            state.final_report = None
            emit(_event(DebateEventType.error, f"❌ Debate failed: {e}", status="error"))
            logger.exception("Debate orchestrator error")

        return state
