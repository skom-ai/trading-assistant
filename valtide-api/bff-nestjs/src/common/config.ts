/**
 * File: src/common/config.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Centralized, typed runtime configuration for the Valtide BFF, read
 *   from environment variables (12-factor). Covers the internal Agent
 *   Service base URL + auth token, CORS origins, and rate-limit settings.
 *   No secrets are hardcoded.
 * Source: specs/arch/SDD.md §2
 */

/** Immutable, typed application configuration. */
export interface AppConfig {
  /** TCP port the BFF listens on. */
  port: number;
  /** Base URL of the internal FastAPI agent service. */
  agentBaseUrl: string;
  /** Shared token presented to the agent service (S2S auth). */
  internalApiToken: string;
  /** Allowed CORS origins (comma-separated env, no wildcard in prod). */
  corsOrigins: string[];
  /** Max requests per window per client for the throttler. */
  rateLimit: number;
  /** Throttler window in seconds. */
  rateWindowSec: number;
  /** Upstream request timeout (ms) for calls to the agent service. */
  agentTimeoutMs: number;
}

/**
 * Build the AppConfig from process.env with safe local defaults.
 * @returns The resolved application configuration.
 */
export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.BFF_PORT ?? 8080),
    agentBaseUrl: process.env.AGENT_BASE_URL ?? 'http://agent:8000',
    internalApiToken: process.env.INTERNAL_API_TOKEN ?? 'dev-internal-token',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rateLimit: Number(process.env.RATE_LIMIT ?? 60),
    rateWindowSec: Number(process.env.RATE_WINDOW_SEC ?? 60),
    agentTimeoutMs: Number(process.env.AGENT_TIMEOUT_MS ?? 20000),
  };
}
