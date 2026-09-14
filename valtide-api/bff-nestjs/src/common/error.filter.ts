/**
 * File: src/common/error.filter.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Global exception filter that sanitizes every outbound error into the
 *   platform taxonomy envelope (code, message, correlationId) with NO
 *   stack traces or internal identifiers. Error codes produced by the
 *   agent service are propagated UNCHANGED (no re-mapping per hop).
 * Source: specs/arch/SDD.md §5 (STOCK-608)
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Closed set of taxonomy codes shared across the platform. */
export const ERROR_CODES = [
  'NO_DATA_FOUND',
  'SOURCE_UNAVAILABLE',
  'UNSUPPORTED_TICKER',
  'INSUFFICIENT_EVIDENCE',
  'ANALYSIS_UNAVAILABLE',
  'AGENT_OUTPUT_INVALID',
  'UNSOURCED_CLAIM',
  'VALIDATION_ERROR',
] as const;

/** Catch-all filter serializing errors into the sanitized envelope. */
@Catch()
export class TaxonomyExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TaxonomyExceptionFilter.name);

  /**
   * Serialize any thrown error into the standard envelope.
   * @param exception The thrown error (HttpException or unknown).
   * @param host The arguments host providing request/response.
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { correlationId?: string }>();
    const correlationId = req.correlationId ?? '-';

    let status = 500;
    let code = 'ANALYSIS_UNAVAILABLE';
    let message = 'An unexpected error occurred.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown>;
      code = (body?.code as string) ?? this.codeForStatus(status);
      message = (body?.message as string) ?? exception.message;
    }

    this.logger.warn(`error code=${code} status=${status} cid=${correlationId}`);
    res.status(status).json({ code, message, correlationId, details: {} });
  }

  /**
   * Map an HTTP status to a default taxonomy code.
   * @param status HTTP status code.
   * @returns A taxonomy code string.
   */
  private codeForStatus(status: number): string {
    if (status === 400) return 'VALIDATION_ERROR';
    if (status === 422) return 'UNSUPPORTED_TICKER';
    if (status === 404) return 'NO_DATA_FOUND';
    if (status === 503) return 'SOURCE_UNAVAILABLE';
    return 'ANALYSIS_UNAVAILABLE';
  }
}
