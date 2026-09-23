"""LangSmith observability for the agent graphs (LangChain migration).

File: app/core/observability.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Configures LangSmith tracing for the FR1/FR3 LangGraph flows. LangChain
    and LangGraph auto-emit traces to LangSmith when the standard LANGSMITH_*
    environment variables are present, so this module's sole job is to
    translate the app's typed VT_LANGSMITH_* settings into those env vars
    exactly once at startup.

    It is a strict NO-OP when tracing is disabled (the default) or no API
    key is configured: no env var is set, nothing is imported, and the
    native path is entirely unaffected. This keeps observability a
    cross-cutting concern that is opt-in and cannot alter request behavior.

    PII: the domain model carries no PII by design, so traces contain only
    ticker symbols, factor numbers, verdicts, and disclaimers.

Source: langchain-upgrade.md §4/§7; specs/arch/SDD.md §5
"""
from __future__ import annotations

import logging
import os

from app.core.config import Settings

logger = logging.getLogger(__name__)


def configure_observability(settings: Settings) -> bool:
    """Enable LangSmith tracing from settings, if requested.

    Sets the standard LANGSMITH_* / LANGCHAIN_* environment variables that
    LangChain and LangGraph read to auto-export traces. Called once at app
    startup. Does nothing unless tracing is enabled AND a key is present.

    Args:
        settings: The process settings (VT_LANGSMITH_* fields).

    Returns:
        True if tracing was enabled; False when it stayed a no-op.
    """
    if not settings.langsmith_tracing:
        logger.debug("langsmith tracing disabled (VT_LANGSMITH_TRACING=false)")
        return False
    if not settings.langsmith_api_key:
        logger.warning(
            "VT_LANGSMITH_TRACING=true but no VT_LANGSMITH_API_KEY set; "
            "tracing stays OFF to avoid a broken exporter.")
        return False

    # LangChain reads both the legacy LANGCHAIN_* and the current LANGSMITH_*
    # names; set both so the version in use picks it up.
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project
    os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project
    os.environ["LANGSMITH_ENDPOINT"] = settings.langsmith_endpoint
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langsmith_endpoint
    logger.info("LangSmith tracing enabled (project=%s)", settings.langsmith_project)
    return True
