/**
 * File: src/main.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   BFF bootstrap. Installs the global strict ValidationPipe (allowlist,
 *   forbid-unknown), strict CORS (no wildcard outside local dev), the
 *   sanitizing taxonomy exception filter, and Swagger UI at /api/docs.
 *   The BFF is the only publicly routable service (P1).
 * Source: specs/arch/SDD.md §2.1-2.3
 */
import 'reflect-metadata';
import { startOtel } from './otel';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { loadConfig } from './common/config';
import { TaxonomyExceptionFilter } from './common/error.filter';

// Start tracing before anything else so HTTP + axios are instrumented.
// No-op unless OTEL_EXPORTER_OTLP_ENDPOINT is set.
startOtel();

/**
 * Bootstrap and start the NestJS BFF.
 * @returns A promise that resolves once the server is listening.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: false });

  // Strict validation: strip unknown props, reject non-whitelisted, transform.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Strict CORS from configured origins only.
  app.enableCors({ origin: config.corsOrigins, credentials: true });

  // Sanitized error taxonomy on every outbound error.
  app.useGlobalFilters(new TaxonomyExceptionFilter());

  // Client-facing OpenAPI contract at /api/docs.
  const swagger = new DocumentBuilder()
    .setTitle('Valtide BFF API')
    .setDescription('Client-facing API — the sole AI-call mediator (P1).')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(config.port, '0.0.0.0');
  logger.log(`Valtide BFF listening on :${config.port} (docs at /api/docs)`);
}

void bootstrap();
