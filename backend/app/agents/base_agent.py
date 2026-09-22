"""
Base agent class for LocalBiz AI.
All agents use a single GPT-5-mini deployment via AIProjectClient.get_openai_client().
No separate Azure Agent deployments are created.

IMPORTANT: The openai AzureOpenAI client returned by get_azure_openai_client() is
synchronous. We run it in asyncio.to_thread() so it never blocks the uvicorn event
loop — allowing poll requests to be served while agents are waiting on the AI API.
"""
from __future__ import annotations

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """Abstract base class for all LocalBiz AI agents."""

    name: str = "base"
    MAX_RETRIES: int = 2

    def __init__(self, openai_client: Any, model: str):
        self._client = openai_client
        self._model = model

    async def _call_llm(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 1.0,
        response_format: Optional[str] = None,
    ) -> str:
        """
        Call the LLM and return raw text response.
        Runs the synchronous OpenAI client in a thread pool via asyncio.to_thread()
        so the event loop stays free to serve poll/status requests while waiting.
        Note: gpt-5-mini only supports the default temperature (1).
        """
        kwargs: Dict[str, Any] = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        }
        # Only pass temperature if non-default (gpt-5-mini rejects explicit values)
        if temperature != 1.0:
            kwargs["temperature"] = temperature
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        # Run the blocking sync call in a thread so it doesn't freeze the event loop
        response = await asyncio.to_thread(
            self._client.chat.completions.create, **kwargs
        )
        return response.choices[0].message.content

    async def _call_llm_json(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Call the LLM and return parsed JSON.
        Retries on parse failure or API error.
        """
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                raw = await self._call_llm(
                    system_prompt,
                    user_message,
                    temperature=temperature,
                    response_format="json",
                )
                return json.loads(raw)
            except (json.JSONDecodeError, Exception) as e:
                if attempt == self.MAX_RETRIES:
                    logger.error(f"[{self.name}] LLM JSON parse failed after {self.MAX_RETRIES} retries: {e}")
                    raise ValueError(f"Agent {self.name} returned invalid JSON after {self.MAX_RETRIES} retries")
                logger.warning(f"[{self.name}] Retry {attempt+1} due to: {e}")

    @abstractmethod
    async def analyze(self, *args, **kwargs) -> Any:
        """Each agent implements its own analysis logic."""
        ...
