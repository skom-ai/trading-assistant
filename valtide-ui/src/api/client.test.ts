/**
 * File: src/api/client.test.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Unit tests for the BFF API client. Mocks global fetch to verify the
 *   correct method/path/body for each call and that a non-2xx taxonomy
 *   envelope is thrown as an ApiError.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { valtideApi, type ApiError } from './client';

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
    mockFetch(200, { strategy: { verdict: 'BUY' }, analogs: [], disclaimer: 'd', analog_disclaimer: 'a' });
    const out = await valtideApi.strategy('NVDA', 'REAL_CATALYST');
    expect((out.strategy as { verdict: string }).verdict).toBe('BUY');
  });

  it('throws the taxonomy envelope on a non-2xx response', async () => {
    mockFetch(400, { code: 'VALIDATION_ERROR', message: 'bad', correlationId: 'c' });
    await expect(valtideApi.newsCheck('bad!')).rejects.toMatchObject<Partial<ApiError>>({
      code: 'VALIDATION_ERROR',
    });
  });
});
