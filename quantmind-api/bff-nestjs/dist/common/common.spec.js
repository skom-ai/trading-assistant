"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const agent_client_1 = require("../agent/agent.client");
const error_filter_1 = require("./error.filter");
const correlation_middleware_1 = require("./correlation.middleware");
describe('AgentClient error translation', () => {
    it('passes an agent taxonomy code through unchanged', () => {
        const client = new agent_client_1.AgentClient();
        const err = {
            response: { status: 422, data: { code: 'UNSUPPORTED_TICKER', message: 'nope' } },
        };
        const ex = client.translate(err, 'cid-1');
        const body = ex.getResponse();
        expect(ex.getStatus()).toBe(422);
        expect(body.code).toBe('UNSUPPORTED_TICKER');
    });
    it('defaults to SOURCE_UNAVAILABLE when the agent is unreachable', () => {
        const client = new agent_client_1.AgentClient();
        const ex = client.translate({}, 'cid-2');
        expect(ex.getResponse().code).toBe('SOURCE_UNAVAILABLE');
        expect(ex.getStatus()).toBe(503);
    });
});
describe('TaxonomyExceptionFilter', () => {
    it('serializes an HttpException into the sanitized envelope', () => {
        const filter = new error_filter_1.TaxonomyExceptionFilter();
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const host = {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
                getRequest: () => ({ correlationId: 'cid-9' }),
            }),
        };
        filter.catch(new common_1.HttpException({ code: 'NO_DATA_FOUND', message: 'x' }, 404), host);
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NO_DATA_FOUND', correlationId: 'cid-9' }));
    });
    it('maps an unknown error to ANALYSIS_UNAVAILABLE/500', () => {
        const filter = new error_filter_1.TaxonomyExceptionFilter();
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const host = {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
                getRequest: () => ({}),
            }),
        };
        filter.catch(new Error('boom'), host);
        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ANALYSIS_UNAVAILABLE', correlationId: '-' }));
    });
    it.each([
        [400, 'VALIDATION_ERROR'],
        [422, 'UNSUPPORTED_TICKER'],
        [404, 'NO_DATA_FOUND'],
        [503, 'SOURCE_UNAVAILABLE'],
        [418, 'ANALYSIS_UNAVAILABLE'],
    ])('derives code for status %s when body carries none', (statusCode, expected) => {
        const filter = new error_filter_1.TaxonomyExceptionFilter();
        const json = jest.fn();
        const status = jest.fn().mockReturnValue({ json });
        const host = {
            switchToHttp: () => ({
                getResponse: () => ({ status }),
                getRequest: () => ({ correlationId: 'c' }),
            }),
        };
        filter.catch(new common_1.HttpException('msg', statusCode), host);
        expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: expected }));
    });
});
describe('CorrelationMiddleware', () => {
    it('mints a correlation id when the header is absent', () => {
        const mw = new correlation_middleware_1.CorrelationMiddleware();
        const setHeader = jest.fn();
        const req = { header: () => undefined, method: 'GET', path: '/x' };
        const res = { setHeader };
        const next = jest.fn();
        mw.use(req, res, next);
        expect(req.correlationId).toHaveLength(36);
        expect(next).toHaveBeenCalled();
    });
    it('propagates an inbound correlation id', () => {
        const mw = new correlation_middleware_1.CorrelationMiddleware();
        const req = { header: () => 'given-cid', method: 'GET', path: '/x' };
        const res = { setHeader: jest.fn() };
        mw.use(req, res, jest.fn());
        expect(req.correlationId).toBe('given-cid');
    });
});
//# sourceMappingURL=common.spec.js.map