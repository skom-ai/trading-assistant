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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturesModule = exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_module_1 = require("../agent/agent.module");
const news_controller_1 = require("./news.controller");
const scanner_controller_1 = require("./scanner.controller");
const strategy_controller_1 = require("./strategy.controller");
let HealthController = class HealthController {
    health() {
        return { status: 'ok', service: 'quantmind-bff' };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], HealthController.prototype, "health", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Ops'),
    (0, common_1.Controller)('api/health')
], HealthController);
let FeaturesModule = class FeaturesModule {
};
exports.FeaturesModule = FeaturesModule;
exports.FeaturesModule = FeaturesModule = __decorate([
    (0, common_1.Module)({
        imports: [agent_module_1.AgentModule],
        controllers: [
            HealthController,
            news_controller_1.NewsController,
            scanner_controller_1.ScannerController,
            strategy_controller_1.StrategyController,
        ],
    })
], FeaturesModule);
//# sourceMappingURL=features.module.js.map