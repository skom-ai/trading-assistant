"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TaxonomyExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxonomyExceptionFilter = exports.ERROR_CODES = void 0;
const common_1 = require("@nestjs/common");
exports.ERROR_CODES = [
    'NO_DATA_FOUND',
    'SOURCE_UNAVAILABLE',
    'UNSUPPORTED_TICKER',
    'INSUFFICIENT_EVIDENCE',
    'ANALYSIS_UNAVAILABLE',
    'AGENT_OUTPUT_INVALID',
    'UNSOURCED_CLAIM',
    'VALIDATION_ERROR',
];
let TaxonomyExceptionFilter = TaxonomyExceptionFilter_1 = class TaxonomyExceptionFilter {
    logger = new common_1.Logger(TaxonomyExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const correlationId = req.correlationId ?? '-';
        let status = 500;
        let code = 'ANALYSIS_UNAVAILABLE';
        let message = 'An unexpected error occurred.';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            code = body?.code ?? this.codeForStatus(status);
            message = body?.message ?? exception.message;
        }
        this.logger.warn(`error code=${code} status=${status} cid=${correlationId}`);
        res.status(status).json({ code, message, correlationId, details: {} });
    }
    codeForStatus(status) {
        if (status === 400)
            return 'VALIDATION_ERROR';
        if (status === 422)
            return 'UNSUPPORTED_TICKER';
        if (status === 404)
            return 'NO_DATA_FOUND';
        if (status === 503)
            return 'SOURCE_UNAVAILABLE';
        return 'ANALYSIS_UNAVAILABLE';
    }
};
exports.TaxonomyExceptionFilter = TaxonomyExceptionFilter;
exports.TaxonomyExceptionFilter = TaxonomyExceptionFilter = TaxonomyExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], TaxonomyExceptionFilter);
//# sourceMappingURL=error.filter.js.map