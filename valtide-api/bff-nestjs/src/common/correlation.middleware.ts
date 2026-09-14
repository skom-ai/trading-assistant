/**
 * File: src/common/correlation.middleware.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Global middleware that mints (or propagates) the X-Correlation-Id for
 *   every inbound request and echoes it on the response. The BFF is the
 *   ORIGIN of the correlation id (STOCK-506); it forwards the same id to
 *   the agent service so a single id spans every hop.
 * Source: specs/arch/SDD.md §2.1, specs/arch/diagrams/04-component-nestjs-api.mmd
 */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/** Request augmented with the resolved correlation id. */
export interface CorrelatedRequest extends Request {
  correlationId: string;
}

/** Middleware attaching a correlation id to each request/response. */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationMiddleware.name);

  /**
   * Attach or propagate the correlation id.
   * @param req Incoming request (augmented in place).
   * @param res Outgoing response (header set).
   * @param next Express continuation.
   */
  use(req: Request, res: Response, next: NextFunction): void {
    const header = req.header('X-Correlation-Id');
    const correlationId = header && header.length > 0 ? header : uuidv4();
    (req as CorrelatedRequest).correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    this.logger.debug(`${req.method} ${req.path} cid=${correlationId}`);
    next();
  }
}
