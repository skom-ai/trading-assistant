/**
 * File: src/api/strategyMapper.test.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.3 — Wire StrategyEngineView to POST /api/v1/strategy.
 * Description:
 *   Unit tests for the pure strategyMapper (StrategyResponse -> StrategyData).
 *   Mock responses are synthetic (allowed in tests only) and exercise every
 *   branch: each verdict->display mapping (incl. unknown-verdict fallback),
 *   actionable BUY levels + derived risk/reward vs WAIT/AVOID null levels
 *   ('N/A (live)'), the entry==stop zero-division guard, the empty-analog and
 *   empty-evidence fallbacks to base, analog rank/similarity/outcome defaults,
 *   and the symbol/confidence/rationale fallbacks. Targets the >=95% coverage
 *   bar on the mapping logic file.
 */
import { describe, expect, it } from 'vitest';
import { analogToDisplay, strategyResponseToData } from './strategyMapper';
import type { StrategyResponse } from './types';
import type { StrategyData } from '../types/terminal';

/** Minimal typed mock base standing in for the reference universe entry. */
const base: StrategyData = {
  ticker: 'NVDA',
  name: 'NVIDIA Corporation',
  exchange: 'NASDAQ',
  price: '$128.40',
  priceNum: 128.4,
  change: '+3.42 (+2.73%)',
  volume: '64.2M',
  verdict: 'BUY_PULLBACK',
  auditStatus: 'Passed Independent Audit',
  confidence: 'HIGH - 84%',
  trendAlignment: { status: 'Bullish Aligned', daily: 'STRONG', weekly: 'BULLISH', monthly: 'ACCEL' },
  maSpread: '+4.82% (Expanded)',
  maSpreadPercent: 78,
  atrVolatility: '$3.84 (Normal)',
  anchoredVwap: '$118.20',
  confluenceZones: [{ name: 'Zone A', range: '$124-$125', tag: 'High', type: 'high' }],
  volumeProfilePoc: '$126.30',
  volumeProfileBars: [30, 45, 60],
  tradeParams: {
    entryTarget: '$124.50', entryType: 'Limit Order', stopLoss: '$119.80',
    stopLossPercent: '-3.78% Risk', profitTarget: '$138.50', profitTargetPercent: '+11.24% Upside',
    riskReward: '1 : 2.98', ratioLabel: 'Optimized Ratio',
  },
  executionRules: { invalidation: 'mock invalidation', upgrade: 'mock upgrade' },
  citations: [{ id: 'CIT-901', name: 'mock cite', status: 'Verified' }],
  historicalAnalogs: [
    { caseId: 'Case #482', date: 'Nov 2023', returnText: '+18.4% / 22d', days: '22d', summary: 'mock', matchScore: '94.2%', status: 'Validated Outcome' },
  ],
  secCorrelationId: 'VAL-2023-NVDA-8841',
  secHash: 'abc',
  node: 'US-EAST-DMA-04',
};

/** A fully-actionable synthetic BUY response with two FR4 analogs. */
const liveBuy: StrategyResponse = {
  symbol: 'NVDA',
  strategy: {
    verdict: 'BUY',
    entry: 124.5,
    target: 138.5,
    stop: 119.8,
    holding_horizon: '1-3 months',
    confidence: 'HIGH',
    rationale: 'MA20>MA50>MA200 with volume confirmation.',
    cited_evidence_ids: ['EV-1', 'EV-2'],
  },
  analogs: [
    { case_ticker: 'AMD', case_date: '2023-05-18', catalyst_type: 'EMA pullback', similarity_score: 0.882, match_reason: '20D EMA pullback post-capex', real_outcome: '+18.4% in 22d', rank: 1 },
    { catalyst_type: 'consolidation' }, // sparse: exercises every default
  ],
  disclaimer: 'Not advice.',
  analog_disclaimer: 'Illustrative precedent.',
};

