/**
 * File: src/api/client.test.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W1.1 — Port typed BFF client from valtide-ui into valtide-web-ui2.
 * Source: ported from valtide-ui/src/api/client.test.ts (2026-09-07).
 * Description:
 *   Unit tests for the BFF API client and the useAsync hook. Mocks global
 *   fetch (mock/synthetic allowed in tests only) to verify the correct
 *   method/path/body for each call and that a non-2xx taxonomy envelope is
 *   thrown as an ApiError. Also covers the useAsync idle/loading/success/
 *   error transitions and client-error normalization.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { valtideApi, type ApiError } from './client';
import { useAsync } from './useAsync';

/** Build a mock fetch returning the given status + json body. */
function mockFetch(status: number, body: unknown): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('valtideApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('scan posts to /api/v1/scan with null universe by default', async () => {
    mockFetch(200, { rows: [], weight_version: 1, universe_size: 0 });
    await valtideApi.scan();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/scan'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ universe: null }),
      }),
    );
  });

  it('scan forwards an explicit universe override', async () => {
    mockFetch(200, { rows: [], weight_version: 1, universe_size: 1 });
    await valtideApi.scan(['NVDA']);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/scan'),
      expect.objectContaining({
        body: JSON.stringify({ universe: ['NVDA'] }),
      }),
    );
  });

  it('newsCheck posts symbol + simulateEmpty', async () => {
    mockFetch(200, { label: 'HYPE', citations: [], disclaimer: 'd' });
    const out = await valtideApi.newsCheck('NVDA', true);
    expect(out.label).toBe('HYPE');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/news-check'),
      expect.objectContaining({
        body: JSON.stringify({ symbol: 'NVDA', simulateEmpty: true }),
      }),
    );
  });

  it('strategy posts symbol + newsLabel', async () => {
    mockFetch(200, {
      strategy: { verdict: 'BUY' },
      analogs: [],
      disclaimer: 'd',
      analog_disclaimer: 'a',
    });
    const out = await valtideApi.strategy('NVDA', 'REAL_CATALYST');
    expect((out.strategy as { verdict: string }).verdict).toBe('BUY');
  });

  it('throws the taxonomy envelope on a non-2xx response', async () => {
    mockFetch(400, { code: 'VALIDATION_ERROR', message: 'bad', correlationId: 'c' });
    // Narrow cast on this tooling line: the installed vitest's toMatchObject
    // chainer takes no type argument (TS2558), so type the expected object.
    await expect(valtideApi.newsCheck('bad!')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    } satisfies Partial<ApiError>);
  });

  it('governance GETs /api/v1/governance with no query by default', async () => {
    mockFetch(200, { correlationUuid: '', records: [], canonicalBundle: {} });
    const out = await valtideApi.governance();
    expect(out.records).toEqual([]);
    const [url, init] = (global.fetch as unknown as import('vitest').Mock).mock.calls[0];
    expect(url).toContain('/api/v1/governance');
    expect(url).not.toContain('?'); // empty params are not appended
    expect(init).toMatchObject({ method: 'GET' });
  });

  it('governance appends symbol + correlationId query params when provided', async () => {
    mockFetch(200, { correlationUuid: 'cid', records: [], canonicalBundle: {} });
    await valtideApi.governance('NVDA', 'cid-123');
    const [url] = (global.fetch as unknown as import('vitest').Mock).mock.calls[0];
    expect(url).toContain('symbol=NVDA');
    expect(url).toContain('correlationId=cid-123');
  });

  it('governance throws the taxonomy envelope on a non-2xx response', async () => {
    mockFetch(500, { code: 'UPSTREAM_ERROR', message: 'down', correlationId: 'c' });
    await expect(valtideApi.governance()).rejects.toMatchObject({
      code: 'UPSTREAM_ERROR',
    } satisfies Partial<ApiError>);
  });
});

describe('useAsync', () => {
  afterEach(() => vi.restoreAllMocks());

  it('starts idle and transitions to success', async () => {
    const { result } = renderHook(() => useAsync(async (x: number) => x + 1));
    expect(result.current.state.status).toBe('idle');
    await act(async () => {
      await result.current.run(1);
    });
    expect(result.current.state).toMatchObject({ status: 'success', data: 2 });
    expect(result.current.isLoading).toBe(false);
  });

  it('captures an ApiError-shaped throw into error state', async () => {
    const err: ApiError = { code: 'VALIDATION_ERROR', message: 'bad', correlationId: 'c' };
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw err;
      }),
    );
    await act(async () => {
      const out = await result.current.run();
      expect(out).toBeNull();
    });
    expect(result.current.state).toMatchObject({ status: 'error', error: err });
  });

  it('normalizes a non-envelope throw into a CLIENT_ERROR', async () => {
    const { result } = renderHook(() =>
      useAsync(async () => {
        throw new Error('network down');
      }),
    );
    await act(async () => {
      await result.current.run();
    });
    expect(result.current.state).toMatchObject({
      status: 'error',
      error: { code: 'CLIENT_ERROR', message: 'network down' },
    });
  });

  it('reset returns to idle', async () => {
    const { result } = renderHook(() => useAsync(async () => 42));
    await act(async () => {
      await result.current.run();
    });
    act(() => result.current.reset());
    expect(result.current.state.status).toBe('idle');
  });
});
