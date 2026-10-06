"""Persistence layer package (append-only audit + evidence citation).

File: app/persistence/__init__.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    Houses the agent's Postgres write path for the FR5 governance tables
    (audit_log + evidence_citation). Append-only (INSERT only), parameterized
    SQL only, failure-isolated from the user-facing request.
Work-item: W3.1
Source: valtide-db/postgres/migrations/V005__evidence_and_audit.sql
"""
