/**
 * File: src/api/strategyMapper.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.3 — Wire StrategyEngineView to POST /api/v1/strategy (live
 *   strategy verdict + trade levels + FR4 analogs, loading/error, mock
 *   fallback; richer UI fields with no API source flagged, never invented).
 * Source: authoritative BFF contract in
 *   valtide-api/agent-fastapi/app/domain/schemas.py
 *   (StrategyRecommendation + AnalogMatch, extra='forbid', 2026-09-07) and the
 *   null-safe live overlay proven in valtide-ui/src/components/StrategyStudio.tsx
 *   (fmt => 'N/A' for null levels) + HistoricalPrecedents.tsx (analog display).
 * Description:
 *   Pure, side-effect-free overlay of the BFF FR3+FR4 strategy response
 *   (StrategyResponse) onto the StrategyEngineView display shape (StrategyData).
 *   Isolated from React and transport (Single Responsibility) so it is fully
 *   unit-testable and reused by the page without duplicating the overlay math.
 *
 *   SCOPE HONESTY (the whole point of W2.3): the view renders a RICHER
 *   StrategyData than /api/v1/strategy returns. The API supplies only
 *   {verdict, entry, target, stop, holding_horizon, confidence, rationale,
 *   cited_evidence_ids} + analogs[] + disclaimers. This mapper maps ONLY those
 *   real fields; every field with no API source is INHERITED verbatim from the
 *   typed mock base (never fabricated) and the exhaustive list of such fields
 *   lives in W2.3_unbacked_fields.md. The page marks the panel LIVE/FALLBACK
 *   and labels the unbacked technical/visual fields as demo on live data.
 */
import type { StrategyResponse } from './types';
import type { StrategyData } from '../types/terminal';

/** StrategyData['verdict'] union, named once so a contract change is local. */
type Verdict = StrategyData['verdict'];
/** One analog entry in the StrategyData display shape. */
type Analog = StrategyData['historicalAnalogs'][number];
/** One citation entry in the StrategyData display shape. */
type Citation = StrategyData['citations'][number];

/**
 * Shape of the FR3 strategy sub-object (mirrors StrategyRecommendation).
 * The transport types it as Record<string, unknown>; we narrow the fields we
 * actually read so a sparse or WAIT/AVOID payload (null levels) is null-safe.
 */
interface LiveStrategy {
  verdict?: string;
  entry?: number | null;
  target?: number | null;
  stop?: number | null;
  holding_horizon?: string | null;
  confidence?: string;
  rationale?: string;
  cited_evidence_ids?: string[];
}

/** Shape of one FR4 analog (mirrors AnalogMatch). All fields optional-read. */
interface LiveAnalog {
  case_ticker?: string;
  case_date?: string;
  catalyst_type?: string;
  similarity_score?: number;
  match_reason?: string;
  real_outcome?: string;
  rank?: number;
}

/**
 * Map the FR3 agent verdict enum (BUY/WAIT/AVOID/INSUFFICIENT_EVIDENCE) onto
 * the view's richer verdict union. The view enum has no WAIT/AVOID member, so
 * non-actionable verdicts collapse onto the nearest display intent and the
 * page relies on the LIVE badge + 'demo' labels to avoid implying a trade.
 */
const VERDICT_TO_DISPLAY: Record<string, Verdict> = {
  BUY: 'ACCUMULATE_BREAKOUT',
  WAIT: 'HOLD_RANGE',
  AVOID: 'REDUCE_EXPOSURE',
  INSUFFICIENT_EVIDENCE: 'HOLD_RANGE',
};

/** Format a live numeric level as a $-string, or 'N/A (live)' when null. */
function level(v: number | null | undefined): string {
  return typeof v === 'number' ? `$${v.toFixed(2)}` : 'N/A (live)';
}

/**
 * Compute the risk/reward ratio label from live entry/target/stop. Returns
 * 'N/A (live)' unless all three are present and entry != stop (never divides
 * by zero, never fabricates a ratio from mock numbers on live data).
 */
function riskReward(s: LiveStrategy): string {
  const { entry, target, stop } = s;
  if (
    typeof entry === 'number' &&
    typeof target === 'number' &&
    typeof stop === 'number' &&
    entry !== stop
  ) {
    return `1 : ${Math.abs((target - entry) / (entry - stop)).toFixed(2)}`;
  }
  return 'N/A (live)';
}

/**
 * Map one live FR4 analog record onto the view's analog display shape. The
 * API similarity_score is in [0,1]; it is rendered as a percentage. Fields the
 * analog contract does not carry (holding-days text) default rather than
 * invent, and `idx` provides a stable 1-based case label when rank is absent.
 *
 * @param a   The raw FR4 analog record.
 * @param idx Zero-based position (drives the fallback case id).
 */
