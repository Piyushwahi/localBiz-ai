"""
Geographic calculation utilities.
Uses the Haversine formula for great-circle distance.
All distance calculations are CALCULATED (not AI-generated).
"""
from __future__ import annotations

import math
from typing import Tuple


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on Earth.
    Returns distance in kilometers.
    Classification: CALCULATED
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


def offset_coordinate(
    lat: float,
    lon: float,
    distance_km: float,
    bearing_deg: float,
) -> Tuple[float, float]:
    """
    Calculate a new coordinate given a starting point, distance, and bearing.
    Returns (new_lat, new_lon).
    Classification: CALCULATED
    """
    phi = math.radians(lat)
    lam = math.radians(lon)
    theta = math.radians(bearing_deg)

    d = distance_km / EARTH_RADIUS_KM  # angular distance

    new_phi = math.asin(
        math.sin(phi) * math.cos(d)
        + math.cos(phi) * math.sin(d) * math.cos(theta)
    )
    new_lam = lam + math.atan2(
        math.sin(theta) * math.sin(d) * math.cos(phi),
        math.cos(d) - math.sin(phi) * math.sin(new_phi),
    )
    return math.degrees(new_phi), math.degrees(new_lam)


def point_in_circle(
    lat: float,
    lon: float,
    center_lat: float,
    center_lon: float,
    radius_km: float,
) -> bool:
    """Check if a point is within a given radius of a center coordinate."""
    return haversine_km(lat, lon, center_lat, center_lon) <= radius_km
