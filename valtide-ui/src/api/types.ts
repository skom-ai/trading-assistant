/**
 * File: src/api/types.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W1.1 — Port typed BFF client from valtide-ui into valtide-web-ui2.
 * Source: ported verbatim (shapes only) from
 *   valtide-ui/src/api/client.ts (2026-09-07) to keep the two UIs
 *   contract-compatible against the single BFF (invariant P1).
 * Description:
 *   Request/response type contracts for the Valtide BFF API surface.
 *   Separated from the transport client (client.ts) so page components and
 *   the useAsync hook can import types without pulling in fetch logic
 *   (Single Responsibility / Interface Segregation).
 */

/** Sanitized error envelope returned by the BFF taxonomy filter. */
export interface ApiError {
  code: string;
  message: string;
  correlationId: string;
}

/** A single ranked scanner row (mirrors the agent response). */
export interface ScanRow {
  symbol: string;
  rank: number;
  composite_score: number;
  last_price: number | null;
  factors: Record<string, number | null>;
  /**
   * Data-source stamp from the agent, e.g. "yahoo-live:NVDA@<iso>" for real
   * Yahoo end-of-day data or "synthetic-yfinance-v1:NVDA" for the per-symbol
   * synthetic fallback. Drives the honest LIVE / LAST CLOSE / REFERENCE badge
   * (the Yahoo chart feed is daily bars, so real data is last-close, not
   * intraday real-time). Optional: older BFF builds may omit it.
   */
  provenance?: string;
}

/** FR2 scan response. */
export interface ScanResponse {
  weight_version: number;
  universe_size: number;
  rows: ScanRow[];
}

/** FR1 news verdict response. */
export interface NewsResponse {
  symbol: string;
  label: string;
  rationale: string;
  citations: Array<Record<string, string>>;
  disclaimer: string;
}

/** FR3+FR4 strategy response. */
export interface StrategyResponse {
  symbol: string;
  strategy: Record<string, unknown>;
  analogs: Array<Record<string, unknown>>;
  disclaimer: string;
  analog_disclaimer: string;
}

/**
 * FR5 — one immutable audit-ledger row from GET /api/v1/governance.
 * camelCase fields mirror the agent's AuditLedgerRecord contract verbatim
 * (W3.1/W3.2). merkleHash is a REAL deterministic SHA-256 anchor; status,
 * timestamp and latencyMs are projections of the persisted row — never
 * fabricated client-side (W3.3 removes the old random-hash theatre).
 */
export interface AuditLedgerRecord {
  traceId: string;
  event: string;
  symbol: string;
  pipeline: string;
  merkleHash: string;
  status: string;
  timestamp: string;
  initiatingEntity: string;
  latencyMs: number;
}

/** FR5 governance response: ledger records + canonical SEC-17a-4 bundle. */
export interface GovernanceResponse {
  /** The newest record's correlation UUID (single reconstructed trace), or ''. */
  correlationUuid: string;
  /** Immutable audit-ledger rows, newest first. */
  records: AuditLedgerRecord[];
  /** Canonical SEC-17a-4 bundle for the newest record ({} when none). */
  canonicalBundle: Record<string, unknown>;
}
