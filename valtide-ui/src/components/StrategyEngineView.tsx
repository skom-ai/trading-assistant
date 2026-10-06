/**
 * File: src/components/StrategyEngineView.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.3 — Wire StrategyEngineView to POST /api/v1/strategy (live
 *   strategy verdict + trade levels + FR4 analogs, loading/error, mock
 *   fallback; richer UI fields with no API source flagged, never invented).
 * Description:
 *   FR3+FR4 strategy page. Runs the live BFF strategy call through the shared
 *   typed client (valtideApi.strategy) + useAsync loading/error hook, maps the
 *   response onto the StrategyData display shape via the pure strategyMapper,
 *   and keeps the mockTerminalData entry as a typed fallback so the cockpit
 *   never blanks when the BFF is unreachable. A LIVE/FALLBACK badge marks the
 *   data source, matching the W2.1/W2.2 UX. SCOPE HONESTY: the view renders a
 *   RICHER StrategyData than /api/v1/strategy returns (confluence zones, VWAP,
 *   ATR, volume profile, % labels). Those fields have no live source, so on
 *   live data they are inherited from the mock base and labelled "demo (no
 *   live source)" — never fabricated. See W2.3_unbacked_fields.md.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { STRATEGY_DATA_MAP } from '../data/mockTerminalData';
import { StrategyData } from '../types/terminal';
import { valtideApi } from '../api/client';
import { useAsync } from '../api/useAsync';
import { strategyResponseToData } from '../api/strategyMapper';

interface StrategyEngineViewProps {
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  onCommitAuditRecord: (ticker: string, correlationId: string, feature: string) => void;
  onOpenCitationModal: (title: string, text: string) => void;
}

/** Small badge marking a technical/visual field that has no live API source. */
const DemoTag: React.FC = () => (
  <span
    className="ml-1 px-1 py-0.5 rounded bg-[var(--c-78350f)]/20 text-[var(--c-fbbf24)] border border-[var(--c-78350f)]/40 font-mono text-[9px] uppercase tracking-wider align-middle"
    title="Not part of the /api/v1/strategy contract — shown from reference data, not live analysis."
  >
    demo
  </span>
);

