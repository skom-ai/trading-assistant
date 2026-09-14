/**
 * File: src/features/features.module.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Aggregates the FR1/FR2/FR3-FR4 controllers and the health controller,
 *   importing the shared AgentModule so all AI calls route through the one
 *   mediating client (P1).
 * Source: specs/arch/SDD.md §2
 */
import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentModule } from '../agent/agent.module';
import { NewsController } from './news.controller';
import { ScannerController } from './scanner.controller';
import { StrategyController } from './strategy.controller';

/** Liveness controller for the BFF. */
@ApiTags('Ops')
@Controller('api/health')
export class HealthController {
  /**
   * Report BFF liveness.
   * @returns A static ok payload.
   */
  @Get()
  health(): { status: string; service: string } {
    return { status: 'ok', service: 'valtide-bff' };
  }
}

/** Feature module wiring controllers to the mediating agent client. */
@Module({
  imports: [AgentModule],
  controllers: [
    HealthController,
    NewsController,
    ScannerController,
    StrategyController,
  ],
})
export class FeaturesModule {}
