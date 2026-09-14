/**
 * File: src/api/client.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Typed client the UI uses to call the Valtide BFF (Principle P1 — the
 *   UI never calls the agent/LLM directly). Replaces the static mockData
 *   for the live screens: FR1 news check, FR2 scan, FR3+FR4 strategy. The
 *   base URL comes from VITE_BFF_BASE_URL (falls back to localhost:8080).
 */

/** Resolved BFF base URL for all API calls. */
const BASE_URL: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_BFF_BASE_URL ??
  'http://localhost:8080';

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
 * POST JSON to a BFF endpoint and parse the typed response.
 * @param path Endpoint path under the BFF base URL.
 * @param body Request payload.
 * @returns The parsed response body.
 * @throws ApiError when the BFF returns a non-2xx taxonomy envelope.
 */
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
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
};
