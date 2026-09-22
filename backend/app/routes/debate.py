"""
Debate routes: start debate and poll events.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.cache import session_cache

router = APIRouter(prefix="/api/debate", tags=["debate"])


@router.post("/{analysis_id}/start")
async def start_debate(analysis_id: str):
    """Manually trigger debate for an analysis (if candidates exist but debate not started)."""
    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if not session.candidates:
        raise HTTPException(status_code=409, detail="No candidates available. Run analysis first.")

    return {
        "analysis_id": analysis_id,
        "message": "Debate is managed automatically as part of analysis. Check /api/location/{analysis_id} for status.",
    }


@router.get("/{analysis_id}")
async def get_debate(analysis_id: str):
    """Return all debate events and current state."""
    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if not session.debate:
        return {
            "analysis_id": analysis_id,
            "status": session.status,
            "events": [],
            "current_round": 0,
        }

    return {
        "analysis_id": analysis_id,
        "status": session.debate.status,
        "current_round": session.debate.current_round,
        "events": [e.model_dump() for e in session.debate.events],
        "event_count": len(session.debate.events),
        "specialist_outputs": {
            k: [o.model_dump() for o in v]
            for k, v in session.debate.specialist_outputs.items()
        },
        "critic_challenges": [c.model_dump() for c in session.debate.critic_challenges],
        "fact_check_results": {
            k: [r.model_dump() for r in v]
            for k, v in session.debate.fact_check_results.items()
        },
    }
