/**
 * File: src/features/dtos.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Client-facing request DTOs validated by the global ValidationPipe
 *   (class-validator) at the BFF boundary. The ticker allowlist regex is
 *   enforced here BEFORE any downstream call (STOCK-101-T2). Swagger
 *   decorators document the contract for /api/docs.
 * Source: specs/arch/SDD.md §2.1, specs/arch/DDD.md §1.1
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** Ticker allowlist: 1-10 uppercase letters, dot, or hyphen. */
const TICKER_REGEX = /^[A-Z.\-]{1,10}$/;

/** FR1 news-check request. */
export class NewsCheckDto {
  @ApiProperty({ example: 'NVDA', description: 'Ticker symbol (allowlisted).' })
  @Matches(TICKER_REGEX, { message: 'symbol must match ^[A-Z.\\-]{1,10}$' })
  symbol!: string;

  @ApiPropertyOptional({ description: 'Force empty headline set (edge-case demo).' })
  @IsOptional()
  @IsBoolean()
  simulateEmpty?: boolean;
}

/** FR2 scan request (universe optional; server default when omitted). */
export class ScanDto {
  @ApiPropertyOptional({ type: [String], description: 'Explicit universe override.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  universe?: string[];
}

/** FR3/FR4 strategy request. */
export class StrategyDto {
  @ApiProperty({ example: 'NVDA', description: 'Ticker symbol (allowlisted).' })
  @Matches(TICKER_REGEX, { message: 'symbol must match ^[A-Z.\\-]{1,10}$' })
  symbol!: string;

  @ApiPropertyOptional({ description: 'Free-text framing (neutralized server-side).' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  userFraming?: string;

  @ApiPropertyOptional({ description: 'Originating FR1 news label, if any.' })
  @IsOptional()
  @IsString()
  newsLabel?: string;
}
