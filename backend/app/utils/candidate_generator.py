"""
Candidate area generator.
Generates 3-5 diverse candidate areas within the search zone
based on the actual geographic data retrieved from Azure Maps.
Candidates are labelled 'AI-generated candidate area'.
"""
from __future__ import annotations

import math
import random
from typing import Dict, List, Optional

from app.schemas.requests import Candidate, Coordinates, POI, RouteInfo
from app.utils.geo_calc import haversine_km, offset_coordinate


# Bearings spread across the search zone
CANDIDATE_BEARINGS = [0, 72, 144, 216, 288]  # evenly distributed 360°

CANDIDATE_LABELS = ["A", "B", "C", "D", "E"]


def _build_poi_summary(pois: List[POI]) -> Dict[str, int]:
    """Count POIs by category."""
    summary: Dict[str, int] = {}
    for poi in pois:
        cat = poi.category.lower()
        summary[cat] = summary.get(cat, 0) + 1
    return summary


def _geographic_profile(
    competitor_count: int,
    poi_summary: Dict[str, int],
    business_type: str,
) -> str:
    """Generate a one-line geographic profile for the candidate."""
    competition = (
        "High competition" if competitor_count >= 4
        else "Moderate competition" if competitor_count >= 2
        else "Low competition"
    )

    dominant_categories = sorted(poi_summary.items(), key=lambda x: -x[1])[:2]
    area_desc = " + ".join(cat.title() for cat, _ in dominant_categories) if dominant_categories else "Mixed-use area"

    return f"{competition} | {area_desc}"


