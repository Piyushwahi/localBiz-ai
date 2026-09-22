"""
Fact Checker Agent.
Verifies agent claims against the raw structured geographic data from Azure Maps.
Each claim is classified: VERIFIED | CONTRADICTED | UNSUPPORTED | UNKNOWN
"""
from __future__ import annotations

import json
from typing import Dict, List

from app.agents.base_agent import BaseAgent
from app.schemas.requests import (
    AgentOutput,
    Candidate,
    ClaimStatus,
    FactCheckResult,
)


SYSTEM_PROMPT = """You are the Fact Checker Agent for LocalBiz AI.
Your role is to verify agent claims against the actual geographic data from Azure Maps.

FOR EACH CLAIM:
- VERIFIED: the actual data confirms the claim
- CONTRADICTED: the actual data contradicts the claim (e.g., agent says 5 competitors, data shows 4)
- UNSUPPORTED: claim cannot be confirmed or denied from the available data
- UNKNOWN: no relevant data exists to check the claim

BE PRECISE:
- Check counts, distances, and category presence exactly.
- If a claim says "3 schools" and the data shows 2, it is CONTRADICTED.
- If a claim says "few restaurants" and data shows 6, consider whether "few" is accurate.
- Never make up verification status. If you cannot verify from the data, say UNSUPPORTED.

Return valid JSON:
{
  "candidate_id": str,
  "fact_checks": [
    {
      "claim": str,
      "status": "VERIFIED|CONTRADICTED|UNSUPPORTED|UNKNOWN",
      "actual_value": str or null,
      "reasoning": str
    }
  ],
  "summary": str,
  "verified_count": int,
  "contradicted_count": int,
  "unsupported_count": int
}"""


class FactCheckerAgent(BaseAgent):
    name = "fact_checker"

    async def verify(
        self,
        candidate: Candidate,
        agent_outputs: List[AgentOutput],
    ) -> List[FactCheckResult]:
        # Collect all claims to check
        all_claims = []
        for ao in agent_outputs:
            for claim in ao.claims:
                all_claims.append({
                    "agent": ao.agent,
                    "claim": claim.claim,
                    "classification": claim.classification,
                })

        actual_data = {
            "candidate_id": candidate.id,
            "label": candidate.label,
            "straight_line_km": candidate.route_info.straight_line_km,
            "driving_km": candidate.route_info.driving_km,
            "walking_km": candidate.route_info.walking_km,
            "competitor_count": candidate.competitor_count,
            "competitors": [{"name": c.name, "category": c.category} for c in candidate.competitors],
            "poi_summary": candidate.poi_summary,
            "total_pois": len(candidate.nearby_pois),
            "geographic_profile": candidate.geographic_profile,
        }

        user_msg = json.dumps({
            "candidate_id": candidate.id,
            "claims_to_verify": all_claims,
            "actual_azure_maps_data": actual_data,
        }, indent=2)

        data = await self._call_llm_json(SYSTEM_PROMPT, user_msg)

        results = []
        for fc in data.get("fact_checks", []):
            try:
                status = ClaimStatus(fc.get("status", "UNKNOWN"))
            except ValueError:
                status = ClaimStatus.UNKNOWN
            results.append(FactCheckResult(
                claim=fc.get("claim", ""),
                status=status,
                actual_value=fc.get("actual_value"),
                reasoning=fc.get("reasoning", ""),
            ))
        return results

    async def analyze(self, *args, **kwargs):
        return await self.verify(*args, **kwargs)
