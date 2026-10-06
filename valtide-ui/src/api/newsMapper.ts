/**
 * File: src/api/newsMapper.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.2 — Wire NewsCatalystView to POST /api/v1/news-check (live
 *   verdict + citations, loading/error, mock fallback).
 * Source: label-to-class contract + citation field conventions proven in the
 *   live mapping at valtide-ui/src/components/OpportunityCheck.tsx (2026-09-07,
 *   LABEL_TO_CLASS + the live.citations.map overlay); display shape mirrors
 *   src/data/mockTerminalData.ts (CatalystVerdict) so a live verdict renders
 *   identically to the reference universe.
 * Description:
 *   Pure, side-effect-free mapping of the BFF FR1 news-check response
 *   (NewsResponse) onto the NewsCatalystView display shape (CatalystVerdict).
 *   Isolated from React and transport (Single Responsibility) so it is fully
 *   unit-testable and reused by the page without duplicating the overlay math.
 *   Fields the FR1 contract does not carry (confidence, model, latency,
 *   statusLabel, the 48-72h headlines feed) are inherited from a typed mock
 *   base verdict rather than invented — the live payload only overrides the
 *   fields it actually supplies (status, rationale, citations).
 */
import type { NewsResponse } from './types';
import type { CatalystVerdict } from '../types/terminal';

/** CatalystVerdict['status'] union, named once so a contract change is local. */
type VerdictStatus = CatalystVerdict['status'];

/** One citation entry in the CatalystVerdict display shape. */
type VerdictCitation = CatalystVerdict['citations'][number];

/**
 * Map the FR1 label enum onto the view's CatalystVerdict status union. The
 * three view states are REAL_CATALYST / SPECULATIVE_HYPE / MACRO_NEUTRAL; the
 * API's richer label set collapses onto them (HYPE -> hype, priced-in /
 * insufficient-evidence -> macro-neutral, catalyst -> real). Mirrors the
 * proven LABEL_TO_CLASS collapse in the live OpportunityCheck component.
 */
const LABEL_TO_STATUS: Record<string, VerdictStatus> = {
  REAL_CATALYST: 'REAL_CATALYST',
  HYPE: 'SPECULATIVE_HYPE',
  ALREADY_PRICED_IN: 'MACRO_NEUTRAL',
  INSUFFICIENT_EVIDENCE: 'MACRO_NEUTRAL',
};

/** Human-readable label shown beside the status badge, per status. */
const STATUS_LABEL: Record<VerdictStatus, string> = {
  REAL_CATALYST: 'Fundamentally accretive catalyst (live FR1)',
  SPECULATIVE_HYPE: 'Speculative hype filtered (live FR1)',
  MACRO_NEUTRAL: 'Neutral / already priced in (live FR1)',
};

/**
 * Map one live FR1 citation record onto the view's citation display shape.
 * The API citation is an untyped string map ({source,title,url,published_at,
 * …}); only the fields the panel renders are read, each defaulted so a sparse
 * citation never injects `undefined` into the UI.
 *
 * @param cit The raw FR1 citation record.
 * @param idx Zero-based position (drives the 1-based display id).
 */
function toVerdictCitation(
  cit: Record<string, string>,
  idx: number,
): VerdictCitation {
  return {
    id: idx + 1,
    title: cit.title ?? 'Untitled source',
    source: cit.source ?? 'LIVE',
    timeAgo: cit.published_at ?? 'live',
    textExcerpt: cit.url ?? cit.title ?? '',
  };
}

/**
 * Overlay a live FR1 news-check response onto a typed mock base verdict,
 * producing the CatalystVerdict the NewsCatalystView renders. Pure and total:
 * every field the API does not supply is inherited from `base`, so the panel
 * is never left with a blank confidence, model, latency, or statusLabel.
 *
 * @param resp The live BFF news-check response.
 * @param base The typed mock verdict for the same ticker (fallback fields).
 * @returns    A fully-populated CatalystVerdict with live fields overlaid.
 */
export function newsResponseToVerdict(
  resp: NewsResponse,
  base: CatalystVerdict,
): CatalystVerdict {
  const status = LABEL_TO_STATUS[resp.label] ?? base.status;
  // Live citations override the mock set only when the API actually returns
  // some; an empty-evidence verdict keeps the reference citations visible.
  const citations: VerdictCitation[] = resp.citations.length
    ? resp.citations.map(toVerdictCitation)
    : base.citations;

  return {
    ...base,
    ticker: resp.symbol || base.ticker,
    status,
    statusLabel: STATUS_LABEL[status],
    rationale: resp.rationale || base.rationale,
    citations,
  };
}
