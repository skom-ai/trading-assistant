/**
 * File: src/features/governance.controller.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Description:
 *   BFF-layer controller for FR5 governance (W3.2). Exposes the public
 *   GET /api/v1/governance endpoint and mediates it to the internal agent
 *   service (P1 — the UI never reaches the agent directly), forwarding the
 *   X-Internal-Token (set on the AgentClient) and the correlation id.
 *   Returns the agent's governance payload verbatim: the AuditLedgerRecord[]
 *   ledger plus the canonical SEC-17a-4 bundle, for the UI's Audit Ledger /
 *   Governance view to render. Read-only path; no LLM is involved.
 * Source: specs/arch/DDD.md §5, SDD §2; valtide-ui/src/types.ts
 *         (AuditLedgerRecord)
 */
import { Controller, Get, HttpCode, HttpStatus, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CorrelatedRequest } from '../common/correlation.middleware';
import { AgentClient } from '../agent/agent.client';

/** Ticker allowlist: 1-10 uppercase letters, dot, or hyphen. */
const TICKER_REGEX = /^[A-Z.\-]{1,10}$/;

/** FR5 governance query DTO (validated by the global ValidationPipe). */
export class GovernanceQueryDto {
  @ApiPropertyOptional({ example: 'NVDA', description: 'Ticker filter (allowlisted).' })
  @IsOptional()
  @Matches(TICKER_REGEX, { message: 'symbol must match ^[A-Z.\\-]{1,10}$' })
  symbol?: string;

  @ApiPropertyOptional({ description: 'Correlation UUID filter.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  correlationId?: string;
}

/** FR5 Governance Audit Ledger controller (public, read-only). */
@ApiTags('FR5 Governance')
@Controller('api/v1/governance')
export class GovernanceController {
  /**
   * Inject the mediating agent client.
   * @param agent The single AI-mediation client (P1).
   */
  constructor(private readonly agent: AgentClient) {}

  /**
   * Fetch the audit ledger + canonical bundle.
   * @param query Validated optional symbol / correlationId filters.
   * @param req Correlated request carrying the correlation id.
   * @returns The governance payload (records[] + canonical bundle).
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FR5 governance audit ledger + SEC-17a-4 bundle' })
  async ledger(
    @Query() query: GovernanceQueryDto,
    @Req() req: CorrelatedRequest,
  ): Promise<unknown> {
    return this.agent.get(
      '/internal/v1/governance',
      {
        symbol: query.symbol ?? null,
        correlation_id: query.correlationId ?? null,
      },
      req.correlationId,
    );
  }
}
