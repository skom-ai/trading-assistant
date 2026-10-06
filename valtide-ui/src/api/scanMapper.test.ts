/**
 * File: src/api/scanMapper.test.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.1 — Wire ScannerView to POST /api/v1/scan.
 * Description:
 *   Unit tests for the pure scanMapper (ScanRow[] -> SectorAsset[]). Mock
 *   rows are synthetic (allowed in tests only) and exercise every branch:
 *   signed formatting (+/-), null last_price, null/absent factors, server
 *   rank vs list-order fallback, and the valuation/momentum colour flags.
 *   Targets the ≥95% coverage bar on the mapping logic file.
 */
import { describe, expect, it } from 'vitest';
import { scanRowToSectorAsset, scanRowsToSectorAssets, scanDataSource } from './scanMapper';
import type { ScanRow } from './types';

/** A fully-populated synthetic row with positive valuation + momentum. */
const richRow: ScanRow = {
  symbol: 'NVDA',
  rank: 1,
  composite_score: 94.84,
  last_price: 128.4,
  factors: {
    VALUATION_ZSCORE: 0.42,
    MOMENTUM_3M: 38.4,
    MOMENTUM_6M: 64.2,
    RSI_14: 58.25,
    VOLUME_TREND: 1.42,
  },
};

describe('scanRowToSectorAsset', () => {
  it('maps a fully-populated row with positive factors', () => {
    const a = scanRowToSectorAsset(richRow, 0);
    expect(a.ticker).toBe('NVDA');
    expect(a.rank).toBe('01');
    expect(a.price).toBe('$128.40');
    expect(a.priceNum).toBe(128.4);
    expect(a.score).toBe(94.8); // rounded to 1 dp
    expect(a.peZ).toBe('+0.42');
    expect(a.peZPositive).toBe(true); // Z > 0
    expect(a.mom).toBe('+38.4%');
    expect(a.momPositive).toBe(true);
    expect(a.rsi).toBe(58.3); // rounded to 1 dp
    expect(a.volumeTrend).toBe('1.42x');
    expect(a.mom6M).toBe('+64.2%');
  });

  it('formats negative valuation and momentum with a leading minus', () => {
    const row: ScanRow = {
      symbol: 'AVGO',
      rank: 3,
      composite_score: 87.6,
      last_price: 168.2,
      factors: { VALUATION_ZSCORE: -0.85, MOMENTUM_3M: -2.5, MOMENTUM_6M: -1.0 },
    };
    const a = scanRowToSectorAsset(row, 2);
    expect(a.peZ).toBe('-0.85');
    expect(a.peZPositive).toBe(false);
    expect(a.mom).toBe('-2.5%');
    expect(a.momPositive).toBe(false);
    expect(a.mom6M).toBe('-1.0%');
  });

  it('defaults null last_price and null/absent factors to zero (no NaN)', () => {
    const row: ScanRow = {
      symbol: 'TEST',
      rank: 5,
      composite_score: 0,
      last_price: null,
      factors: { VALUATION_ZSCORE: null },
    };
    const a = scanRowToSectorAsset(row, 4);
    expect(a.price).toBe('$0.00');
    expect(a.priceNum).toBe(0);
    expect(a.peZ).toBe('+0.00');
    expect(a.rsi).toBe(0);
    expect(a.volumeTrend).toBe('0.00x');
    expect(a.score).toBe(0);
  });

  it('falls back to list order when the server rank is not positive', () => {
    const row: ScanRow = { ...richRow, rank: 0 };
    expect(scanRowToSectorAsset(row, 6).rank).toBe('07'); // idx 6 -> "07"
  });

  it('carries the live-scan cluster placeholders (not invented narrative)', () => {
    const a = scanRowToSectorAsset(richRow, 0);
    expect(a.cluster).toBe('Live Deterministic Scan');
    expect(a.clusterConf).toBe('—');
    expect(a.name).toBe('NVDA'); // symbol stands in for long name
  });
});

describe('scanRowsToSectorAssets', () => {
  it('maps a list preserving order', () => {
    const out = scanRowsToSectorAssets([
      richRow,
      { ...richRow, symbol: 'MSFT', rank: 2 },
    ]);
    expect(out.map((r) => r.ticker)).toEqual(['NVDA', 'MSFT']);
    expect(out[1].rank).toBe('02');
  });

  it('returns an empty list for empty input (page handles fallback)', () => {
    expect(scanRowsToSectorAssets([])).toEqual([]);
  });

  it('defaults a missing composite_score to zero', () => {
    // Simulate a row where the score field is absent (defensive ?? 0 branch).
    const row = { ...richRow } as Partial<ScanRow> & ScanRow;
    delete (row as { composite_score?: number }).composite_score;
    expect(scanRowToSectorAsset(row, 0).score).toBe(0);
  });
});

describe('scanDataSource', () => {
  const yahoo = (symbol: string): ScanRow => ({
    ...richRow, symbol, provenance: `yahoo-live:${symbol}@2026-10-03T13:00:00+00:00`,
  });

  it('labels real Yahoo daily-close rows as LAST CLOSE, not LIVE', () => {
    // Regression: the Yahoo chart feed is end-of-day data; the badge used to
    // say "LIVE" for it. yahoo-live:* provenance must classify as last_close.
    expect(scanDataSource([yahoo('NVDA'), yahoo('AMD')])).toBe('last_close');
  });

  it('treats no rows as reference (reference universe shown)', () => {
    expect(scanDataSource([])).toBe('reference');
  });

  it('treats any synthetic-fallback row as reference (not advertised live)', () => {
    const rows: ScanRow[] = [yahoo('NVDA'), { ...richRow, symbol: 'XYZ', provenance: 'synthetic-yfinance-v1:XYZ' }];
    expect(scanDataSource(rows)).toBe('reference');
  });

  it('treats rows with an absent provenance stamp as reference', () => {
    expect(scanDataSource([richRow])).toBe('reference'); // richRow has no provenance
  });

  it('labels a genuine real-time feed as LIVE (future live-rt: provenance)', () => {
    const rt: ScanRow[] = [
      { ...richRow, symbol: 'NVDA', provenance: 'live-rt:NVDA@2026-10-03T13:00:00+00:00' },
      { ...richRow, symbol: 'AMD', provenance: 'live-rt:AMD@2026-10-03T13:00:00+00:00' },
    ];
    expect(scanDataSource(rt)).toBe('live');
  });
});
