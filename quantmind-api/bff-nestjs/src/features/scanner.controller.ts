/**
 * File: src/features/scanner.controller.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   BFF-layer controller for FR2. Mediates the deterministic scan request
 *   to the internal agent service and returns the ranked top-10 with raw
 *   factors to the UI. No LLM is involved on this path.
 * Source: specs/arch/DDD.md §2, SDD §2
 */
import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CorrelatedRequest } from '../common/correlation.middleware';
import { AgentClient } from '../agent/agent.client';
import { ScanDto } from './dtos';

/** FR2 Stock Scanner controller. */
@ApiTags('FR2 Scanner')
@Controller('api/v1/scan')
export class ScannerController {
  /**
   * Inject the mediating agent client.
   * @param agent The single AI-mediation client (P1).
   */
  constructor(private readonly agent: AgentClient) {}

  /**
   * Run the deterministic top-10 scan.
   * @param body Validated FR2 request (optional universe).
   * @param req Correlated request carrying the correlation id.
   * @returns The ranked results payload.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FR2 deterministic top-10 scan (zero-LLM)' })
  async scan(
    @Body() body: ScanDto,
    @Req() req: CorrelatedRequest,
  ): Promise<unknown> {
    return this.agent.post(
      '/internal/v1/scan',
      { universe: body.universe ?? null },
      req.correlationId,
    );
  }
}