export function analogToDisplay(a: LiveAnalog, idx: number): Analog {
  const rank = typeof a.rank === 'number' && a.rank > 0 ? a.rank : idx + 1;
  const pct =
    typeof a.similarity_score === 'number'
      ? `${(a.similarity_score * 100).toFixed(1)}%`
      : 'N/A';
  const ticker = a.case_ticker || 'N/A';
  const when = a.case_date || 'historical';
  return {
    caseId: `#${rank} ${ticker} (${when})`,
    date: when,
    // FR4 carries real_outcome (recorded outcome) but no numeric holding-days;
    // the recorded outcome string stands in rather than a fabricated return %.
    returnText: a.real_outcome || 'Outcome on record',
    days: '—',
    summary: a.match_reason || a.catalyst_type || 'Mechanically matched analog.',
    matchScore: pct,
    status: 'Live FR4 Match',
  };
}

/**
 * Overlay a live FR3+FR4 strategy response onto a typed mock base, producing
 * the StrategyData the StrategyEngineView renders. Pure and total: every field
 * the API does not supply is inherited from `base`, so the three-column
 * cockpit never blanks. Only the fields the BFF actually returns are mapped;
 * see W2.3_unbacked_fields.md for the fields deliberately left on `base`.
 *
 * @param resp The live BFF strategy response.
 * @param base The typed mock StrategyData for the same ticker (fallback fields).
 * @returns    A StrategyData with live FR3 levels + verdict + FR4 analogs
 *             overlaid and all unbacked fields inherited from `base`.
 */
export function strategyResponseToData(
  resp: StrategyResponse,
  base: StrategyData,
): StrategyData {
  const s = (resp.strategy ?? {}) as LiveStrategy;
  const verdict = (s.verdict && VERDICT_TO_DISPLAY[s.verdict]) || base.verdict;

  // Live FR4 analogs override the mock set only when the API returns some; an
  // empty analog list keeps the reference analogs visible (panel never blanks).
  const analogs: Analog[] =
    resp.analogs && resp.analogs.length
      ? (resp.analogs as LiveAnalog[]).map(analogToDisplay)
      : base.historicalAnalogs;

  // Live evidence ids -> citation rows when present; else keep mock citations.
  const ids = s.cited_evidence_ids ?? [];
  const citations: Citation[] = ids.length
    ? ids.map((id, i): Citation => ({
        id: id || `EVID-${i + 1}`,
        name: 'Cited evidence (live FR3)',
        status: 'Live',
      }))
    : base.citations;

  // Confidence shown verbatim from the live qualitative level when present.
  const confidence = s.confidence ? `${s.confidence} (live)` : base.confidence;

  // Identity fields (name/exchange/price/change/volume) have NO live source in
  // the /api/v1/strategy contract — normally they are inherited from the typed
  // mock base for the SAME ticker. But STRATEGY_DATA_MAP only covers a handful
  // of symbols, so for any other live symbol the page falls back to the NVDA
  // base: inheriting its identity verbatim would show e.g. "NVIDIA Corporation"
  // / $128.40 next to an AVGO ticker/strategy. When the live symbol does not
  // match the base's ticker, surface the symbol itself and blank the price
  // fields rather than mislabel one company's data as another's.
  const liveSymbol = (resp.symbol || '').toUpperCase();
  const baseMatchesSymbol =
    liveSymbol !== '' && liveSymbol === (base.ticker || '').toUpperCase();
  const identity = baseMatchesSymbol
    ? {}
    : {
        name: liveSymbol || base.name,
        exchange: '—',
        price: '— (live)',
        priceNum: 0,
        change: '— (live)',
        volume: '— (live)',
      };

  return {
    ...base,
    ticker: resp.symbol || base.ticker,
    ...identity,
    verdict,
    confidence,
    // Trade params: ONLY the three live levels + derived R:R are real; the
    // percent/label strings have no live source, so they are blanked on live
    // data rather than carried from the mock (which would mislabel $-moves).
    tradeParams: {
      ...base.tradeParams,
      entryTarget: level(s.entry),
      entryType: s.holding_horizon ? `Horizon: ${s.holding_horizon}` : 'Live FR3',
      stopLoss: level(s.stop),
      stopLossPercent: '— (live)',
      profitTarget: level(s.target),
      profitTargetPercent: '— (live)',
      riskReward: riskReward(s),
      ratioLabel: 'Live FR3 Levels',
    },
    // Rationale is the one live free-text field; surface it in the invalidation
    // slot so live reasoning is visible, keep the mock upgrade rule labelled.
    executionRules: {
      invalidation: s.rationale || base.executionRules.invalidation,
      upgrade: base.executionRules.upgrade,
    },
    citations,
    historicalAnalogs: analogs,
  };
}
