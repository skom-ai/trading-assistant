/**
 * File: src/api/governanceMapper.test.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W3.3 — Wire GovernanceAuditView to GET /api/v1/governance.
 * Description:
 *   Unit tests for the pure governanceMapper (AuditLedgerRecord[] ->
 *   AuditRecord[], plus deriveEventCount). Mock records are synthetic
 *   (allowed in tests only) and exercise every branch: status normalization
 *   (PASSED/FLAGGED/RESOLVED/default), 0x-prefix stripping (present/absent),
 *   empty trace-id id fallback, log construction, list order, and the
 *   event-count derivation (claims present / absent / negative / non-numeric).
 *   Targets the ≥95% coverage bar on the mapping logic file.
 */
import { describe, expect, it } from 'vitest';
import {
  deriveEventCount,
  ledgerRecordToAuditRecord,
  ledgerRecordsToAuditRecords,
} from './governanceMapper';
import type { AuditLedgerRecord } from './types';

/** A fully-populated synthetic live record. */
const rec: AuditLedgerRecord = {
  traceId: 'TRC-42',
  event: 'STOCK-300: Strategy Studio',
  symbol: 'NVDA',
  pipeline: 'AlphaAgent + Native Math',
  merkleHash: '0xabc123def456',
  status: 'SEC-17a-4 Verified',
  timestamp: '2026-10-03 14:32:09 UTC',
  initiatingEntity: 'system',
  latencyMs: 18.4,
};

describe('ledgerRecordToAuditRecord', () => {
  it('maps a fully-populated record with real fields', () => {
    const a = ledgerRecordToAuditRecord(rec, 0);
    expect(a.id).toBe('TRC-42');
    expect(a.correlationId).toBe('TRC-42');
    expect(a.ticker).toBe('NVDA');
    expect(a.featureTriggered).toBe('STOCK-300: Strategy Studio');
    expect(a.citations).toBe(0); // not fabricated per-row
    expect(a.status).toBe('PASSED'); // "Verified" -> PASSED
    expect(a.hash).toBe('abc123def456'); // 0x stripped
    expect(a.wormState).toBe('LOCKED');
    expect(a.logs).toHaveLength(5);
    expect(a.logs[4]).toContain('WORM storage');
    expect(a.logs[0]).toContain('TRC-42');
  });

  it('normalizes a FLAGGED status', () => {
    expect(ledgerRecordToAuditRecord({ ...rec, status: 'FLAGGED gate' }, 0).status)
      .toBe('FLAGGED');
  });

  it('normalizes a RESOLVED status', () => {
    expect(ledgerRecordToAuditRecord({ ...rec, status: 'Resolved later' }, 0).status)
      .toBe('RESOLVED');
  });

  it('keeps a non-0x hash unchanged and falls back the id when traceId is empty', () => {
    const a = ledgerRecordToAuditRecord(
      { ...rec, traceId: '', merkleHash: 'deadbeef', symbol: '' },
      3,
    );
    expect(a.hash).toBe('deadbeef'); // no 0x prefix to strip
    expect(a.id).toBe('rec-4'); // idx 3 -> "rec-4"
    expect(a.correlationId).toBe('');
    expect(a.logs[1]).toContain('n/a'); // empty symbol rendered safely
  });

  it('renders n/a timestamp in logs when timestamp is empty', () => {
    const a = ledgerRecordToAuditRecord({ ...rec, timestamp: '' }, 0);
    expect(a.logs[0]).toContain('[n/a]');
  });
});

describe('ledgerRecordsToAuditRecords', () => {
  it('maps a list preserving order', () => {
    const out = ledgerRecordsToAuditRecords([
      rec,
      { ...rec, traceId: 'TRC-43', symbol: 'MSFT' },
    ]);
    expect(out.map((r) => r.ticker)).toEqual(['NVDA', 'MSFT']);
    expect(out[1].id).toBe('TRC-43');
  });

  it('returns an empty list for empty input (page handles fallback)', () => {
    expect(ledgerRecordsToAuditRecords([])).toEqual([]);
  });
});

describe('deriveEventCount', () => {
  it('adds the real claims_verified_count to the record count', () => {
    expect(deriveEventCount([rec, rec], { claims_verified_count: 5 })).toBe(7);
  });

  it('floors a fractional claim count', () => {
    expect(deriveEventCount([rec], { claims_verified_count: 2.9 })).toBe(3);
  });

  it('ignores a negative claim count and uses record count only', () => {
    expect(deriveEventCount([rec], { claims_verified_count: -4 })).toBe(1);
  });

  it('ignores a non-numeric claim count', () => {
    expect(deriveEventCount([rec, rec], { claims_verified_count: 'x' })).toBe(2);
  });

  it('handles an absent bundle count (record count only)', () => {
    expect(deriveEventCount([rec], {})).toBe(1);
  });

  it('is zero for no records and no claims', () => {
    expect(deriveEventCount([], {})).toBe(0);
  });
});
