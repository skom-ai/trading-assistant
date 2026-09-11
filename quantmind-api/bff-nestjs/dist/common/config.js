"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
function loadConfig() {
    return {
        port: Number(process.env.BFF_PORT ?? 8080),
        agentBaseUrl: process.env.AGENT_BASE_URL ?? 'http://agent:8000',
        internalApiToken: process.env.INTERNAL_API_TOKEN ?? 'dev-internal-token',
        corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        rateLimit: Number(process.env.RATE_LIMIT ?? 60),
        rateWindowSec: Number(process.env.RATE_WINDOW_SEC ?? 60),
        agentTimeoutMs: Number(process.env.AGENT_TIMEOUT_MS ?? 20000),
    };
}
//# sourceMappingURL=config.js.map