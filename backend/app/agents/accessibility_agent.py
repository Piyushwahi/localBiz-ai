"""
Accessibility Agent.
Analyzes road access, transit proximity, parking indicators, walking accessibility.
Only uses actually available data.
"""
from __future__ import annotations

import json

from app.agents.base_agent import BaseAgent
from app.schemas.requests import AgentClaim, AgentOutput, Candidate, EvidenceType


SYSTEM_PROMPT = """You are the Accessibility Analysis Agent for LocalBiz AI.
Analyze access and transportation characteristics of a candidate business location.

RULES:
- VERIFIED: route distances and times from Azure Maps routing
- CALCULATED: derived from verified data (e.g., walking time from distance)
- AI_INFERENCE: interpretation of what the access indicators suggest
- UNKNOWN: anything not available in the provided data
- Do NOT invent parking counts, bus routes, or road quality data.
- If transit/parking data is missing, say UNKNOWN.
- Straight-line distance ≠ actual walking/driving route. Distinguish clearly.

Return valid JSON:
{
  "agent": "accessibility",
  "candidate_id": str,
  "claims": [{"claim": str, "classification": "VERIFIED|CALCULATED|AI_INFERENCE|UNKNOWN", "evidence_ids": [str]}],
  "analysis": str,
  "risks": [str],
  "unknowns": [str],
  "confidence": "low|medium|high",
  "score": float (0-10)
}"""


class AccessibilityAgent(BaseAgent):
    name = "accessibility"

    async def analyze(self, candidate: Candidate, business_type: str) -> AgentOutput:
        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "business_type": business_type,
            "straight_line_km": candidate.route_info.straight_line_km,
            "driving_km": candidate.route_info.driving_km,
            "driving_minutes": candidate.route_info.driving_minutes,
            "walking_km": candidate.route_info.walking_km,
            "walking_minutes": candidate.route_info.walking_minutes,
            "transit_nearby": candidate.poi_summary.get("transit", 0),
            "parking_nearby": candidate.poi_summary.get("parking", 0),
            "poi_summary": candidate.poi_summary,
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
            agent="accessibility",
            candidate_id=candidate.id,
            claims=claims,
            analysis=data.get("analysis", ""),
            risks=data.get("risks", []),
            unknowns=data.get("unknowns", []),
            confidence=data.get("confidence", "medium"),
            score=data.get("score"),
        )
