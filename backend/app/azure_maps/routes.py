"""
Azure Maps Route calculation.
Uses: GET /route/directions/json
Results are classified VERIFIED (from Azure Maps) or CALCULATED.
"""
from __future__ import annotations

from typing import Optional, Tuple

from app.azure_maps.client import default_params, get_maps_client


async def get_route(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    travel_mode: str = "car",
) -> Optional[Tuple[float, float]]:
    """
    Get route distance (km) and travel time (minutes) between two points.
    travel_mode: 'car' | 'pedestrian'
    Returns (distance_km, duration_minutes) or None on failure.
    Classification: VERIFIED (Azure Maps routing response)
    """
    client = get_maps_client()
    params = {
        **default_params(),
        "query": f"{origin_lat},{origin_lon}:{dest_lat},{dest_lon}",
        "travelMode": travel_mode,
        "routeType": "fastest",
    }
    try:
        resp = await client.get("/route/directions/json", params=params)
        resp.raise_for_status()
        data = resp.json()
        routes = data.get("routes", [])
        if not routes:
            return None
        summary = routes[0].get("summary", {})
        length_m = summary.get("lengthInMeters")
        travel_time_s = summary.get("travelTimeInSeconds")
        if length_m is not None:
            dist_km = round(length_m / 1000, 2)
            minutes = round(travel_time_s / 60, 1) if travel_time_s else None
            return dist_km, minutes
        return None
    except Exception:
        return None
