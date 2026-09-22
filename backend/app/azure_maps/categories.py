"""
Azure Maps category helpers.
Dynamically extracts what categories actually exist in the returned POI data.
"""
from __future__ import annotations

from collections import Counter
from typing import Dict, List

from app.schemas.requests import POI


def extract_category_summary(pois: List[POI]) -> Dict[str, int]:
    """
    Count POIs by their category as returned by Azure Maps.
    Returns a dict of {category: count}.
    Only includes categories that actually exist in the data.
    """
    counter = Counter(poi.category for poi in pois)
    return dict(counter.most_common())


def get_present_categories(pois: List[POI]) -> List[str]:
    """Return a sorted list of categories that actually appear in the data."""
    return sorted(set(poi.category for poi in pois))


def filter_by_category(pois: List[POI], category: str) -> List[POI]:
    """Return POIs matching a specific category (case-insensitive)."""
    cat = category.lower()
    return [p for p in pois if cat in p.category.lower()]
