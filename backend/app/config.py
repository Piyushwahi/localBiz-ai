"""
Configuration management for LocalBiz AI backend.
Reads environment variables from .env file using pydantic-settings.
Credentials are NEVER exposed to the frontend.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Azure Maps — server-side only
    azure_maps_key: str = Field(default="", alias="AZURE_MAPS_KEY")
    azure_maps_base_url: str = "https://atlas.microsoft.com"
    azure_maps_api_version: str = "1.0"

    # Azure AI Foundry
    foundry_project_endpoint: str = Field(default="", alias="FOUNDRY_PROJECT_ENDPOINT")
    foundry_model_deployment: str = Field(default="gpt-4o-mini", alias="FOUNDRY_MODEL_DEPLOYMENT")

    # Azure Identity
    azure_tenant_id: str = Field(default="", alias="AZURE_TENANT_ID")
    azure_client_id: str = Field(default="", alias="AZURE_CLIENT_ID")
    azure_client_secret: str = Field(default="", alias="AZURE_CLIENT_SECRET")

    # App settings
    cors_origins: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        alias="CORS_ORIGINS",
    )
    demo_mode: bool = Field(default=False, alias="DEMO_MODE")

    # Analysis limits (cost control)
    max_candidates: int = 5
    max_debate_rounds: int = 2

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",")]
        return v

    @property
    def azure_configured(self) -> bool:
        return bool(self.azure_maps_key and self.foundry_project_endpoint)

    @property
    def maps_configured(self) -> bool:
        return bool(self.azure_maps_key)

    @property
    def foundry_configured(self) -> bool:
        return bool(self.foundry_project_endpoint)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
