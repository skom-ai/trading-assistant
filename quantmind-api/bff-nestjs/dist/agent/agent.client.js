"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AgentClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentClient = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../common/config");
let AgentClient = AgentClient_1 = class AgentClient {
    logger = new common_1.Logger(AgentClient_1.name);
    http;
    config;
    constructor() {
        this.config = (0, config_1.loadConfig)();
        this.http = axios_1.default.create({
            baseURL: this.config.agentBaseUrl,
            timeout: this.config.agentTimeoutMs,
            headers: { 'X-Internal-Token': this.config.internalApiToken },
        });
    }
    async post(path, body, correlationId) {
        try {
            const res = await this.http.post(path, body, {
                headers: { 'X-Correlation-Id': correlationId },
            });
            return res.data;
        }
        catch (err) {
            throw this.translate(err, correlationId);
        }
    }
    translate(err, correlationId) {
        const data = err.response?.data;
        const status = err.response?.status ?? 503;
        const code = data?.code ?? 'SOURCE_UNAVAILABLE';
        const message = data?.message ?? 'The analysis service is unavailable.';
        this.logger.error(`agent call failed code=${code} cid=${correlationId}`);
        return new common_1.HttpException({ code, message }, status);
    }
};
exports.AgentClient = AgentClient;
exports.AgentClient = AgentClient = AgentClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AgentClient);
//# sourceMappingURL=agent.client.js.map