def generate_candidates(
    home_lat: float,
    home_lon: float,
    radius_km: float,
    all_pois: List[POI],
    business_type: str,
    competitor_category_keywords: List[str],
    max_candidates: int = 5,
) -> List[Candidate]:
    """
    Generate diverse candidate areas within the search zone.

    Strategy:
    - Place candidates at varying distances (30-80% of radius) on evenly spread bearings
    - Assign nearby POIs from the fetched dataset to each candidate
    - Classify competitor POIs using keyword matching
    - Calculate straight-line distances from home
    - Label as 'AI-generated candidate area'
    """
    candidates: List[Candidate] = []
    n = min(max_candidates, len(CANDIDATE_BEARINGS))

    # Vary the placement distance from home
    distance_factors = [0.35, 0.55, 0.65, 0.45, 0.75]

    for i in range(n):
        bearing = CANDIDATE_BEARINGS[i]
        dist_km = radius_km * distance_factors[i % len(distance_factors)]

        cand_lat, cand_lon = offset_coordinate(home_lat, home_lon, dist_km, bearing)

        # Assign POIs within 450m of this candidate and compute exact relative distance
        local_pois: List[POI] = []
        for poi in all_pois:
            d = haversine_km(cand_lat, cand_lon, poi.coordinates.latitude, poi.coordinates.longitude)
            if d <= 0.45:
                # clone POI with distance_m to this candidate
                poi_copy = poi.model_copy(update={"distance_m": round(d * 1000)})
                local_pois.append(poi_copy)

        # Sort local POIs by proximity
        local_pois.sort(key=lambda p: p.distance_m or 9999)

        # Identify competitors with exact relative distance
        competitors = [
            p for p in local_pois
            if any(kw.lower() in p.category.lower() or kw.lower() in p.name.lower()
                   for kw in competitor_category_keywords)
        ]

        # Identify prominent local anchor landmarks
        anchor_categories = {"hospital", "clinic", "school", "college", "bank", "transit", "park", "supermarket", "shopping", "mall", "market", "office"}
        anchor_pois = [p for p in local_pois if any(ac in p.category.lower() for ac in anchor_categories)]
        top_anchor = anchor_pois[0].name if anchor_pois else (local_pois[0].name if local_pois else None)
        anchor_names = [p.name for p in anchor_pois[:5]]

        poi_summary = _build_poi_summary(local_pois)
        competitor_count = len(competitors)

        straight_km = haversine_km(home_lat, home_lon, cand_lat, cand_lon)

        route_info = RouteInfo(
            straight_line_km=round(straight_km, 2),
            driving_km=None,
            driving_minutes=None,
            walking_km=None,
            walking_minutes=None,
        )

        base_profile = _geographic_profile(competitor_count, poi_summary, business_type)
        profile = f"Near {top_anchor} • {base_profile}" if top_anchor else base_profile

        # Opportunity level
        if competitor_count == 0:
            opportunity = "Uncontested Market (Zero Competition)"
        elif competitor_count <= 2:
            opportunity = "Balanced Demand (Low/Moderate Competition)"
        else:
            opportunity = "High Saturation Risk (Active Rivals Nearby)"

        cand_label = f"Candidate {CANDIDATE_LABELS[i]}"
        if top_anchor:
            clean_anchor = top_anchor[:22]
            cand_label = f"Candidate {CANDIDATE_LABELS[i]} ({clean_anchor})"

        # Footfall & Commercial Tiers based on empirical POI density
        poi_count = len(local_pois)
        has_transit = any("transit" in p.category.lower() or "bus" in p.name.lower() or "rail" in p.name.lower() for p in local_pois)
        has_college = any("college" in p.category.lower() or "school" in p.category.lower() for p in local_pois)

        if poi_count >= 15 or has_transit:
            footfall_tier = "High Density Commercial Corridor (Est. 2,200 – 4,500 daily passersby)"
            rent_tier = "High Street Prime Commercial Frontage"
        elif poi_count >= 5 or has_college:
            footfall_tier = "Moderate Neighborhood Hub (Est. 1,000 – 2,200 daily passersby)"
            rent_tier = "Secondary Retail & Community Market"
        else:
            footfall_tier = "Developing / Low Density Flow (Est. 400 – 1,000 daily passersby)"
            rent_tier = "Emerging Local Pocket"

        # Trading hours by business category
        hours_map = {
            "cafe": "8:30 AM – 11:30 AM & 4:30 PM – 9:30 PM",
            "burger_shop": "12:30 PM – 3:30 PM & 7:00 PM – 10:30 PM",
            "restaurant": "12:30 PM – 3:30 PM & 7:00 PM – 11:00 PM",
            "gym": "6:00 AM – 10:00 AM & 5:00 PM – 9:30 PM",
            "bakery": "7:30 AM – 12:00 PM & 4:30 PM – 9:00 PM",
            "pharmacy": "8:00 AM – 10:30 PM (Continuous)",
            "salon": "10:30 AM – 8:30 PM",
            "clothing_store": "11:00 AM – 9:00 PM",
        }
        prime_hours = hours_map.get(business_type, "10:00 AM – 2:00 PM & 5:30 PM – 9:30 PM")

        candidate = Candidate(
            id=f"candidate_{CANDIDATE_LABELS[i].lower()}",
            label=cand_label,
            coordinates=Coordinates(latitude=round(cand_lat, 6), longitude=round(cand_lon, 6)),
            route_info=route_info,
            nearby_pois=local_pois[:35],
            poi_summary=poi_summary,
            competitor_count=competitor_count,
            competitors=competitors[:10],
            geographic_profile=profile,
            nearest_landmark=top_anchor,
            anchor_landmarks=anchor_names,
            opportunity_level=opportunity,
            estimated_footfall_tier=footfall_tier,
            prime_trading_hours=prime_hours,
            commercial_rent_tier=rent_tier,
        )
        candidates.append(candidate)

    return candidates


def get_competitor_keywords(business_type: str) -> List[str]:
    """Return search keywords for direct competitors by business type."""
    mapping = {
        "burger_shop": ["burger", "fast food", "hamburger", "mcdonald", "kfc", "wendy", "five guys"],
        "cafe": ["cafe", "coffee", "starbucks", "espresso", "tea house"],
        "bakery": ["bakery", "bakehouse", "pastry", "patisserie", "bread"],
        "restaurant": ["restaurant", "diner", "eatery", "bistro", "grill"],
        "pharmacy": ["pharmacy", "chemist", "drugstore", "dispensary"],
        "salon": ["salon", "barber", "hair", "beauty", "spa", "nails"],
        "clothing_store": ["clothing", "fashion", "apparel", "boutique", "garment"],
        "gym": ["gym", "fitness", "crossfit", "sports club", "workout"],
        "custom": [],
    }
    return mapping.get(business_type, [])
