"""
Azure Maps Geocoding — address to coordinates.
Uses: GET /search/address/json
All results are classified VERIFIED.
"""
from __future__ import annotations

from typing import Optional, Tuple

from app.azure_maps.client import default_params, get_maps_client
from app.config import get_settings


async def geocode_address(address: str) -> Optional[Tuple[float, float, str]]:
    """
    Convert an address string to (latitude, longitude, formatted_address).
    Returns None on failure.
    Classification: VERIFIED (direct Azure Maps response)
    """
    client = get_maps_client()
    params = {
        **default_params(),
        "query": address,
        "limit": 1,
    }
    try:
        resp = await client.get("/search/address/json", params=params)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        if not results:
            return None

        top = results[0]
        pos = top["position"]
        lat = pos["lat"]
        lon = pos["lon"]
        formatted = top.get("address", {}).get("freeformAddress", address)
        return lat, lon, formatted
    except Exception:
        return None


async def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """
    Convert (lat, lon) to a human-readable address string.
    Classification: VERIFIED
    """
    client = get_maps_client()
    params = {
        **default_params(),
        "query": f"{lat},{lon}",
        "number": 1,
    }
    try:
        resp = await client.get("/search/address/reverse/json", params=params)
        resp.raise_for_status()
        data = resp.json()
        addresses = data.get("addresses", [])
        if addresses:
            return addresses[0].get("address", {}).get("freeformAddress")
        return None
    except Exception:
        return None
