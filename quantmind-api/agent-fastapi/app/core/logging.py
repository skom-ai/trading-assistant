"""Structured logging with correlation-id propagation.

File: app/core/logging.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Configures process-wide JSON logging for production debuggability.
    A ContextVar carries the current request's correlation_id so every
    log line emitted during a request is automatically tagged, without
    manual threading (SDD §5, STOCK-506).

Source: specs/arch/SDD.md
"""
from __future__ import annotations

import logging
from contextvars import ContextVar

from pythonjsonlogger import jsonlogger

# Per-request correlation id; defaults to "-" outside a request scope.
correlation_id_ctx: ContextVar[str] = ContextVar("correlation_id", default="-")


class _CorrelationFilter(logging.Filter):
    """Injects the current correlation_id into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        """Attach correlation_id to the record.

        Args:
            record: The log record being emitted.

        Returns:
            Always True (the record is never dropped).
        """
        record.correlation_id = correlation_id_ctx.get()
        return True


def configure_logging(level: str, service_name: str) -> None:
    """Install a JSON log formatter on the root logger.

    Args:
        level: Root log level name (e.g. "INFO").
        service_name: Service label included in every line.
    """
    handler = logging.StreamHandler()
    fmt = "%(asctime)s %(levelname)s %(name)s %(correlation_id)s %(message)s"
    handler.setFormatter(jsonlogger.JsonFormatter(fmt, rename_fields={"asctime": "ts"}))
    handler.addFilter(_CorrelationFilter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())
    logging.getLogger(service_name).info("logging configured", extra={"service": service_name})


def set_correlation_id(correlation_id: str) -> None:
    """Bind a correlation id to the current context.

    Args:
        correlation_id: The id minted at the NestJS edge for this request.
    """
    correlation_id_ctx.set(correlation_id)


def get_correlation_id() -> str:
    """Return the correlation id bound to the current context.

    Returns:
        The active correlation id, or "-" if none is bound.
    """
    return correlation_id_ctx.get()
