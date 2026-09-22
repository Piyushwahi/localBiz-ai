"""
Judge / Synthesis Agent.
Produces the final balanced analysis from all agent outputs.
Never guarantees success. Uses evidence-based language.
"""
from __future__ import annotations

import json
from typing import List

from app.agents.base_agent import BaseAgent
from app.schemas.requests import (
    AgentOutput,
    Candidate,
    CriticChallenge,
    FactCheckResult,
    JudgeReport,
)


SYSTEM_PROMPT = """You are the Judge and Synthesis Agent for LocalBiz AI.
Produce the final balanced analysis of a candidate business location.

CRITICAL RULES:
- Do NOT claim any location will succeed or fail.
- Use evidence-based language ONLY:
  "Currently has the strongest evidence profile"
  "Merits further investigation"
  "Evidence suggests"
  "Requires physical verification"
  "Evidence indicates"
  "Data shows"
  NOT: "Will succeed", "Guaranteed", "Best location", "Perfect spot"
- The AI Analysis Score (0-10) reflects evidence quality and profile strength ONLY.
  It is NOT a success probability. Always include the disclaimer.
- Acknowledge all uncertainties honestly.
- List ALL items that require physical verification.
- Summarize the debate (critic challenges and revisions) objectively.

Return valid JSON:
{
  "candidate_id": str,
  "summary": str,
  "strengths": [str],
  "weaknesses": [str],
  "uncertainties": [str],
  "items_requiring_physical_verification": [str],
  "ai_analysis_score": float (0-10),
  "recommendation": str (use evidence-based language only),
  "evidence_quality": "high|medium|low",
  "debate_summary": str
}"""


class JudgeAgent(BaseAgent):
    name = "judge"

    async def synthesize(
        self,
        candidate: Candidate,
        specialist_outputs: List[AgentOutput],
        critic_challenges: List[CriticChallenge],
        fact_checks: List[FactCheckResult],
        business_type: str,
    ) -> JudgeReport:
        agent_summaries = [
            {
                "agent": ao.agent,
                "analysis": ao.analysis[:600],
                "risks": ao.risks,
                "unknowns": ao.unknowns,
                "score": ao.score,
                "confidence": ao.confidence,
            }
            for ao in specialist_outputs
        ]

        critic_summaries = [
            {
                "target": ch.target_agent,
                "challenges": ch.challenged_claims,
                "reasoning": ch.reasoning[:300],
                "severity": ch.severity,
            }
            for ch in critic_challenges
        ]

        fact_check_summaries = [
            {
                "claim": fc.claim[:200],
                "status": fc.status,
                "actual": fc.actual_value,
            }
            for fc in fact_checks[:20]
        ]

        verified_ct = sum(1 for fc in fact_checks if fc.status == "VERIFIED")
        contradicted_ct = sum(1 for fc in fact_checks if fc.status == "CONTRADICTED")

        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "business_type": business_type,
            "geographic_profile": candidate.geographic_profile,
            "straight_line_km": candidate.route_info.straight_line_km,
            "competitor_count": candidate.competitor_count,
            "specialist_analyses": agent_summaries,
            "critic_challenges": critic_summaries,
            "fact_check_summary": {
                "verified": verified_ct,
                "contradicted": contradicted_ct,
                "details": fact_check_summaries,
            },
        }, indent=2)

        data = await self._call_llm_json(SYSTEM_PROMPT, user_msg)

        return JudgeReport(
            candidate_id=candidate.id,
            summary=data.get("summary", ""),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            uncertainties=data.get("uncertainties", []),
            items_requiring_physical_verification=data.get("items_requiring_physical_verification", []),
            ai_analysis_score=float(data.get("ai_analysis_score", 5.0)),
            recommendation=data.get("recommendation", "Merits further investigation"),
            evidence_quality=data.get("evidence_quality", "medium"),
            debate_summary=data.get("debate_summary", ""),
        )

    async def analyze(self, *args, **kwargs):
        return await self.synthesize(*args, **kwargs)
