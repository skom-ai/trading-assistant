/**
 * File: src/features/news.controller.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   BFF-layer controller for FR1. Validates the request, resolves the
 *   correlation id, and mediates the call to the internal agent service
 *   (P1). Returns the agent's verdict payload verbatim to the UI.
 * Source: specs/arch/DDD.md §1, SDD §2
 */
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CorrelatedRequest } from '../common/correlation.middleware';
import { AgentClient } from '../agent/agent.client';
import { NewsCheckDto } from './dtos';

/** FR1 News-Driven Opportunity Check controller. */
@ApiTags('FR1 News Check')
@Controller('api/v1/news-check')
export class NewsController {
  /**
   * Inject the mediating agent client.
   * @param agent The single AI-mediation client (P1).
   */
  constructor(private readonly agent: AgentClient) {}

  /**
   * Classify a ticker's news-driven move.
   * @param body Validated FR1 request.
   * @param req Correlated request carrying the correlation id.
   * @returns The verdict payload (label, rationale, citations, disclaimer).
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FR1 news-driven opportunity verdict' })
  async check(
    @Body() body: NewsCheckDto,
    @Req() req: CorrelatedRequest,
  ): Promise<unknown> {
    return this.agent.post(
      '/internal/v1/news-check',
      { symbol: body.symbol, simulate_empty: body.simulateEmpty ?? false },
      req.correlationId,
    );
  }
}
