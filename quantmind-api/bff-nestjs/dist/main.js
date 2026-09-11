"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const config_1 = require("./common/config");
const error_filter_1 = require("./common/error.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const config = (0, config_1.loadConfig)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: false });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({ origin: config.corsOrigins, credentials: true });
    app.useGlobalFilters(new error_filter_1.TaxonomyExceptionFilter());
    const swagger = new swagger_1.DocumentBuilder()
        .setTitle('QuantMind BFF API')
        .setDescription('Client-facing API — the sole AI-call mediator (P1).')
        .setVersion('1.0.0')
        .build();
    swagger_1.SwaggerModule.setup('api/docs', app, swagger_1.SwaggerModule.createDocument(app, swagger));
    await app.listen(config.port, '0.0.0.0');
    logger.log(`QuantMind BFF listening on :${config.port} (docs at /api/docs)`);
}
void bootstrap();
//# sourceMappingURL=main.js.map