describe('strategyResponseToData', () => {
  it('overlays an actionable BUY with live levels, verdict, R:R and analogs', () => {
    const d = strategyResponseToData(liveBuy, base);
    expect(d.ticker).toBe('NVDA');
    expect(d.verdict).toBe('ACCUMULATE_BREAKOUT'); // BUY -> display
    expect(d.confidence).toBe('HIGH (live)');
    expect(d.tradeParams.entryTarget).toBe('$124.50');
    expect(d.tradeParams.stopLoss).toBe('$119.80');
    expect(d.tradeParams.profitTarget).toBe('$138.50');
    expect(d.tradeParams.entryType).toBe('Horizon: 1-3 months');
    // R:R = |(138.5-124.5)/(124.5-119.8)| = 14/4.7 = 2.98
    expect(d.tradeParams.riskReward).toBe('1 : 2.98');
    expect(d.executionRules.invalidation).toContain('MA20');
    expect(d.executionRules.upgrade).toBe('mock upgrade'); // inherited
    expect(d.citations).toHaveLength(2);
    expect(d.citations[0]).toMatchObject({ id: 'EV-1', status: 'Live' });
    expect(d.historicalAnalogs).toHaveLength(2);
    // Unbacked fields inherited verbatim from base (never fabricated).
    expect(d.anchoredVwap).toBe(base.anchoredVwap);
    expect(d.volumeProfileBars).toBe(base.volumeProfileBars);
  });

  it('maps WAIT -> HOLD_RANGE and renders null levels as N/A (live)', () => {
    const d = strategyResponseToData(
      { ...liveBuy, strategy: { verdict: 'WAIT', entry: null, target: null, stop: null, confidence: 'MEDIUM', rationale: 'overextended' } },
      base,
    );
    expect(d.verdict).toBe('HOLD_RANGE');
    expect(d.tradeParams.entryTarget).toBe('N/A (live)');
    expect(d.tradeParams.stopLoss).toBe('N/A (live)');
    expect(d.tradeParams.profitTarget).toBe('N/A (live)');
    expect(d.tradeParams.riskReward).toBe('N/A (live)'); // not all levels present
    expect(d.tradeParams.entryType).toBe('Live FR3'); // no holding_horizon
  });

  it('maps AVOID -> REDUCE_EXPOSURE and INSUFFICIENT_EVIDENCE -> HOLD_RANGE', () => {
    expect(strategyResponseToData({ ...liveBuy, strategy: { verdict: 'AVOID', confidence: 'LOW', rationale: 'x' } }, base).verdict).toBe('REDUCE_EXPOSURE');
    expect(strategyResponseToData({ ...liveBuy, strategy: { verdict: 'INSUFFICIENT_EVIDENCE', confidence: 'LOW', rationale: 'x' } }, base).verdict).toBe('HOLD_RANGE');
  });

  it('falls back to base verdict for an unknown/absent verdict', () => {
    expect(strategyResponseToData({ ...liveBuy, strategy: { verdict: 'MYSTERY', confidence: 'LOW', rationale: 'x' } }, base).verdict).toBe(base.verdict);
    expect(strategyResponseToData({ ...liveBuy, strategy: {} }, base).verdict).toBe(base.verdict);
  });

  it('defaults the strategy sub-object when it is absent entirely', () => {
    // resp.strategy == null -> {} fallback; levels N/A, verdict = base.
    const d = strategyResponseToData({ ...liveBuy, strategy: null as unknown as Record<string, unknown> }, base);
    expect(d.verdict).toBe(base.verdict);
    expect(d.tradeParams.entryTarget).toBe('N/A (live)');
    expect(d.confidence).toBe(base.confidence);
  });

  it('synthesises an EVID- id for a blank cited_evidence_id entry', () => {
    const d = strategyResponseToData(
      { ...liveBuy, strategy: { ...liveBuy.strategy, cited_evidence_ids: ['', 'EV-X'] } },
      base,
    );
    expect(d.citations[0].id).toBe('EVID-1'); // blank id -> synthesised
    expect(d.citations[1].id).toBe('EV-X');
  });

  it('guards risk/reward against entry == stop (no division by zero)', () => {
    const d = strategyResponseToData({ ...liveBuy, strategy: { verdict: 'BUY', entry: 120, target: 130, stop: 120, confidence: 'HIGH', rationale: 'x' } }, base);
    expect(d.tradeParams.riskReward).toBe('N/A (live)');
  });

  it('keeps the mock analogs when the live response has none', () => {
    const d = strategyResponseToData({ ...liveBuy, analogs: [] }, base);
    expect(d.historicalAnalogs).toBe(base.historicalAnalogs);
  });

  it('keeps the mock citations when live evidence ids are absent', () => {
    const d = strategyResponseToData({ ...liveBuy, strategy: { verdict: 'BUY', entry: 1, target: 2, stop: 0.5, confidence: 'HIGH', rationale: 'x' } }, base);
    expect(d.citations).toBe(base.citations);
  });

  it('falls back to base symbol + confidence when live fields are empty', () => {
    const d = strategyResponseToData({ ...liveBuy, symbol: '', strategy: { ...liveBuy.strategy, confidence: '', rationale: '' } }, base);
    expect(d.ticker).toBe('NVDA');
    expect(d.confidence).toBe(base.confidence);
    expect(d.executionRules.invalidation).toBe(base.executionRules.invalidation);
  });

  it('does NOT inherit the base company identity when the live symbol differs', () => {
    // Regression: STRATEGY_DATA_MAP has no AVGO entry, so the view falls back
    // to the NVDA base. Inheriting ...base verbatim showed the AVGO ticker next
    // to "NVIDIA Corporation" / $128.40. The live /api/v1/strategy contract has
    // no company name/price, so those identity fields must be blanked, never
    // shown as another company's data.
    const d = strategyResponseToData({ ...liveBuy, symbol: 'AVGO' }, base);
    expect(d.ticker).toBe('AVGO');
    expect(d.name).toBe('AVGO'); // NOT 'NVIDIA Corporation'
    expect(d.name).not.toBe(base.name);
    expect(d.price).not.toBe(base.price); // NOT '$128.40'
    expect(d.change).not.toBe(base.change);
    expect(d.volume).not.toBe(base.volume);
    expect(d.exchange).not.toBe(base.exchange);
    // Live strategy fields still overlay correctly.
    expect(d.verdict).toBe('ACCUMULATE_BREAKOUT');
    expect(d.tradeParams.entryTarget).toBe('$124.50');
  });

  it('keeps the base identity when the live symbol matches the base ticker', () => {
    const d = strategyResponseToData(liveBuy, base); // symbol NVDA == base NVDA
    expect(d.name).toBe(base.name);
    expect(d.price).toBe(base.price);
    expect(d.exchange).toBe(base.exchange);
    expect(d.volume).toBe(base.volume);
  });
});

describe('analogToDisplay', () => {
  it('maps a full analog with similarity as a percentage', () => {
    const a = analogToDisplay({ case_ticker: 'AMD', case_date: '2023-05-18', similarity_score: 0.882, match_reason: 'pullback', real_outcome: '+18.4%', rank: 1 }, 0);
    expect(a.caseId).toBe('#1 AMD (2023-05-18)');
    expect(a.matchScore).toBe('88.2%');
    expect(a.returnText).toBe('+18.4%');
    expect(a.summary).toBe('pullback');
    expect(a.status).toBe('Live FR4 Match');
  });

  it('defaults every field for a fully-sparse analog and uses idx+1 for rank', () => {
    const a = analogToDisplay({}, 2);
    expect(a.caseId).toBe('#3 N/A (historical)');
    expect(a.matchScore).toBe('N/A');
    expect(a.returnText).toBe('Outcome on record');
    expect(a.summary).toBe('Mechanically matched analog.');
    expect(a.days).toBe('—');
  });

  it('prefers catalyst_type for the summary when match_reason is absent', () => {
    expect(analogToDisplay({ catalyst_type: 'breakout' }, 0).summary).toBe('breakout');
  });
});
