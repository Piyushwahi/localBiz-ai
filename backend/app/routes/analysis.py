"""
Analysis routes: get POIs and final analysis.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.cache import session_cache

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/{analysis_id}")
async def get_final_analysis(analysis_id: str):
    """Return the complete final analysis including judge reports."""
    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    if session.status == "error":
        raise HTTPException(
            status_code=500,
            detail=session.error_message or "Analysis failed",
        )

    response = {
        "analysis_id": analysis_id,
        "status": session.status,
        "home_coordinates": session.home_coordinates.model_dump() if session.home_coordinates else None,
        "home_address": session.home_address,
        "request": session.request.model_dump(),
        "poi_count": len(session.pois),
        "pois": [p.model_dump() for p in session.pois[:200]],  # cap for performance
        "candidates": [c.model_dump() for c in session.candidates],
        "final_report": session.final_report.model_dump() if session.final_report else None,
        "demo_mode": session.demo_mode,
    }
    return response


@router.get("/{analysis_id}/pois")
async def get_pois(analysis_id: str, category: str | None = None):
    """Get POIs for an analysis, optionally filtered by category."""
    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    pois = session.pois
    if category:
        pois = [p for p in pois if category.lower() in p.category.lower()]

    # Get unique categories present
    categories = sorted(set(p.category for p in session.pois))

    return {
        "analysis_id": analysis_id,
        "total": len(pois),
        "pois": [p.model_dump() for p in pois[:500]],
        "available_categories": categories,
    }
