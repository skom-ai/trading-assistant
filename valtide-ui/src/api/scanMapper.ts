/**
 * File: src/api/scanMapper.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.1 — Wire ScannerView to POST /api/v1/scan (live rows,
 *   loading/error, mock fallback).
 * Source: factor-key contract + numeric conventions proven in
 *   valtide-ui/src/components/StockScanner.tsx (scanRowToTicker, 2026-09-07);
 *   display-string formatting matches src/data/mockTerminalData.ts so live
 *   rows render identically to the reference universe.
 * Description:
 *   Pure, side-effect-free mapping of the BFF FR2 scan response rows
 *   (ScanRow[]) onto the ScannerView display shape (SectorAsset[]). Isolated
 *   from React and transport (Single Responsibility) so it is unit-testable in
 *   full and reused by the page without duplicating the field math. Fields the
 *   deterministic scan does not supply (sector cluster narrative, 6M momentum)
 *   are defaulted to safe, clearly-labelled placeholders rather than invented.
 */
import type { ScanRow } from './types';
import type { SectorAsset } from '../types/terminal';

/**
 * Canonical factor keys emitted by the FR2 agent response, mirrored from the
 * proven live mapping. Centralised so a contract rename is a one-line change.
 */
const FACTOR = {
  valuationZ: 'VALUATION_ZSCORE',
  mom3M: 'MOMENTUM_3M',
  mom6M: 'MOMENTUM_6M',
  rsi14: 'RSI_14',
  volTrend: 'VOLUME_TREND',
} as const;

/** Read a numeric factor, treating null/absent as 0 (never NaN into the UI). */
function factor(row: ScanRow, key: string): number {
  const v = row.factors?.[key];
  return typeof v === 'number' ? v : 0;
}

/** Format a signed number to a fixed-precision string, e.g. 0.42 -> "+0.42". */
function signed(value: number, digits: number, suffix = ''): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}${suffix}`;
}

/**
 * Map a single live FR2 scan row onto the ScannerView SectorAsset shape.
 *
 * @param row  One ranked row from the BFF scan response.
 * @param idx  Zero-based position in the ranked list (drives the "01" rank).
 * @returns    A fully-populated SectorAsset for the master/detail panels.
 */
export function scanRowToSectorAsset(row: ScanRow, idx: number): SectorAsset {
  const valuationZ = factor(row, FACTOR.valuationZ);
  const mom3M = factor(row, FACTOR.mom3M);
  const mom6M = factor(row, FACTOR.mom6M);
  const rsi14 = factor(row, FACTOR.rsi14);
  const volTrend = factor(row, FACTOR.volTrend);
  const price = row.last_price ?? 0;
  // Rank from server when present and positive, else fall back to list order.
  const rankNum = row.rank > 0 ? row.rank : idx + 1;

  return {
    rank: String(rankNum).padStart(2, '0'),
    ticker: row.symbol,
    name: row.symbol, // scan contract carries no long name; symbol stands in.
    price: `$${price.toFixed(2)}`,
    priceNum: price,
    // The deterministic scan has no intraday change field; show neutral.
    change: '—',
    isPositive: true,
    peZ: signed(valuationZ, 2),
    // Positive valuation Z = richer (worse) valuation, per live UI colouring.
    peZPositive: valuationZ > 0,
    mom: signed(mom3M, 1, '%'),
    momPositive: mom3M >= 0,
    rsi: Number(rsi14.toFixed(1)),
    score: Number((row.composite_score ?? 0).toFixed(1)),
    volumeTrend: `${volTrend.toFixed(2)}x`,
    normPe: '—',
    mom6M: signed(mom6M, 1, '%'),
    cluster: 'Live Deterministic Scan',
    clusterConf: '—',
    clusterDesc:
      'Composite rank computed by the Zero-LLM deterministic FR2 engine from ' +
      'live multi-factor inputs. Narrative cluster assessment is not part of ' +
      'the scan contract.',
  };
}

/**
 * Map the full set of live FR2 scan rows onto SectorAsset[] for rendering.
 * Pure and total: an empty input yields an empty list (the page decides
 * whether to fall back to the mock universe).
 *
 * @param rows  Ranked rows from the BFF scan response.
 * @returns     Display-ready SectorAsset list in the same order.
 */
export function scanRowsToSectorAssets(rows: ScanRow[]): SectorAsset[] {
  return rows.map(scanRowToSectorAsset);
}

/**
 * Honest classification of where the rendered scan data came from, derived
 * from the per-row `provenance` stamp. Drives the header badge so the UI never
 * claims "LIVE" for end-of-day or synthetic data:
 *   - 'last_close' — real Yahoo data from the daily-close chart feed
 *     (provenance "yahoo-live:*"). This is end-of-day, NOT intraday real-time,
 *     so it is labelled LAST CLOSE, not LIVE.
 *   - 'reference'  — synthetic fallback or no rows at all (the page shows the
 *     typed reference universe).
 *   - 'live'       — reserved for a genuine real-time intraday feed. The
 *     current Yahoo chart feed never produces this; kept so adding a real-time
 *     source later is a provenance change, not a UI change.
 */
export type ScanDataSource = 'live' | 'last_close' | 'reference';

/**
 * Derive the data source for a set of scan rows from their provenance stamps.
 * Rows are classified independently; the WEAKEST source wins so a scan with
 * any synthetic fallback row is not advertised as fully live-backed.
 *
 * @param rows Ranked rows from the BFF scan response (may be empty).
 * @returns The honest ScanDataSource for the badge.
 */
export function scanDataSource(rows: ScanRow[]): ScanDataSource {
  if (!rows.length) return 'reference';
  // Any synthetic/mock row => the set is not purely real market data.
  const anySynthetic = rows.some(r => {
    const p = (r.provenance ?? '').toLowerCase();
    return p === '' || p.startsWith('synthetic');
  });
  if (anySynthetic) return 'reference';
  // Genuine real-time feed (future): provenance would start with "live-rt:".
  const allRealtime = rows.every(r =>
    (r.provenance ?? '').toLowerCase().startsWith('live-rt:'),
  );
  if (allRealtime) return 'live';
  // Real Yahoo data from the daily-close chart feed => last close.
  return 'last_close';
}
