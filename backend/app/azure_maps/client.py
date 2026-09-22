"""
Azure Maps HTTP client.
The subscription key is read from environment and NEVER returned to the frontend.
All Azure Maps calls are server-side only.
"""
from __future__ import annotations

import httpx
from app.config import get_settings

_settings = get_settings()

# Shared async client (reused across requests)
_async_client: httpx.AsyncClient | None = None


def get_maps_client() -> httpx.AsyncClient:
    """Return the shared async httpx client for Azure Maps."""
    global _async_client
    if _async_client is None or _async_client.is_closed:
        _async_client = httpx.AsyncClient(
            base_url=_settings.azure_maps_base_url,
            timeout=httpx.Timeout(30.0),
        )
    return _async_client


def default_params() -> dict:
    """Return common Azure Maps query parameters."""
    return {
        "api-version": _settings.azure_maps_api_version,
        "subscription-key": _settings.azure_maps_key,
    }


async def close_client() -> None:
    global _async_client
    if _async_client and not _async_client.is_closed:
        await _async_client.aclose()
        _async_client = None
