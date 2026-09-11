"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CorrelationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorrelationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let CorrelationMiddleware = CorrelationMiddleware_1 = class CorrelationMiddleware {
    logger = new common_1.Logger(CorrelationMiddleware_1.name);
    use(req, res, next) {
        const header = req.header('X-Correlation-Id');
        const correlationId = header && header.length > 0 ? header : (0, uuid_1.v4)();
        req.correlationId = correlationId;
        res.setHeader('X-Correlation-Id', correlationId);
        this.logger.debug(`${req.method} ${req.path} cid=${correlationId}`);
        next();
    }
};
exports.CorrelationMiddleware = CorrelationMiddleware;
exports.CorrelationMiddleware = CorrelationMiddleware = CorrelationMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], CorrelationMiddleware);
//# sourceMappingURL=correlation.middleware.js.map