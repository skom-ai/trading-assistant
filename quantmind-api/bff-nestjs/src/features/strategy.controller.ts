/**
 * File: src/features/strategy.controller.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   BFF-layer controller for FR3 strategy + FR4 analog co-execution.
 *   Mediates the request to the internal agent service and returns the
 *   combined strategy + analogs payload (with disclaimers) to the UI.
 * Source: specs/arch/DDD.md §3-4, SDD §2
 */
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CorrelatedRequest } from '../common/correlation.middleware';
import { AgentClient } from '../agent/agent.client';
import { StrategyDto } from './dtos';

/** FR3 Strategy + FR4 Analog controller. */
@ApiTags('FR3 Strategy + FR4 Analogs')
@Controller('api/v1/strategy')
export class StrategyController {
  /**
   * Inject the mediating agent client.
   * @param agent The single AI-mediation client (P1).
   */
  constructor(private readonly agent: AgentClient) {}

  /**
   * Generate a strategy and its historical analogs.
   * @param body Validated FR3/FR4 request.
   * @param req Correlated request carrying the correlation id.
   * @returns The combined strategy + analogs payload.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FR3 strategy + FR4 analog co-execution' })
  async generate(
    @Body() body: StrategyDto,
    @Req() req: CorrelatedRequest,
  ): Promise<unknown> {
    return this.agent.post(
      '/internal/v1/strategy',
      {
        symbol: body.symbol,
        user_framing: body.userFraming ?? null,
        news_label: body.newsLabel ?? null,
      },
      req.correlationId,
    );
  }
}
