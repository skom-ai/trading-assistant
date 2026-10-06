/**
 * File: src/api/client.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W1.1 — Port typed BFF client from valtide-ui into valtide-web-ui2.
 * Source: ported from valtide-ui/src/api/client.ts (2026-09-07). The two UIs
 *   deliberately share the same transport contract so neither drifts from the
 *   single public BFF (invariant P1 — the UI never calls the agent/LLM directly).
 * Description:
 *   Typed client the UI uses to call the Valtide BFF for the three live
 *   features: FR1 news check, FR2 scan, FR3+FR4 strategy. Responsibility is
 *   transport + typing ONLY — no React, no state, no page concerns. Loading
 *   and error state live in useAsync.ts; type contracts live in types.ts.
 *   The base URL comes from VITE_BFF_BASE_URL (falls back to localhost:8080).
 */
import type {
  ApiError,
  GovernanceResponse,
  NewsResponse,
  ScanResponse,
  StrategyResponse,
} from './types';

export type {
  ApiError,
  AuditLedgerRecord,
  GovernanceResponse,
  NewsResponse,
  ScanResponse,
  ScanRow,
  StrategyResponse,
} from './types';

/** Resolved BFF base URL for all API calls. */
const BASE_URL: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_BFF_BASE_URL ??
  'http://localhost:8080';

/**
 * POST JSON to a BFF endpoint and parse the typed response.
 * @param path Endpoint path under the BFF base URL.
 * @param body Request payload.
 * @returns The parsed response body.
 * @throws ApiError when the BFF returns a non-2xx taxonomy envelope.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
  // Logging aids debugging the UI<->BFF boundary without leaking payloads.
  console.debug(`[valtideApi] POST ${path}`);
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.warn(`[valtideApi] POST ${path} failed (${res.status})`);
    throw data as ApiError;
  }
  return data as T;
}

/**
 * GET a BFF endpoint and parse the typed response. Optional query params are
 * appended only when non-empty so the request URL stays clean.
 * @param path Endpoint path under the BFF base URL.
 * @param query Optional query-string params (empty/undefined values skipped).
 * @returns The parsed response body.
 * @throws ApiError when the BFF returns a non-2xx taxonomy envelope.
 */
async function get<T>(
  path: string,
  query?: Record<string, string | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v) qs.set(k, v);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  // Logging aids debugging the UI<->BFF boundary without leaking payloads.
  console.debug(`[valtideApi] GET ${path}${suffix}`);
  const res = await fetch(`${BASE_URL}${path}${suffix}`, { method: 'GET' });
  const data = await res.json();
  if (!res.ok) {
    console.warn(`[valtideApi] GET ${path} failed (${res.status})`);
    throw data as ApiError;
  }
  return data as T;
}

/** Valtide BFF API surface used by the UI screens. */
export const valtideApi = {
  /**
   * FR2 — run the deterministic scan.
   * @param universe Optional explicit universe override.
   */
  scan: (universe?: string[]): Promise<ScanResponse> =>
    post<ScanResponse>('/api/v1/scan', { universe: universe ?? null }),

  /**
   * FR1 — news-driven opportunity verdict.
   * @param symbol Ticker symbol.
   * @param simulateEmpty Force the empty-evidence path (demo).
   */
  newsCheck: (symbol: string, simulateEmpty = false): Promise<NewsResponse> =>
    post<NewsResponse>('/api/v1/news-check', { symbol, simulateEmpty }),

  /**
   * FR3+FR4 — strategy generation with historical analogs.
   * @param symbol Ticker symbol.
   * @param newsLabel Optional originating FR1 label.
   */
  strategy: (symbol: string, newsLabel?: string): Promise<StrategyResponse> =>
    post<StrategyResponse>('/api/v1/strategy', { symbol, newsLabel }),

  /**
   * FR5 — read the governance audit ledger + canonical SEC-17a-4 bundle.
   * @param symbol Optional ticker filter (allowlisted by the BFF).
   * @param correlationId Optional correlation UUID filter.
   */
  governance: (
    symbol?: string,
    correlationId?: string,
  ): Promise<GovernanceResponse> =>
    get<GovernanceResponse>('/api/v1/governance', {
      symbol,
      correlationId,
    }),
};
