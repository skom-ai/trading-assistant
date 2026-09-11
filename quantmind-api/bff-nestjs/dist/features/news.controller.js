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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_client_1 = require("../agent/agent.client");
const dtos_1 = require("./dtos");
let NewsController = class NewsController {
    agent;
    constructor(agent) {
        this.agent = agent;
    }
    async check(body, req) {
        return this.agent.post('/internal/v1/news-check', { symbol: body.symbol, simulate_empty: body.simulateEmpty ?? false }, req.correlationId);
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'FR1 news-driven opportunity verdict' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dtos_1.NewsCheckDto, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "check", null);
exports.NewsController = NewsController = __decorate([
    (0, swagger_1.ApiTags)('FR1 News Check'),
    (0, common_1.Controller)('api/v1/news-check'),
    __metadata("design:paramtypes", [agent_client_1.AgentClient])
], NewsController);
//# sourceMappingURL=news.controller.js.map