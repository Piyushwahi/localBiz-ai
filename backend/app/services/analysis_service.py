"""
Main analysis service.
Orchestrates the full workflow:
  1. Geocode home location
  2. Fetch Azure Maps POIs
  3. Generate candidates
  4. Optionally enrich with route data
  5. Run multi-agent debate
"""
from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any, Optional

from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential, ClientSecretCredential

from app.azure_maps.geocoding import geocode_address, reverse_geocode
from app.azure_maps.routes import get_route
from app.azure_maps.search import fetch_all_area_pois
from app.config import get_settings
from app.debate.orchestrator import DebateOrchestrator
from app.schemas.requests import (
    AnalysisSession,
    AnalyzeRequest,
    Candidate,
    Coordinates,
)
from app.services.cache import session_cache
from app.utils.candidate_generator import generate_candidates, get_competitor_keywords

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_credential():
    """Return Azure credential. Prefers DefaultAzureCredential, falls back to client secret."""
    if settings.azure_client_id and settings.azure_client_secret and settings.azure_tenant_id:
        return ClientSecretCredential(
            tenant_id=settings.azure_tenant_id,
            client_id=settings.azure_client_id,
            client_secret=settings.azure_client_secret,
        )
    return DefaultAzureCredential()


def _get_openai_client() -> Any:
    """
    Get an AzureOpenAI-compatible client from Azure AI Foundry.
    Uses AIProjectClient.inference.get_azure_openai_client() (azure-ai-projects 1.0.0b11+).
    Returns an openai.AzureOpenAI-compatible client if credentials available, else None.
    """
    try:
        credential = _get_credential()
        project_client = AIProjectClient(
            endpoint=settings.foundry_project_endpoint,
            credential=credential,
        )
        return project_client.inference.get_azure_openai_client(api_version="2024-10-21")
    except Exception as e:
        logger.warning(f"Could not initialize Azure AI Foundry client: {e}")
        return None


async def start_analysis(request: AnalyzeRequest) -> str:
    """
    Begin an analysis session. Returns analysis_id immediately.
    The actual analysis runs in the background.
    """
    analysis_id = str(uuid.uuid4())

    session = AnalysisSession(
        analysis_id=analysis_id,
        status="pending",
        request=request,
        home_coordinates=Coordinates(
            latitude=request.latitude,
            longitude=request.longitude,
        ),
        demo_mode=settings.demo_mode,
    )
    session_cache.set(session)

    # Fire and forget
    asyncio.create_task(run_full_analysis(analysis_id))

    return analysis_id


async def run_full_analysis(analysis_id: str) -> None:
    """
    Complete analysis pipeline run as a background task.
    """
    session = session_cache.get(analysis_id)
    if not session:
        return

    try:
        # ── Step 1: Reverse geocode home address ──
        session_cache.update(analysis_id, status="geocoding")
        home_address = await reverse_geocode(
            session.request.latitude,
            session.request.longitude,
        )
        session_cache.update(analysis_id, home_address=home_address)

        # ── Step 2: Fetch POIs from Azure Maps ──
        session_cache.update(analysis_id, status="maps_fetching")
        competitor_keywords = get_competitor_keywords(session.request.business_type.value)

        pois = await fetch_all_area_pois(
            lat=session.request.latitude,
            lon=session.request.longitude,
            radius_km=session.request.radius_km,
            business_type=session.request.business_type.value,
            competitor_keywords=competitor_keywords,
        )
        session_cache.update(analysis_id, pois=pois, status="generating_candidates")

        # ── Step 3: Generate candidates ──
        candidates = generate_candidates(
            home_lat=session.request.latitude,
            home_lon=session.request.longitude,
            radius_km=session.request.radius_km,
            all_pois=pois,
            business_type=session.request.business_type.value,
            competitor_category_keywords=competitor_keywords,
            max_candidates=settings.max_candidates,
        )

        # ── Step 4: Enrich with route and exact address data from Azure Maps ──
        candidates = await _enrich_with_routes_and_addresses(
            session.request.latitude,
            session.request.longitude,
            candidates,
        )

        session_cache.update(analysis_id, candidates=candidates, status="debating")

        # ── Step 5: Multi-agent debate ──
        if not settings.foundry_configured:
            session_cache.update(
                analysis_id,
                status="error",
                error_message="Azure AI Foundry is not configured. Please set FOUNDRY_PROJECT_ENDPOINT in .env",
            )
            return

        openai_client = _get_openai_client()
        orchestrator = DebateOrchestrator(
            openai_client=openai_client,
            model=settings.foundry_model_deployment,
            max_rounds=settings.max_debate_rounds,
        )

        debate_state = await orchestrator.run_debate(
            analysis_id=analysis_id,
            candidates=candidates,
            business_type=session.request.business_type.value,
        )

        session_cache.update(
            analysis_id,
            debate=debate_state,
            final_report=debate_state.final_report,
            status="complete",
        )

    except Exception as e:
        logger.exception(f"Analysis {analysis_id} failed")
        session_cache.update(
            analysis_id,
            status="error",
            error_message=str(e),
        )


async def _enrich_with_routes_and_addresses(
    home_lat: float,
    home_lon: float,
    candidates: list[Candidate],
) -> list[Candidate]:
    """Fetch driving routes, walking routes, and verified reverse-geocoded addresses from Azure Maps."""
    tasks_driving = [
        get_route(home_lat, home_lon, c.coordinates.latitude, c.coordinates.longitude, "car")
        for c in candidates
    ]
    tasks_walking = [
        get_route(home_lat, home_lon, c.coordinates.latitude, c.coordinates.longitude, "pedestrian")
        for c in candidates
    ]
    tasks_address = [
        reverse_geocode(c.coordinates.latitude, c.coordinates.longitude)
        for c in candidates
    ]

    driving_results = await asyncio.gather(*tasks_driving, return_exceptions=True)
    walking_results = await asyncio.gather(*tasks_walking, return_exceptions=True)
    address_results = await asyncio.gather(*tasks_address, return_exceptions=True)

    for i, cand in enumerate(candidates):
        d = driving_results[i]
        w = walking_results[i]
        addr = address_results[i]
        if isinstance(d, tuple) and d:
            cand.route_info.driving_km = d[0]
            cand.route_info.driving_minutes = d[1]
        if isinstance(w, tuple) and w:
            cand.route_info.walking_km = w[0]
            cand.route_info.walking_minutes = w[1]
        if isinstance(addr, str) and addr:
            cand.formatted_address = addr
            first_seg = addr.split(",")[0].strip()
            if first_seg and "(" not in cand.label:
                cand.label = f"{cand.label} ({first_seg[:24]})"

    return candidates
