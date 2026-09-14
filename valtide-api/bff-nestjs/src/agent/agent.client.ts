/**
 * File: src/agent/agent.client.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   The single HTTP client from the BFF to the internal FastAPI agent
 *   service — the concrete realization of Principle P1 (all AI calls are
 *   mediated here). Propagates the correlation id and the internal auth
 *   token, applies a timeout, and passes the agent's typed error codes
 *   through unchanged into HttpExceptions the taxonomy filter serializes.
 * Source: specs/arch/SDD.md §2.2, §2.3
 */
import { HttpException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { AppConfig, loadConfig } from '../common/config';

/** Thin, typed client for the internal agent service. */
@Injectable()
export class AgentClient {
  private readonly logger = new Logger(AgentClient.name);
  private readonly http: AxiosInstance;
  private readonly config: AppConfig;

  /** Construct the client with a preconfigured axios instance. */
  constructor() {
    this.config = loadConfig();
    this.http = axios.create({
      baseURL: this.config.agentBaseUrl,
      timeout: this.config.agentTimeoutMs,
      headers: { 'X-Internal-Token': this.config.internalApiToken },
    });
  }

  /**
   * POST a JSON body to an internal agent endpoint.
   * @param path Endpoint path (e.g. '/internal/v1/scan').
   * @param body Request payload.
   * @param correlationId The request's correlation id to propagate.
   * @returns The parsed JSON response body.
   * @throws HttpException carrying the agent's taxonomy code on failure.
   */
  async post<T>(path: string, body: unknown, correlationId: string): Promise<T> {
    try {
      const res = await this.http.post<T>(path, body, {
        headers: { 'X-Correlation-Id': correlationId },
      });
      return res.data;
    } catch (err) {
      throw this.translate(err as AxiosError, correlationId);
    }
  }

  /**
   * Translate an axios error into a taxonomy-carrying HttpException.
   * @param err The axios error.
   * @param correlationId The correlation id for logging.
   * @returns An HttpException with the propagated code/message.
   */
  private translate(err: AxiosError, correlationId: string): HttpException {
    const data = err.response?.data as
      | { code?: string; message?: string }
      | undefined;
    const status = err.response?.status ?? 503;
    const code = data?.code ?? 'SOURCE_UNAVAILABLE';
    const message = data?.message ?? 'The analysis service is unavailable.';
    this.logger.error(`agent call failed code=${code} cid=${correlationId}`);
    return new HttpException({ code, message }, status);
  }
}