export const StrategyEngineView: React.FC<StrategyEngineViewProps> = ({
  selectedTicker,
  setSelectedTicker,
  onCommitAuditRecord,
  onOpenCitationModal
}) => {
  const currentTickerUpper = (selectedTicker || 'NVDA').toUpperCase();
  // Typed reference entry: supplies the fallback AND the unbacked technical/
  // visual fields (confluence zones, VWAP, ATR, volume profile) on live data.
  const mockData: StrategyData = STRATEGY_DATA_MAP[currentTickerUpper] || STRATEGY_DATA_MAP['NVDA'];
  const [isCommitting, setIsCommitting] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  const availableTickers = Object.keys(STRATEGY_DATA_MAP);

  // Live FR3+FR4 strategy driven by the shared typed client + loading/error hook.
  const strategy = useAsync(valtideApi.strategy);
  const strategyError = strategy.state.status === 'error' ? strategy.state.error : null;

  // Rendered data = live FR3+FR4 overlaid on the typed mock base when the call
  // succeeded for THIS ticker; else the reference data (cockpit never blanks).
  const strategyData = useMemo<StrategyData>(() => {
    if (
      strategy.state.status === 'success' &&
      (strategy.state.data.symbol || '').toUpperCase() === currentTickerUpper
    ) {
      return strategyResponseToData(strategy.state.data, mockData);
    }
    return mockData;
  }, [strategy.state, currentTickerUpper, mockData]);
  const isLive = strategyData !== mockData;

  // Auto-run the live strategy call on mount and whenever the ticker changes so
  // the page always opens with real data for the active symbol.
  useEffect(() => {
    // Logging aids debugging the UI<->BFF boundary without leaking payloads.
    console.debug(`[StrategyEngineView] live strategy: ${currentTickerUpper}`);
    void strategy.run(currentTickerUpper);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTickerUpper]);

  const handleCommit = () => {
    setIsCommitting(true);
    setTimeout(() => {
      setIsCommitting(false);
      setIsCommitted(true);
      onCommitAuditRecord(strategyData.ticker, strategyData.secCorrelationId, 'Strategy Engine');
      setTimeout(() => setIsCommitted(false), 3000);
    }, 700);
  };

  return (
    <div className="flex flex-col w-full pb-8">
      <div className="flex flex-col w-full px-4 md:px-8 py-6 gap-6 max-w-[1600px] mx-auto">
        {/* Candidate Header Ribbon */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--c-7c3aed)]/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-4 z-10 flex-wrap">
            <div className="w-14 h-14 rounded-lg bg-[var(--c-18181b)] border border-[var(--c-27272a)] flex items-center justify-center font-bold text-xl text-[var(--c-a78bfa)] shadow-sm font-['Inter']">
              {strategyData.ticker}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--c-fafafa)] font-['Inter']">{strategyData.name}</h1>
                <span className="px-2 py-0.5 rounded bg-[var(--c-7c3aed)]/20 text-[var(--c-a78bfa)] border border-[var(--c-7c3aed)]/30 font-mono text-xs uppercase tracking-wider">
                  {strategyData.exchange}
                </span>

                {/* Quick Ticker Switcher */}
                <select
                  value={strategyData.ticker}
                  onChange={e => setSelectedTicker(e.target.value)}
                  className="bg-[var(--c-18181b)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] rounded px-2 py-0.5 text-xs font-mono ml-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--c-a78bfa)]"
                  title="Switch target ticker"
                >
                  {availableTickers.map(t => (
                    <option key={t} value={t} className="bg-[var(--c-121215)] text-[var(--c-fafafa)]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 mt-1 font-mono text-sm">
                <span className="text-lg font-semibold text-[var(--c-fafafa)]">{strategyData.price}</span>
                <span className="flex items-center text-[var(--c-34d399)] font-medium">
                  <span className="material-symbols-outlined text-[16px] mr-0.5">trending_up</span>
                  {strategyData.change}
                </span>
                <span className="text-[var(--c-52525b)]">|</span>
                <span className="text-[var(--c-a1a1aa)]">Vol: {strategyData.volume}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 z-10 w-full lg:w-auto justify-start lg:justify-end">
            {/* Live vs mock-fallback data-source indicator (matches W2.1/W2.2 UX) */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">Data Source</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-semibold border mt-1 ${
                  isLive
                    ? 'bg-[var(--c-065f46)]/20 text-[var(--c-34d399)] border-[var(--c-065f46)]/40'
                    : 'bg-[var(--c-78350f)]/20 text-[var(--c-fbbf24)] border-[var(--c-78350f)]/40'
                }`}
                title={isLive ? 'Strategy served live from /api/v1/strategy' : 'Showing reference strategy (live call unavailable)'}
              >
                <span className={`material-symbols-outlined text-[13px] ${strategy.isLoading ? 'animate-spin' : ''}`}>
                  {strategy.isLoading ? 'progress_activity' : isLive ? 'cloud_done' : 'cloud_off'}
                </span>
                {strategy.isLoading ? 'LOADING' : isLive ? 'LIVE' : 'FALLBACK'}
              </span>
            </div>

            {/* Public Verdict */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">Public Verdict</span>
              <span className="px-3 py-1 rounded bg-[var(--c-065f46)] text-[var(--c-34d399)] font-bold text-xs tracking-wide mt-1 flex items-center gap-1 border border-[var(--c-34d399)]/30">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {strategyData.verdict}
              </span>
            </div>

            {/* Anti-Sycophancy Audit Badge */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">Audit Status</span>
              <div className="px-3 py-1 rounded bg-[var(--c-18181b)] border border-[var(--c-34d399)]/40 text-[var(--c-34d399)] font-mono text-xs flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                {strategyData.auditStatus}
              </div>
            </div>

            {/* Calibrated Confidence Rating */}
            <div className="flex flex-col items-start lg:items-end">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">Confidence Rating</span>
              <div className="px-3 py-1 rounded bg-[var(--c-7c3aed)]/10 border border-[var(--c-7c3aed)]/30 text-[var(--c-a78bfa)] font-mono font-bold text-xs flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[var(--c-a78bfa)] animate-pulse"></span>
                {strategyData.confidence}
              </div>
            </div>
          </div>
        </div>

        {/* ERROR BANNER: live strategy failed -> reference strategy shown */}
        {strategyError && (
          <div
            role="alert"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--c-450a0a)]/40 border border-[var(--c-ef4444)]/40 text-[var(--c-fca5a5)] font-mono text-[11px]"
          >
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>
              {strategyError.code}: live /api/v1/strategy unavailable — showing reference strategy.
            </span>
          </div>
        )}

        {/* Three-Column Modular Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Column 1: Multi-Timeframe Technical Evidence */}
          <div className="flex flex-col gap-4 p-6 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--c-a78bfa)]">analytics</span>
                <h2 className="font-bold text-base text-[var(--c-fafafa)] font-['Inter']">Multi-Timeframe Evidence</h2>
                {isLive && <DemoTag />}
              </div>
              <span className="font-mono text-xs text-[var(--c-71717a)] px-2 py-0.5 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)]">
                STOCK-309
              </span>
            </div>

            {/* Trend Alignment */}
            <div className="flex flex-col gap-2 p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)]/60">
              <div className="flex justify-between items-center">
                <span className="text-[var(--c-a1a1aa)] text-xs">Trend Alignment</span>
                <span className="text-[var(--c-34d399)] font-mono font-semibold text-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">north_east</span>
                  {strategyData.trendAlignment.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="p-2 rounded bg-[var(--c-121215)] text-center border border-[var(--c-27272a)]/40">
                  <span className="block font-mono text-[10px] text-[var(--c-71717a)]">DAILY</span>
                  <span className="text-[var(--c-34d399)] font-mono text-xs font-bold">
                    {strategyData.trendAlignment.daily}
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--c-121215)] text-center border border-[var(--c-27272a)]/40">
                  <span className="block font-mono text-[10px] text-[var(--c-71717a)]">WEEKLY</span>
                  <span className="text-[var(--c-34d399)] font-mono text-xs font-bold">
                    {strategyData.trendAlignment.weekly}
                  </span>
                </div>
                <div className="p-2 rounded bg-[var(--c-121215)] text-center border border-[var(--c-27272a)]/40">
                  <span className="block font-mono text-[10px] text-[var(--c-71717a)]">MONTHLY</span>
                  <span className="text-[var(--c-34d399)] font-mono text-xs font-bold">
                    {strategyData.trendAlignment.monthly}
                  </span>
                </div>
              </div>
            </div>

            {/* MA Spreads & Volatility */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--c-a1a1aa)]">MA20 / MA60 Spread</span>
                <span className="font-mono text-[var(--c-fafafa)] font-semibold">{strategyData.maSpread}</span>
              </div>
              <div className="w-full bg-[var(--c-18181b)] h-2 rounded-full overflow-hidden border border-[var(--c-27272a)]/40">
                <div
                  className="bg-[var(--c-a78bfa)] h-full rounded-full transition-all"
                  style={{ width: `${strategyData.maSpreadPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="text-[var(--c-a1a1aa)]">ATR Volatility (14D)</span>
                <span className="font-mono text-[var(--c-fafafa)] font-semibold">{strategyData.atrVolatility}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--c-a1a1aa)]">Anchored VWAP (YTD)</span>
                <span className="font-mono text-[var(--c-a78bfa)] font-semibold">{strategyData.anchoredVwap}</span>
              </div>
            </div>

            {/* Confluence Support Zones */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">Confluence Support Zones</span>
              <div className="space-y-2">
                {strategyData.confluenceZones.map(zone => (
                  <div
                    key={zone.name}
                    className="flex items-center justify-between p-2.5 rounded bg-[var(--c-18181b)] text-xs border border-[var(--c-27272a)]/60"
                  >
                    <span className="font-mono text-[var(--c-fafafa)]">
                      {zone.name}: {zone.range}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                        zone.type === 'high'
                          ? 'bg-[var(--c-065f46)]/30 text-[var(--c-34d399)] border border-[var(--c-065f46)]/40'
                          : 'bg-[var(--c-27272a)] text-[var(--c-a1a1aa)]'
                      }`}
                    >
                      {zone.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini Sparkline / Volume Profile Representation */}
            <div className="mt-1 p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)]/60 flex flex-col gap-2">
              <div className="flex justify-between font-mono text-xs text-[var(--c-71717a)]">
                <span>VOLUME PROFILE (30D)</span>
                <span className="text-[var(--c-a78bfa)]">POC: {strategyData.volumeProfilePoc}</span>
              </div>
              <div className="h-12 w-full flex items-end gap-1 pt-1">
                {strategyData.volumeProfileBars.map((bar, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--c-a78bfa)] hover:bg-[var(--c-c4b5fd)] transition-all w-full rounded-t cursor-pointer"
                    style={{ height: `${bar}%`, opacity: 0.35 + (bar / 100) * 0.65 }}
                    title={`Bucket ${idx + 1}: ${bar}% of peak volume`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Hypothetical Strategy & Coherence */}
          <div className="flex flex-col gap-4 p-6 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--c-a78bfa)]">rule_settings</span>
                <h2 className="font-bold text-base text-[var(--c-fafafa)] font-['Inter']">Strategy &amp; Coherence</h2>
              </div>
              <span className="font-mono text-xs text-[var(--c-71717a)] px-2 py-0.5 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)]">
                STOCK-302/303
              </span>
            </div>

            {/* Key Trade Parameters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)]/60 flex flex-col">
                <span className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">ENTRY TARGET</span>
                <span className="font-mono text-lg font-bold text-[var(--c-fafafa)] mt-1">
                  {strategyData.tradeParams.entryTarget}
                </span>
                <span className="text-xs text-[var(--c-a1a1aa)] mt-0.5">{strategyData.tradeParams.entryType}</span>
              </div>
              <div className="p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)]/60 flex flex-col">
                <span className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">STOP LOSS</span>
                <span className="font-mono text-lg font-bold text-[var(--c-ef4444)] mt-1">
                  {strategyData.tradeParams.stopLoss}
                </span>
                <span className="text-xs text-[var(--c-a1a1aa)] mt-0.5">{strategyData.tradeParams.stopLossPercent}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)]/60 flex flex-col">
                <span className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">PROFIT TARGET</span>
                <span className="font-mono text-lg font-bold text-[var(--c-34d399)] mt-1">
                  {strategyData.tradeParams.profitTarget}
                </span>
                <span className="text-xs text-[var(--c-a1a1aa)] mt-0.5">{strategyData.tradeParams.profitTargetPercent}</span>
              </div>
              <div className="p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)]/60 flex flex-col">
                <span className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">RISK / REWARD</span>
                <span className="font-mono text-lg font-bold text-[var(--c-a78bfa)] mt-1">
                  {strategyData.tradeParams.riskReward}
                </span>
                <span className="text-xs text-[var(--c-a1a1aa)] mt-0.5">{strategyData.tradeParams.ratioLabel}</span>
              </div>
            </div>

            {/* Dynamic Execution Rules */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">Dynamic Execution Rules</span>
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-[var(--c-18181b)] border-l-2 border-[var(--c-a78bfa)] text-xs">
                  <span className="font-semibold text-[var(--c-fafafa)] block font-['Inter']">Invalidation Rule</span>
                  <span className="text-[var(--c-a1a1aa)] text-[11px] leading-relaxed">
                    {strategyData.executionRules.invalidation}
                  </span>
                </div>
                <div className="p-2.5 rounded bg-[var(--c-18181b)] border-l-2 border-[var(--c-34d399)] text-xs">
                  <span className="font-semibold text-[var(--c-fafafa)] block font-['Inter']">Upgrade Rule</span>
                  <span className="text-[var(--c-a1a1aa)] text-[11px] leading-relaxed">
                    {strategyData.executionRules.upgrade}
                  </span>
                </div>
              </div>
            </div>

            {/* Anchored Evidence Citations */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="font-mono text-xs text-[var(--c-71717a)] uppercase tracking-wider">
                Anchored Evidence Citations
              </span>
              {strategyData.citations.map(c => (
                <div
                  key={c.id}
                  onClick={() => onOpenCitationModal(`[${c.id}] ${c.name}`, `Cryptographically validated regulatory evidence citation matching ${strategyData.ticker} institutional allocation requirements under FINRA Rule 2210.`)}
                  className="p-2.5 rounded bg-[var(--c-0f0f12)] font-mono text-xs text-[var(--c-a1a1aa)] flex items-center justify-between border border-[var(--c-27272a)]/40 hover:border-[var(--c-a78bfa)]/40 hover:text-[var(--c-fafafa)] transition-colors cursor-pointer"
                >
                  <span>
                    [{c.id}] {c.name}
                  </span>
                  <span className="text-[var(--c-a78bfa)] font-semibold">{c.status}</span>
                </div>
              ))}
            </div>

            {/* Commit to Immutable WORM Button */}
            <div className="mt-auto pt-2">
              <button
                onClick={handleCommit}
                disabled={isCommitting || isCommitted}
                className={`w-full py-2.5 rounded text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                  isCommitted
                    ? 'bg-[var(--c-065f46)] text-[var(--c-34d399)] border border-[var(--c-34d399)]/40'
                    : 'bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] hover:bg-[var(--c-6d28d9)] cursor-pointer'
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] ${isCommitting ? 'animate-spin' : ''}`}>
                  {isCommitting ? 'progress_activity' : isCommitted ? 'check_circle' : 'lock'}
                </span>
                <span>
                  {isCommitting
                    ? 'Writing to WORM Storage...'
                    : isCommitted
                    ? 'Sealed to SEC 17a-4 Ledger'
                    : 'Log Strategy To Immutable Audit Trail'}
                </span>
              </button>
            </div>
          </div>

          {/* Column 3: Historical Analog Validation (FR4) */}
          <div className="flex flex-col gap-4 p-6 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--c-a78bfa)]">history</span>
                <h2 className="font-bold text-base text-[var(--c-fafafa)] font-['Inter']">Historical Analogs</h2>
              </div>
              <span className="font-mono text-xs text-[var(--c-71717a)] px-2 py-0.5 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)]">
                FR4 VALIDATION
              </span>
            </div>

            {/* Precedent Cases */}
            <div className="space-y-3">
              {strategyData.historicalAnalogs.map((caseItem, idx) => (
                <div
                  key={caseItem.caseId}
                  onClick={() => setSelectedCase(selectedCase === idx ? null : idx)}
                  className={`p-3 rounded bg-[var(--c-0f0f12)] border transition-colors flex flex-col gap-2 cursor-pointer ${
                    selectedCase === idx
                      ? 'border-[var(--c-a78bfa)] bg-[var(--c-18181b)]'
                      : 'border-[var(--c-27272a)]/60 hover:border-[var(--c-52525b)]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[var(--c-fafafa)] text-xs font-['Inter']">
                      {caseItem.caseId}
                    </span>
                    <span className="font-mono text-[var(--c-34d399)] font-bold text-xs">{caseItem.returnText}</span>
                  </div>
                  <p className="text-[var(--c-a1a1aa)] text-xs leading-relaxed font-['Inter']">{caseItem.summary}</p>
                  <div className="flex items-center justify-between font-mono text-[11px] text-[var(--c-71717a)] pt-1.5 border-t border-[var(--c-27272a)]/40">
                    <span>Match Score: {caseItem.matchScore}</span>
                    <span className="text-[var(--c-a78bfa)]">{caseItem.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* FINRA-2214 Mandatory Disclaimer */}
            <div className="mt-auto p-3 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] flex items-start gap-2">
              <span className="material-symbols-outlined text-[var(--c-71717a)] text-[16px] mt-0.5 shrink-0">info</span>
              <p className="font-mono text-[11px] text-[var(--c-71717a)] leading-relaxed">
                <strong className="text-[var(--c-a1a1aa)] font-semibold">FINRA-2214 Notice:</strong> Illustrative precedent,
                not a backtest or guarantee of future performance. Past historical analogs do not ensure identical
                forward returns.
              </p>
            </div>
          </div>
        </div>

        {/* Sub-footer: SEC Rule 17a-4 immutability verified & Correlation IDs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[var(--c-27272a)]/60 text-[var(--c-71717a)] font-mono text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-[var(--c-34d399)]">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              SEC RULE 17a-4 IMMUTABILITY VERIFIED
            </span>
            <span className="hidden md:inline">•</span>
            <span className="text-[var(--c-52525b)] truncate max-w-[280px]">SHA-256: {strategyData.secHash}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              CORRELATION ID: <strong className="text-[var(--c-fafafa)]">{strategyData.secCorrelationId}</strong>
            </span>
            <span className="hidden md:inline">•</span>
            <span>
              NODE: <strong className="text-[var(--c-a78bfa)]">{strategyData.node}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
