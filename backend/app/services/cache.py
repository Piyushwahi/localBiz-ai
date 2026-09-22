"""
Session cache with in-memory fast-path and disk-backed persistence.
Ensures sessions survive Vercel serverless container recycles and reloads.
"""
from __future__ import annotations

import logging
import os
import tempfile
from typing import Dict, Optional

from app.schemas.requests import AnalysisSession

logger = logging.getLogger(__name__)

# Writable directory across Linux/Vercel (/tmp) and Windows
CACHE_DIR = os.path.join(tempfile.gettempdir(), "localbiz_sessions")
try:
    os.makedirs(CACHE_DIR, exist_ok=True)
except Exception as _e:
    logger.warning(f"Could not create cache directory {CACHE_DIR}: {_e}")


class SessionCache:
    """Dual-layer cache: in-memory dict + disk JSON files for serverless resilience."""

    def __init__(self):
        self._sessions: Dict[str, AnalysisSession] = {}

    def _file_path(self, analysis_id: str) -> str:
        # Sanitize id
        clean_id = "".join(c for c in analysis_id if c.isalnum() or c in "-_")
        return os.path.join(CACHE_DIR, f"{clean_id}.json")

    def get(self, analysis_id: str) -> Optional[AnalysisSession]:
        # 1. Fast path: in-memory
        if analysis_id in self._sessions:
            return self._sessions[analysis_id]

        # 2. Disk fallback: check cache directory
        try:
            path = self._file_path(analysis_id)
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                session = AnalysisSession.model_validate_json(content)
                self._sessions[analysis_id] = session
                return session
        except Exception as e:
            logger.warning(f"Failed to read session {analysis_id} from disk: {e}")

        return None

    def set(self, session: AnalysisSession) -> None:
        self._sessions[session.analysis_id] = session
        try:
            path = self._file_path(session.analysis_id)
            with open(path, "w", encoding="utf-8") as f:
                f.write(session.model_dump_json())
        except Exception as e:
            logger.warning(f"Failed to write session {session.analysis_id} to disk: {e}")

    def update(self, analysis_id: str, **kwargs) -> Optional[AnalysisSession]:
        session = self.get(analysis_id)
        if session:
            for k, v in kwargs.items():
                setattr(session, k, v)
            self.set(session)
        return session

    def delete(self, analysis_id: str) -> None:
        self._sessions.pop(analysis_id, None)
        try:
            path = self._file_path(analysis_id)
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass

    def list_ids(self):
        ids = set(self._sessions.keys())
        try:
            if os.path.exists(CACHE_DIR):
                for fname in os.listdir(CACHE_DIR):
                    if fname.endswith(".json"):
                        ids.add(fname[:-5])
        except Exception:
            pass
        return list(ids)


# Singleton cache instance
session_cache = SessionCache()

