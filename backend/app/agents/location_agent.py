"""
Location Intelligence Agent.
Analyzes candidate coordinates, distances, route info, POI context, and accessibility.
"""
from __future__ import annotations

import json
from typing import Any, List

from app.agents.base_agent import BaseAgent
from app.schemas.requests import AgentClaim, AgentOutput, Candidate, EvidenceType


SYSTEM_PROMPT = """You are the Location Intelligence Agent for LocalBiz AI.
Your role is to analyze the geographic context of a candidate business location.

RULES:
- Only use the verified geographic data provided. Do NOT invent any facts.
- Classify every claim as VERIFIED, CALCULATED, or AI_INFERENCE.
- VERIFIED: directly from Azure Maps data
- CALCULATED: computed mathematically from verified data
- AI_INFERENCE: your interpretation of verified/calculated data
- Identify genuine risks and unknowns. Never fabricate information.
- Use evidence-based language: "evidence suggests", "data indicates", NOT "will succeed"
- Score is an AI Analysis Score (0-10), NOT a success probability.

Return a valid JSON object matching this schema:
{
  "agent": "location",
  "candidate_id": str,
  "claims": [{"claim": str, "classification": "VERIFIED|CALCULATED|AI_INFERENCE", "evidence_ids": [str]}],
  "analysis": str,
  "risks": [str],
  "unknowns": [str],
  "confidence": "low|medium|high",
  "score": float (0-10)
}"""


class LocationAgent(BaseAgent):
    name = "location"

    async def analyze(self, candidate: Candidate, business_type: str) -> AgentOutput:
        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "coordinates": candidate.coordinates.model_dump(),
            "route_info": candidate.route_info.model_dump(),
            "poi_summary": candidate.poi_summary,
            "competitor_count": candidate.competitor_count,
            "geographic_profile": candidate.geographic_profile,
            "business_type": business_type,
            "note": candidate.note,
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
            agent="location",
            candidate_id=candidate.id,
            claims=claims,
            analysis=data.get("analysis", ""),
            risks=data.get("risks", []),
            unknowns=data.get("unknowns", []),
            confidence=data.get("confidence", "medium"),
            score=data.get("score"),
        )
