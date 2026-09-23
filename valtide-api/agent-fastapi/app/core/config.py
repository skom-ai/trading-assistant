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
        llm_framework: 'native' (hand-rolled, default) or 'langchain'
            (LangGraph orchestration + langchain-google-genai binding).
        langsmith_tracing: Enable LangSmith tracing of agent graphs.
        langsmith_api_key: LangSmith API key (unused when tracing off).
        langsmith_project: LangSmith project name for traces.
        langsmith_endpoint: LangSmith API endpoint.
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

    # --- LangChain migration (Phase 1): framework selector + observability ---
    # llm_framework switches the FR1/FR3 orchestration + LLM binding between
    # the original hand-rolled path ('native', default => zero behavior change)
    # and the LangGraph/LangChain path ('langchain'). The mock adapter and the
    # deterministic engine (FR2/FR4) are unaffected by this flag.
    llm_framework: str = "native"
    langsmith_tracing: bool = False
    langsmith_api_key: str | None = None
    langsmith_project: str = "valtide-agents"
    langsmith_endpoint: str = "https://api.smith.langchain.com"

    # --- OpenAI-compatible aggregator providers (OpenRouter / omni) ---
    # Both expose an OpenAI-shaped /v1/chat/completions surface, so one
    # adapter serves both, differing only by base_url + key. Keys are read
    # from the plain (non VT_-prefixed) env names the .env already uses
    # (OPEN_ROUTER_KEY / OMNI_ROUTE_KEY), mirroring the GEMINI_API_KEY
    # fallback pattern. Cheap/free models are the default for test runs.
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "deepseek/deepseek-v4-flash-0731:free"
    omni_base_url: str = "https://api.cheaperinference.com/v1"
    # Ordered model-selection preference for BOTH omni providers (local and
    # hosted): try free first, fall through to cheap/fast/best-fast on any
    # per-model failure (including a 400 for an id the gateway doesn't know).
    omni_model_order: str = "auto/free,auto/cheap,auto/fast,auto/best-fast"
    # Local Omni Route: an on-host OpenAI-compatible gateway. Highest
    # priority when its key is present. The base URL is read from the env
    # (LOCAL_OMNI_BASE_URL); inside Docker, 127.0.0.1 is rewritten to
    # host.docker.internal at container start (see docker-compose env).
    local_omni_base_url: str = "http://host.docker.internal:20128/v1"
    local_omni_model_order: str = "auto/free,auto/cheap,auto/fast,auto/best-fast"
    # If a Local Omni LLM call exceeds this many seconds, abandon it and fall
    # back to OpenRouter (per-model read-timeout cap). Keeps FR1/FR3 responsive
    # when the on-host gateway is slow under real (large) prompts.
    local_omni_latency_budget_s: float = 45.0

    def omni_models(self) -> list[str]:
        """Return the hosted-omni model preference list (ordered)."""
        return [m.strip() for m in self.omni_model_order.split(",") if m.strip()]

    def local_omni_models(self) -> list[str]:
        """Return the local-omni model preference list (ordered)."""
        return [m.strip() for m in self.local_omni_model_order.split(",") if m.strip()]

    internal_api_token: str = "dev-internal-token"

    # --- Data-source modes (real feeds by default; synthetic is TEST-ONLY) ---
    # 'live'      => real Yahoo Finance data via yfinance.
    # 'synthetic' => deterministic seeded generator (unit/integration tests
    #                pin this so they never hit the network or a paid API).
    market_data_mode: str = "live"
    news_mode: str = "live"

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

    def openrouter_key(self) -> str | None:
        """Return the OpenRouter key from the OPEN_ROUTER_KEY env var, if set."""
        import os

        key = os.getenv("OPEN_ROUTER_KEY")
        return key.strip() or None if key else None

    def omni_key(self) -> str | None:
        """Return the omni (cheaperinference) key from OMNI_ROUTE_KEY, if set."""
        import os

        key = os.getenv("OMNI_ROUTE_KEY")
        return key.strip() or None if key else None

    def local_omni_key(self) -> str | None:
        """Return the Local Omni Route key from LOCAL_OMNI_KEY, if set."""
        import os

        key = os.getenv("LOCAL_OMNI_KEY")
        return key.strip() or None if key else None

    def resolved_provider(self) -> str:
        """Pick the LLM provider by which key is available.

        An explicit VT_LLM_PROVIDER naming a specific provider is honored
        verbatim (operator override). Otherwise precedence is, in order:
        Local Omni -> OpenRouter -> omni (hosted) -> Gemini -> 'mock'. This
        lets FR1/FR3 run on whichever key is present without a config change,
        preferring the local gateway first.

        Returns:
            One of 'local_omni', 'openrouter', 'omni', 'gemini', or 'mock'.
        """
        explicit = self.llm_provider.lower()
        if explicit in {"local_omni", "openrouter", "omni", "mock"}:
            return explicit
        if self.local_omni_key():
            return "local_omni"
        if self.openrouter_key():
            return "openrouter"
        if self.omni_key():
            return "omni"
        if self.resolved_api_key():
            return "gemini"
        return "mock"


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
