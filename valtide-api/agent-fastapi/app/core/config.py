"""Application configuration.

File: app/core/config.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Centralized, typed settings for the Valtide agent service, loaded
    from environment variables (12-factor). Covers datastore DSNs, the
    LLM provider selector (mock vs live), scanner/analog versioned config,
    and service-to-service auth. No secrets are hardcoded.

Source: specs/arch/SDD.md, specs/arch/data/redis-keyspace.md
"""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings sourced from the environment.

    Attributes:
        service_name: Logical service name used in logs.
        environment: Deployment environment label (local/staging/prod).
        log_level: Root log level (INFO/DEBUG/...).
        postgres_dsn: SQLAlchemy-compatible Postgres DSN.
        redis_url: Redis connection URL.
        mongo_url: MongoDB connection URL.
        mongo_db: MongoDB trace database name.
        llm_provider: 'mock' (deterministic, default) or 'openrouter'.
        llm_api_key: API key for the live provider (unused when mock).
        llm_model: Model identifier recorded on every verdict/strategy.
        llm_temperature: Fixed low temperature for reproducibility.
        internal_api_token: Shared token the BFF must present.
        scanner_weight_version: Versioned composite-scorer weight set id.
        analog_similarity_version: Versioned FR4 similarity config id.
    """

    model_config = SettingsConfigDict(env_prefix="VT_", env_file=".env", extra="ignore")

    service_name: str = "valtide-agent"
    environment: str = "local"
    log_level: str = "INFO"

    postgres_dsn: str = "postgresql+psycopg://valtide:valtide@postgres:5432/valtide"
    redis_url: str = "redis://redis:6379/0"
    mongo_url: str = "mongodb://root:root@mongo:27017"
    mongo_db: str = "valtide_traces"

    llm_provider: str = "gemini"
    llm_api_key: str | None = None
    llm_model: str = "gemini-3.6-flash"
    llm_temperature: float = Field(default=0.1, ge=0.0, le=2.0)

    internal_api_token: str = "dev-internal-token"

    scanner_weight_version: int = 1
    analog_similarity_version: int = 1

    def resolved_api_key(self) -> str | None:
        """Resolve the LLM API key, honoring the GEMINI_API_KEY fallback.

        Precedence: VT_LLM_API_KEY (typed setting) first, then the plain
        GEMINI_API_KEY environment variable the UI/.env already use.

        Returns:
            The resolved key, or None if neither is set.
        """
        import os

        return self.llm_api_key or os.getenv("GEMINI_API_KEY") or None


@lru_cache
def get_settings() -> Settings:
    """Return a process-wide cached Settings instance.

    Returns:
        The singleton Settings loaded from the environment, with the
        GEMINI_API_KEY fallback applied to llm_api_key.
    """
    settings = Settings()
    if not settings.llm_api_key:
        settings.llm_api_key = settings.resolved_api_key()
    return settings
