"""
Finance Agent.
Analyzes financial information that is actually available.
Never invents rent, revenue, or profit figures.
"""
from __future__ import annotations

import json

from app.agents.base_agent import BaseAgent
from app.schemas.requests import AgentClaim, AgentOutput, Candidate, EvidenceType


SYSTEM_PROMPT = """You are the Financial Analysis Agent for LocalBiz AI.
Analyze available financial indicators for a candidate business location.

CRITICAL RULES:
- NEVER invent rent figures, revenue projections, or profit estimates.
- If financial data is not provided, classify it as UNKNOWN and say so.
- You may infer general cost indicators from: competitor density, commercial area type, transit access.
- Always label inferences as AI_INFERENCE.
- Items requiring physical verification must be explicitly listed.
- Do NOT claim that a location will be profitable.

Known unknowns to always report:
- Actual commercial rent (UNKNOWN unless provided)
- Property availability (UNKNOWN unless verified)
- Foot traffic counts (UNKNOWN unless measured)
- Local business license requirements (UNKNOWN)

Return valid JSON:
{
  "agent": "finance",
  "candidate_id": str,
  "claims": [{"claim": str, "classification": "VERIFIED|CALCULATED|AI_INFERENCE|UNKNOWN", "evidence_ids": [str]}],
  "analysis": str,
  "risks": [str],
  "unknowns": [str],
  "items_requiring_physical_verification": [str],
  "confidence": "low|medium|high",
  "score": float (0-10, where score = quality of financial evidence, NOT profit likelihood)
}"""


class FinanceAgent(BaseAgent):
    name = "finance"

    async def analyze(
        self,
        candidate: Candidate,
        business_type: str,
        user_budget: float | None = None,
    ) -> AgentOutput:
        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "label": candidate.label,
            "business_type": business_type,
            "competitor_count": candidate.competitor_count,
            "poi_summary": candidate.poi_summary,
            "geographic_profile": candidate.geographic_profile,
            "user_budget": user_budget,
            "available_financial_data": "none — no verified rent or property data",
            "note": (
                "Do NOT invent any financial figures. "
                "Report UNKNOWN for rent, property cost, revenue, and profit. "
                "Only analyze what can be inferred from geographic context."
            ),
        }, indent=2)

        data = await self._call_llm_json(SYSTEM_PROMPT, user_msg)

        claims = [
            AgentClaim(
                claim=c.get("claim", ""),
                classification=EvidenceType(c.get("classification", "UNKNOWN")),
                evidence_ids=c.get("evidence_ids", []),
            )
            for c in data.get("claims", [])
        ]

        output = AgentOutput(
            agent="finance",
            candidate_id=candidate.id,
            claims=claims,
            analysis=data.get("analysis", ""),
            risks=data.get("risks", []),
            unknowns=data.get("unknowns", []),
            confidence=data.get("confidence", "low"),
            score=data.get("score"),
        )
        # Add physical verification items to unknowns
        physical = data.get("items_requiring_physical_verification", [])
        output.unknowns = list(set(output.unknowns + physical))
        return output
