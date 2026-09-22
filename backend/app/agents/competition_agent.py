"""
Competition Agent.
Analyzes direct and indirect competitors using actual Azure Maps POI data.
Never invents competitor data.
"""
from __future__ import annotations

import json

from app.agents.base_agent import BaseAgent
from app.schemas.requests import AgentClaim, AgentOutput, Candidate, EvidenceType


SYSTEM_PROMPT = """You are the Competition Analysis Agent for LocalBiz AI.
Analyze the competitive landscape for a candidate business location.

RULES:
- Use ONLY the provided competitor data from Azure Maps. NEVER invent competitors.
- VERIFIED: counts and names from Azure Maps data
- CALCULATED: density/distance calculations from verified data
- AI_INFERENCE: your interpretation of what that competition means
- Be balanced: competition is not automatically bad (can indicate demand)
- Identify gaps in competition data honestly (UNKNOWN for anything not in the data)

Return valid JSON:
{
  "agent": "competition",
  "candidate_id": str,
  "claims": [{"claim": str, "classification": "VERIFIED|CALCULATED|AI_INFERENCE", "evidence_ids": [str]}],
  "analysis": str,
  "risks": [str],
  "unknowns": [str],
  "confidence": "low|medium|high",
  "score": float (0-10, where lower = worse competition landscape)
}"""


class CompetitionAgent(BaseAgent):
    name = "competition"

    async def analyze(self, candidate: Candidate, business_type: str) -> AgentOutput:
        competitor_list = [
            {"id": c.id, "name": c.name, "category": c.category, "distance_m": c.distance_m}
            for c in candidate.competitors
        ]

        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "business_type": business_type,
            "direct_competitor_count": candidate.competitor_count,
            "competitors": competitor_list,
            "all_poi_summary": candidate.poi_summary,
        }, indent=2)

        data = await self._call_llm_json(SYSTEM_PROMPT, user_msg)

        claims = [
            AgentClaim(
                claim=c.get("claim", ""),
                classification=EvidenceType(c.get("classification", "AI_INFERENCE")),
                evidence_ids=c.get("evidence_ids", []),
            )
            for c in data.get("claims", [])
        ]

        return AgentOutput(
            agent="competition",
            candidate_id=candidate.id,
            claims=claims,
            analysis=data.get("analysis", ""),
            risks=data.get("risks", []),
            unknowns=data.get("unknowns", []),
            confidence=data.get("confidence", "medium"),
            score=data.get("score"),
        )
