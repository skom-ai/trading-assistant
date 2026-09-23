"""FastAPI application factory (STOCK-601/606/608).

File: app/main.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Wires the Valtide agent service: structured logging, correlation-id
    middleware (reads X-Correlation-Id from the BFF), the feature router,
    a typed DomainError handler that emits the sanitized error envelope,
    and a health endpoint. OpenAPI at /openapi.json, Swagger UI at /docs.

Source: specs/arch/SDD.md §5, §6
"""
from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.core.config import get_settings
from app.core.errors import DomainError
from app.core.logging import configure_logging, set_correlation_id
from app.core.observability import configure_observability
from app.core.otel import configure_otel

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Build and configure the FastAPI application.

    Returns:
        The configured FastAPI instance.
    """
    settings = get_settings()
    configure_logging(settings.log_level, settings.service_name)
    # Opt-in agent tracing; strict no-op unless VT_LANGSMITH_TRACING=true + key.
    configure_observability(settings)

    app = FastAPI(
        title="Valtide Agent Service",
        version="1.0.0",
        description="Internal AI agent + deterministic engine (FR1-FR5). "
                    "Not publicly routable; called only by the NestJS BFF.",
    )

    @app.middleware("http")
    async def correlation_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
        """Bind the request correlation id for the duration of the call."""
        cid = request.headers.get("X-Correlation-Id") or str(uuid.uuid4())
        set_correlation_id(cid)
        response = await call_next(request)
        response.headers["X-Correlation-Id"] = cid
        return response

    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
        """Serialize a DomainError into the sanitized error envelope."""
        cid = request.headers.get("X-Correlation-Id", "-")
        logger.info("domain error %s: %s", exc.code.value, exc.message)
        return JSONResponse(
            status_code=exc.http_status(),
            content={"code": exc.code.value, "message": exc.message,
                     "correlation_id": cid, "details": exc.details},
        )

    @app.get("/health", tags=["ops"], summary="Liveness probe")
    def health() -> dict:
        """Return service liveness.

        Returns:
            A static ok payload with the service name.
        """
        return {"status": "ok", "service": settings.service_name}

    app.include_router(router)
    # Opt-in API tracing (OTLP -> Grafana LGTM); no-op unless OTEL endpoint set.
    configure_otel(app, settings.service_name)
    logger.info("Valtide agent service ready (llm_provider=%s)", settings.llm_provider)
    return app


app = create_app()
