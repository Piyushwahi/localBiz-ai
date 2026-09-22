"""
Critic / Debate Agent.
Challenges unsupported conclusions from specialist agents.
The most important agent for responsible AI.
"""
from __future__ import annotations

import json
from typing import Dict, List

from app.agents.base_agent import BaseAgent
from app.schemas.requests import AgentOutput, CriticChallenge


SYSTEM_PROMPT = """You are the Critic and Debate Agent for LocalBiz AI.
Your role is to challenge unsupported, overconfident, or contradictory conclusions from other agents.

WHAT TO CHALLENGE:
- Claims presented as fact without VERIFIED evidence
- Overconfident conclusions from weak indicators (e.g., "colleges = customers")
- Contradictions between agents
- Missing risks that were not mentioned
- Financial claims that were invented
- Guarantees of any kind (business success, revenue, etc.)
- Assumptions about categories not present in the actual data

DO NOT challenge:
- Mathematically correct CALCULATED facts
- VERIFIED Azure Maps data
- Honest UNKNOWN labels

Be specific and constructive. Reference actual claims made.

Return valid JSON:
{
  "challenges": [
    {
      "target_agent": str,
      "candidate_id": str,
      "challenged_claims": [str],
      "reasoning": str,
      "severity": "low|medium|high"
    }
  ],
  "overall_assessment": str,
  "identified_contradictions": [str],
  "missing_risks": [str]
}"""


class CriticAgent(BaseAgent):
    name = "critic"

    async def challenge(
        self,
        candidate_id: str,
        agent_outputs: List[AgentOutput],
    ) -> List[CriticChallenge]:
        summaries = []
        for ao in agent_outputs:
            summaries.append({
                "agent": ao.agent,
                "candidate_id": ao.candidate_id,
                "claims": [{"claim": c.claim, "classification": c.classification} for c in ao.claims],
                "analysis": ao.analysis[:500],
                "risks": ao.risks,
                "unknowns": ao.unknowns,
                "confidence": ao.confidence,
                "score": ao.score,
            })

        user_msg = json.dumps({
            "candidate_id": candidate_id,
            "agent_outputs": summaries,
        }, indent=2)

        data = await self._call_llm_json(SYSTEM_PROMPT, user_msg)

        challenges = []
        for ch in data.get("challenges", []):
            challenges.append(CriticChallenge(
                target_agent=ch.get("target_agent", "unknown"),
                candidate_id=candidate_id,
                challenged_claims=ch.get("challenged_claims", []),
                reasoning=ch.get("reasoning", ""),
                severity=ch.get("severity", "medium"),
            ))
        return challenges

    async def analyze(self, *args, **kwargs):
        return await self.challenge(*args, **kwargs)
