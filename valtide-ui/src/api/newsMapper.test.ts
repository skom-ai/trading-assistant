/**
 * File: src/api/newsMapper.test.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.2 — Wire NewsCatalystView to POST /api/v1/news-check.
 * Description:
 *   Unit tests for the pure newsMapper (NewsResponse -> CatalystVerdict). Mock
 *   responses are synthetic (allowed in tests only) and exercise every branch:
 *   each label->status mapping (incl. the unknown-label fallback to base),
 *   citation overlay vs the empty-evidence fallback, sparse-citation field
 *   defaulting, and the symbol/rationale fallbacks. Targets the ≥95% coverage
 *   bar on the mapping logic file.
 */
import { describe, expect, it } from 'vitest';
import { newsResponseToVerdict } from './newsMapper';
import type { NewsResponse } from './types';
import type { CatalystVerdict } from '../types/terminal';

/** Typed mock base verdict standing in for the reference universe entry. */
const base: CatalystVerdict = {
  ticker: 'NVDA',
  confidence: '94.2%',
  status: 'MACRO_NEUTRAL',
  statusLabel: 'mock label',
  rationale: 'mock rationale',
  citations: [
    { id: 1, title: 'mock cite', source: 'MOCK', timeAgo: '3h ago', textExcerpt: 'x' },
  ],
  model: 'Valtide-LLM-v4-Alpha',
  latencyMs: 48,
};

/** A fully-populated synthetic live response with two citations. */
const liveReal: NewsResponse = {
  symbol: 'NVDA',
  label: 'REAL_CATALYST',
  rationale: 'Verified 8-K supply agreement drives EPS accretion.',
  citations: [
    { source: 'EDGAR', title: 'Form 8-K', url: 'https://sec.gov/8k', published_at: '3h ago' },
    { title: 'Supply audit' },
  ],
  disclaimer: 'Not investment advice.',
};

describe('newsResponseToVerdict', () => {
  it('overlays a REAL_CATALYST verdict with live rationale + citations', () => {
    const v = newsResponseToVerdict(liveReal, base);
    expect(v.ticker).toBe('NVDA');
    expect(v.status).toBe('REAL_CATALYST');
    expect(v.statusLabel).toContain('accretive');
    expect(v.rationale).toBe(liveReal.rationale);
    expect(v.citations).toHaveLength(2);
    // Inherited fields the FR1 contract does not supply.
    expect(v.confidence).toBe('94.2%');
    expect(v.model).toBe('Valtide-LLM-v4-Alpha');
    expect(v.latencyMs).toBe(48);
  });

  it('maps the first live citation fully and defaults the sparse second', () => {
    const [c1, c2] = newsResponseToVerdict(liveReal, base).citations;
    expect(c1).toMatchObject({ id: 1, title: 'Form 8-K', source: 'EDGAR', timeAgo: '3h ago', textExcerpt: 'https://sec.gov/8k' });
    // Second citation has no url/published_at/source -> defaults, textExcerpt falls back to title.
    expect(c2).toMatchObject({ id: 2, title: 'Supply audit', source: 'LIVE', timeAgo: 'live', textExcerpt: 'Supply audit' });
  });

  it('defaults every field for a fully-empty citation (no title/url/source)', () => {
    const v = newsResponseToVerdict({ ...liveReal, citations: [{}] }, base);
    expect(v.citations[0]).toMatchObject({
      id: 1,
      title: 'Untitled source',
      source: 'LIVE',
      timeAgo: 'live',
      textExcerpt: '',
    });
  });

  it('maps HYPE -> SPECULATIVE_HYPE', () => {
    const v = newsResponseToVerdict({ ...liveReal, label: 'HYPE' }, base);
    expect(v.status).toBe('SPECULATIVE_HYPE');
    expect(v.statusLabel).toContain('hype');
  });

  it('maps ALREADY_PRICED_IN and INSUFFICIENT_EVIDENCE -> MACRO_NEUTRAL', () => {
    expect(newsResponseToVerdict({ ...liveReal, label: 'ALREADY_PRICED_IN' }, base).status).toBe('MACRO_NEUTRAL');
    expect(newsResponseToVerdict({ ...liveReal, label: 'INSUFFICIENT_EVIDENCE' }, base).status).toBe('MACRO_NEUTRAL');
  });

  it('falls back to the base status for an unknown label', () => {
    const v = newsResponseToVerdict({ ...liveReal, label: 'UNMAPPED' }, base);
    expect(v.status).toBe(base.status); // MACRO_NEUTRAL
  });

  it('keeps the mock citations when the live verdict has no evidence', () => {
    const v = newsResponseToVerdict({ ...liveReal, citations: [] }, base);
    expect(v.citations).toBe(base.citations);
  });

  it('falls back to base symbol + rationale when the live fields are empty', () => {
    const v = newsResponseToVerdict({ ...liveReal, symbol: '', rationale: '' }, base);
    expect(v.ticker).toBe('NVDA');
    expect(v.rationale).toBe('mock rationale');
  });
});
