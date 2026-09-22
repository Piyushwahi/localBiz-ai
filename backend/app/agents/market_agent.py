"""
Market / Demand Agent.
Analyzes actual demand indicators found in Azure Maps POI data.
IMPORTANT: Only uses categories that actually exist in the data.
"""
from __future__ import annotations

import json

from app.agents.base_agent import BaseAgent
from app.schemas.requests import AgentClaim, AgentOutput, Candidate, EvidenceType


SYSTEM_PROMPT = """You are the Market and Demand Analysis Agent for LocalBiz AI.
Analyze demand indicators for a candidate business location.

CRITICAL RULES:
- A demand indicator (schools, offices, transit) is NOT proof of customers. Say so explicitly.
- Only analyze categories that are PRESENT in the provided data. NEVER assume a category exists.
- If a category is absent, acknowledge it as UNKNOWN or note its absence.
- VERIFIED: counts directly from Azure Maps
- AI_INFERENCE: your interpretation of what those counts might suggest
- Use hedged language: "evidence suggests", "may indicate", "could represent"
- Never guarantee market demand.

Return valid JSON:
{
  "agent": "market",
  "candidate_id": str,
  "claims": [{"claim": str, "classification": "VERIFIED|CALCULATED|AI_INFERENCE", "evidence_ids": [str]}],
  "demand_indicators": {"category": count},
  "analysis": str,
  "risks": [str],
  "unknowns": [str],
  "confidence": "low|medium|high",
  "score": float (0-10)
}"""


class MarketAgent(BaseAgent):
    name = "market"

    async def analyze(self, candidate: Candidate, business_type: str) -> AgentOutput:
        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "business_type": business_type,
            "poi_summary": candidate.poi_summary,
            "total_nearby_pois": len(candidate.nearby_pois),
            "note": "Only analyze categories present in poi_summary. Do NOT assume any category exists.",
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
            agent="market",
            candidate_id=candidate.id,
            claims=claims,
            analysis=data.get("analysis", ""),
            risks=data.get("risks", []),
            unknowns=data.get("unknowns", []),
            confidence=data.get("confidence", "medium"),
            score=data.get("score"),
        )
