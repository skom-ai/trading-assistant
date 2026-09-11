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
exports.StrategyDto = exports.ScanDto = exports.NewsCheckDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const TICKER_REGEX = /^[A-Z.\-]{1,10}$/;
class NewsCheckDto {
    symbol;
    simulateEmpty;
}
exports.NewsCheckDto = NewsCheckDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NVDA', description: 'Ticker symbol (allowlisted).' }),
    (0, class_validator_1.Matches)(TICKER_REGEX, { message: 'symbol must match ^[A-Z.\\-]{1,10}$' }),
    __metadata("design:type", String)
], NewsCheckDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Force empty headline set (edge-case demo).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NewsCheckDto.prototype, "simulateEmpty", void 0);
class ScanDto {
    universe;
}
exports.ScanDto = ScanDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: 'Explicit universe override.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ScanDto.prototype, "universe", void 0);
class StrategyDto {
    symbol;
    userFraming;
    newsLabel;
}
exports.StrategyDto = StrategyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'NVDA', description: 'Ticker symbol (allowlisted).' }),
    (0, class_validator_1.Matches)(TICKER_REGEX, { message: 'symbol must match ^[A-Z.\\-]{1,10}$' }),
    __metadata("design:type", String)
], StrategyDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free-text framing (neutralized server-side).' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], StrategyDto.prototype, "userFraming", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Originating FR1 news label, if any.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StrategyDto.prototype, "newsLabel", void 0);
//# sourceMappingURL=dtos.js.map