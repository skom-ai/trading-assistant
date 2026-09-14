/**
 * File: src/common/common.spec.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Unit tests for the cross-cutting BFF pieces: the AgentClient error
 *   translation (agent taxonomy code passthrough), the TaxonomyExceptionFilter
 *   envelope, and the CorrelationMiddleware id mint/propagate behavior.
 * Source: specs/arch/SDD.md §2.1-2.3, §5
 */
import { HttpException } from '@nestjs/common';
import { AgentClient } from '../agent/agent.client';
import { TaxonomyExceptionFilter } from './error.filter';
import { CorrelationMiddleware } from './correlation.middleware';

describe('AgentClient error translation', () => {
  it('passes an agent taxonomy code through unchanged', () => {
    const client = new AgentClient();
    // Access the private translate via a crafted axios-like error.
    const err = {
      response: { status: 422, data: { code: 'UNSUPPORTED_TICKER', message: 'nope' } },
    } as never;
    const ex = (client as unknown as {
      translate: (e: unknown, c: string) => HttpException;
    }).translate(err, 'cid-1');
    const body = ex.getResponse() as { code: string };
    expect(ex.getStatus()).toBe(422);
    expect(body.code).toBe('UNSUPPORTED_TICKER');
  });

  it('defaults to SOURCE_UNAVAILABLE when the agent is unreachable', () => {
    const client = new AgentClient();
    const ex = (client as unknown as {
      translate: (e: unknown, c: string) => HttpException;
    }).translate({} as never, 'cid-2');
    expect((ex.getResponse() as { code: string }).code).toBe('SOURCE_UNAVAILABLE');
    expect(ex.getStatus()).toBe(503);
  });
});

describe('TaxonomyExceptionFilter', () => {
  it('serializes an HttpException into the sanitized envelope', () => {
    const filter = new TaxonomyExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ correlationId: 'cid-9' }),
      }),
    } as never;
    filter.catch(new HttpException({ code: 'NO_DATA_FOUND', message: 'x' }, 404), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NO_DATA_FOUND', correlationId: 'cid-9' }),
    );
  });

  it('maps an unknown error to ANALYSIS_UNAVAILABLE/500', () => {
    const filter = new TaxonomyExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({}),
      }),
    } as never;
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ANALYSIS_UNAVAILABLE', correlationId: '-' }),
    );
  });

  it.each([
    [400, 'VALIDATION_ERROR'],
    [422, 'UNSUPPORTED_TICKER'],
    [404, 'NO_DATA_FOUND'],
    [503, 'SOURCE_UNAVAILABLE'],
    [418, 'ANALYSIS_UNAVAILABLE'],
  ])('derives code for status %s when body carries none', (statusCode, expected) => {
    const filter = new TaxonomyExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ correlationId: 'c' }),
      }),
    } as never;
    filter.catch(new HttpException('msg', statusCode), host);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: expected }));
  });
});

describe('CorrelationMiddleware', () => {
  it('mints a correlation id when the header is absent', () => {
    const mw = new CorrelationMiddleware();
    const setHeader = jest.fn();
    const req = { header: () => undefined, method: 'GET', path: '/x' } as never;
    const res = { setHeader } as never;
    const next = jest.fn();
    mw.use(req, res, next);
    expect((req as { correlationId: string }).correlationId).toHaveLength(36);
    expect(next).toHaveBeenCalled();
  });

  it('propagates an inbound correlation id', () => {
    const mw = new CorrelationMiddleware();
    const req = { header: () => 'given-cid', method: 'GET', path: '/x' } as never;
    const res = { setHeader: jest.fn() } as never;
    mw.use(req, res, jest.fn());
    expect((req as { correlationId: string }).correlationId).toBe('given-cid');
  });
});
