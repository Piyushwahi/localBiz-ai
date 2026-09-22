"""
In-memory session cache for analysis results.
Caches Azure Maps data and analysis results to reduce Azure API calls.
"""
from __future__ import annotations

from typing import Dict, Optional

from app.schemas.requests import AnalysisSession


class SessionCache:
    """Simple in-memory cache for analysis sessions."""

    def __init__(self):
        self._sessions: Dict[str, AnalysisSession] = {}

    def get(self, analysis_id: str) -> Optional[AnalysisSession]:
        return self._sessions.get(analysis_id)

    def set(self, session: AnalysisSession) -> None:
        self._sessions[session.analysis_id] = session

    def update(self, analysis_id: str, **kwargs) -> Optional[AnalysisSession]:
        session = self._sessions.get(analysis_id)
        if session:
            for k, v in kwargs.items():
                setattr(session, k, v)
        return session

    def delete(self, analysis_id: str) -> None:
        self._sessions.pop(analysis_id, None)

    def list_ids(self):
        return list(self._sessions.keys())


# Singleton cache instance
session_cache = SessionCache()
