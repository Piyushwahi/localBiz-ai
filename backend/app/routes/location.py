"""
Location routes: address search and geocoding.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.azure_maps.geocoding import geocode_address
from app.config import get_settings
from app.schemas.requests import (
    AddressSearchRequest,
    AddressSearchResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    Coordinates,
)
from app.services.analysis_service import start_analysis

router = APIRouter(prefix="/api/location", tags=["location"])
settings = get_settings()


@router.get("/maps-key")
async def get_maps_key():
    """
    Return the Azure Maps subscription key for frontend map tile rendering.
    This is a read-only rendering key — all POI data queries stay server-side.
    """
    return {"key": settings.azure_maps_key if settings.maps_configured else ""}



@router.post("/search", response_model=AddressSearchResponse)
async def search_address(req: AddressSearchRequest):
    """
    Convert a text address to coordinates using Azure Maps geocoding.
    The Azure Maps key is NEVER returned to the client.
    """
    if not settings.maps_configured:
        raise HTTPException(
            status_code=503,
            detail="Azure Maps is not configured. Please set AZURE_MAPS_KEY in .env",
        )

    result = await geocode_address(req.address)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Azure Maps could not geocode this address. Please try a different address or check Azure Maps configuration.",
        )

    lat, lon, formatted = result
    return AddressSearchResponse(
        address=formatted,
        coordinates=Coordinates(latitude=lat, longitude=lon),
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def start_location_analysis(req: AnalyzeRequest):
    """
    Start a full location analysis. Returns analysis_id immediately.
    Analysis runs in background (geocoding, POIs, candidates, debate).
    """
    if not settings.maps_configured:
        raise HTTPException(
            status_code=503,
            detail="Azure Maps is not configured. Please set AZURE_MAPS_KEY in .env",
        )

    analysis_id = await start_analysis(req)
    return AnalyzeResponse(
        analysis_id=analysis_id,
        status="started",
        message="Analysis started. Poll /api/location/{analysis_id} for status.",
    )


@router.get("/{analysis_id}")
async def get_analysis_status(analysis_id: str):
    """Get the current status and geographic data for an analysis session."""
    from app.services.cache import session_cache

    session = session_cache.get(analysis_id)
    if not session:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "analysis_id": session.analysis_id,
        "status": session.status,
        "home_coordinates": session.home_coordinates.model_dump() if session.home_coordinates else None,
        "home_address": session.home_address,
        "poi_count": len(session.pois),
        "candidate_count": len(session.candidates),
        "error_message": session.error_message,
        "demo_mode": session.demo_mode,
    }
