/**
 * File: src/app.module.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Root module. Registers the Redis-less in-memory throttler guard
 *   (RateLimitModule equivalent for local MVP), applies the correlation
 *   middleware to every route, and imports the feature modules.
 * Source: specs/arch/SDD.md §2.1, diagrams/04-component-nestjs-api.mmd
 */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CorrelationMiddleware } from './common/correlation.middleware';
import { loadConfig } from './common/config';
import { FeaturesModule } from './features/features.module';

const config = loadConfig();

/** Application root module. */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: config.rateWindowSec * 1000, limit: config.rateLimit },
    ]),
    FeaturesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  /**
   * Apply the correlation middleware to all routes.
   * @param consumer The middleware consumer.
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
