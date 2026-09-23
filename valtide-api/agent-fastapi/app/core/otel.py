"""OpenTelemetry API instrumentation (LangChain migration, Phase 6).

File: app/core/otel.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Wires OpenTelemetry tracing for the FastAPI agent service, exporting
    OTLP/HTTP to whatever collector OTEL_EXPORTER_OTLP_ENDPOINT points at
    (Grafana LGTM locally; GCP AMP/Cloud Trace or AWS AMP/X-Ray in cloud,
    selected by the collector's exporter config, not by app code). This is
    the vendor-neutral seam mandated by the observability decision.

    STRICT NO-OP unless OTEL_EXPORTER_OTLP_ENDPOINT is set, so tests, unit
    runs, and the default local stack are entirely unaffected. Distinct
    from LangSmith (agent-graph tracing); this covers the HTTP/API surface.

Source: langchain-upgrade.md §6; observability decision O1
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


def configure_otel(app, service_name: str) -> bool:
    """Instrument the FastAPI app + outbound httpx with OTLP tracing.

    Args:
        app: The FastAPI application instance to instrument.
        service_name: Logical service name recorded on spans.

    Returns:
        True if tracing was enabled; False when it stayed a no-op (no
        OTEL_EXPORTER_OTLP_ENDPOINT set, or the SDK is unavailable).
    """
    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        logger.debug("OTel disabled (no OTEL_EXPORTER_OTLP_ENDPOINT)")
        return False

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
        from opentelemetry.sdk.resources import SERVICE_NAME, Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except ImportError:  # pragma: no cover - optional at runtime
        logger.warning("OpenTelemetry SDK not installed; API tracing stays off")
        return False

    resource = Resource.create({SERVICE_NAME: service_name})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()
    logger.info("OTel API tracing enabled -> %s (service=%s)", endpoint, service_name)
    return True
