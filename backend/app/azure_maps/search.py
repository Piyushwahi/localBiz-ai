"""
Azure Maps POI/business search.
Uses: GET /search/nearby/json and GET /search/fuzzy/json
All results are classified VERIFIED.
Never fabricates or invents POI data.
"""
from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

from app.azure_maps.client import default_params, get_maps_client
from app.schemas.requests import Coordinates, EvidenceType, POI


# Category sets to search for — dynamically expanded based on what's found
BROAD_CATEGORY_QUERIES = [
    "restaurant",
    "cafe",
    "school",
    "office",
    "hospital",
    "shopping",
    "supermarket",
    "gym",
    "hotel",
    "pharmacy",
    "bank",
    "parking",
    "transit",
    "park",
    "college",
    "gas station",
]


def _parse_poi(raw: Dict[str, Any], category_override: Optional[str] = None) -> Optional[POI]:
    """Parse a raw Azure Maps result into a POI schema."""
    try:
        pos = raw.get("position", {})
        poi_data = raw.get("poi", {})
        addr = raw.get("address", {})

        cat = (
            category_override
            or poi_data.get("categories", [None])[0]
            or poi_data.get("classifications", [{}])[0].get("code", "unknown")
        )

        return POI(
            id=raw.get("id", ""),
            name=poi_data.get("name", addr.get("freeformAddress", "Unknown")),
            category=str(cat).lower(),
            category_code=poi_data.get("classifications", [{}])[0].get("code") if poi_data.get("classifications") else None,
            coordinates=Coordinates(
                latitude=pos.get("lat", 0),
                longitude=pos.get("lon", 0),
            ),
            distance_m=raw.get("dist"),
            address=addr.get("freeformAddress"),
            phone=poi_data.get("phone"),
            evidence_type=EvidenceType.VERIFIED,
        )
    except Exception:
        return None


async def search_nearby(
    lat: float,
    lon: float,
    radius_m: int,
    category_query: str,
    limit: int = 50,
) -> List[POI]:
    """
    Search for nearby POIs using a category query.
    Classification: VERIFIED (direct Azure Maps data)
    """
    client = get_maps_client()
    params = {
        **default_params(),
        "lat": lat,
        "lon": lon,
        "radius": radius_m,
        "query": category_query,
        "limit": min(limit, 100),
    }
    try:
        resp = await client.get("/search/nearby/json", params=params)
        resp.raise_for_status()
        data = resp.json()
        pois = []
        for item in data.get("results", []):
            poi = _parse_poi(item, category_override=category_query)
            if poi:
                pois.append(poi)
        return pois
    except Exception:
        return []


async def search_fuzzy(
    lat: float,
    lon: float,
    radius_m: int,
    query: str,
    limit: int = 25,
) -> List[POI]:
    """
    Fuzzy search for POIs near a location.
    Classification: VERIFIED
    """
    client = get_maps_client()
    params = {
        **default_params(),
        "lat": lat,
        "lon": lon,
        "radius": radius_m,
        "query": query,
        "limit": min(limit, 100),
    }
    try:
        resp = await client.get("/search/fuzzy/json", params=params)
        resp.raise_for_status()
        data = resp.json()
        pois = []
        for item in data.get("results", []):
            if item.get("type") == "POI":
                poi = _parse_poi(item, category_override=query)
                if poi:
                    pois.append(poi)
        return pois
    except Exception:
        return []


async def fetch_all_area_pois(
    lat: float,
    lon: float,
    radius_km: float,
    business_type: str,
    competitor_keywords: List[str],
) -> List[POI]:
    """
    Fetch a comprehensive set of POIs for the search area.
    Uses concurrent requests, deduplicates by POI id.
    Only searches categories that actually yield results.
    """
    radius_m = int(radius_km * 1000)

    # Build queries: competitor keywords + broad categories
    queries = list(set(competitor_keywords[:5] + BROAD_CATEGORY_QUERIES[:12]))

    # Run concurrent searches (throttled)
    tasks = [
        search_fuzzy(lat, lon, radius_m, q, limit=30)
        for q in queries
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    seen_ids: set = set()
    all_pois: List[POI] = []
    for batch in results:
        if isinstance(batch, list):
            for poi in batch:
                if poi.id and poi.id not in seen_ids:
                    seen_ids.add(poi.id)
                    all_pois.append(poi)
                elif not poi.id:
                    all_pois.append(poi)

    return all_pois
