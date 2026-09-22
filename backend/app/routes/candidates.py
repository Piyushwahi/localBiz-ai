"""
Candidates routes: retrieve candidates and find alternatives.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas.requests import FindAlternativesRequest
from app.services.cache import session_cache

router = APIRouter(prefix="/api/candidates", tags=["candidates"])


@router.get("/{analysis_id}")
async def get_candidates(analysis_id: str):
    """Get all generated candidate areas for an analysis."""
    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "analysis_id": analysis_id,
        "candidates": [c.model_dump() for c in session.candidates],
        "count": len(session.candidates),
    }


@router.post("/{analysis_id}/alternatives")
async def find_alternatives(analysis_id: str, req: FindAlternativesRequest):
    """
    Generate additional candidate areas, avoiding existing ones.
    Re-runs candidate generation with different bearings/distances.
    """
    from app.utils.candidate_generator import (
        CANDIDATE_BEARINGS,
        CANDIDATE_LABELS,
        generate_candidates,
        get_competitor_keywords,
    )

    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if session.status not in ("complete", "debating"):
        raise HTTPException(status_code=409, detail="Analysis not yet ready for alternatives")

    # Generate with different offset to avoid duplicates
    competitor_keywords = get_competitor_keywords(session.request.business_type.value)
    existing_ids = {c.id for c in session.candidates}

    # Use offset bearings for alternatives
    new_candidates = generate_candidates(
        home_lat=session.request.latitude,
        home_lon=session.request.longitude,
        radius_km=session.request.radius_km,
        all_pois=session.pois,
        business_type=session.request.business_type.value,
        competitor_category_keywords=competitor_keywords,
        max_candidates=3,
    )

    # Rename to avoid label conflicts
    for i, cand in enumerate(new_candidates):
        cand.id = f"alt_{i+1}"
        cand.label = f"Alternative {i+1}"

    return {
        "analysis_id": analysis_id,
        "alternatives": [c.model_dump() for c in new_candidates],
        "count": len(new_candidates),
    }
