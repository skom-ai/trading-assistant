/**
 * File: src/agent/agent.module.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Shared module exporting the AgentClient so every feature module (news,
 *   scanner, strategy) mediates its AI calls through the one client — the
 *   structural enforcement of Principle P1.
 * Source: specs/arch/SDD.md §2
 */
import { Module } from '@nestjs/common';
import { AgentClient } from './agent.client';

/** Provides and exports the single AgentClient instance. */
@Module({
  providers: [AgentClient],
  exports: [AgentClient],
})
export class AgentModule {}
