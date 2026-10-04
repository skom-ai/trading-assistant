/**
 * File: src/components/ScannerView.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.1 — Wire ScannerView to POST /api/v1/scan (live rows,
 *   loading/error, mock fallback).
 * Description:
 *   FR2 deterministic scanner page. Runs the live BFF scan through the shared
 *   typed client (valtideApi.scan) + useAsync loading/error hook, maps the
 *   response rows onto SectorAsset[] via the pure scanMapper, and renders the
 *   master/detail factor view. The mock universe (TECH_SECTOR_ASSETS) is kept
 *   as a typed fallback so the panel never blanks when the BFF is unreachable.
 *   NOTE (Wave-later): the FactorWeightsModal is left as-is — POST /api/v1/scan
 *   accepts only a universe override today, not factor weights, so wiring the
 *   modal to the request would require a new BFF param (out of scope here).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { SectorAsset } from '../types/terminal';
import { TECH_SECTOR_ASSETS } from '../data/mockTerminalData';
import { valtideApi } from '../api/client';
import { useAsync } from '../api/useAsync';
import { scanRowsToSectorAssets, scanDataSource, type ScanDataSource } from '../api/scanMapper';

interface ScannerViewProps {
  onSelectStockForStrategy: (ticker: string) => void;
  onSelectStockForNews: (ticker: string) => void;
  onOpenFactorWeightsModal: () => void;
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  universe: string;
  setUniverse: (u: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onSelectStockForStrategy,
  onSelectStockForNews,
  onOpenFactorWeightsModal,
  selectedTicker,
  setSelectedTicker,
  universe,
  setUniverse,
}) => {
  const [sector, setSector] = useState('Information Technology');
  const [sectorMenuOpen, setSectorMenuOpen] = useState(false);
  const [scanLatency, setScanLatency] = useState('0.00s');

  // Live FR2 scan driven by the shared typed client + loading/error hook.
  const scan = useAsync(valtideApi.scan);
  const isScanning = scan.isLoading;
  const scanError = scan.state.status === 'error' ? scan.state.error : null;

  // Map live rows -> SectorAsset[]; fall back to the typed mock universe when
  // the scan has not succeeded yet or failed (panel never blanks).
  const liveAssets = useMemo<SectorAsset[] | null>(() => {
    if (scan.state.status !== 'success') return null;
    const mapped = scanRowsToSectorAssets(scan.state.data.rows);
    return mapped.length > 0 ? mapped : null;
  }, [scan.state]);
  const assets = liveAssets ?? TECH_SECTOR_ASSETS;

  // Honest data-source badge: the scan feed (Yahoo daily chart) is end-of-day,
  // not intraday, so real rows are LAST CLOSE — never falsely "LIVE". When the
  // scan hasn't produced real rows, we show the typed REFERENCE universe.
  const dataSource: ScanDataSource =
    liveAssets !== null && scan.state.status === 'success'
      ? scanDataSource(scan.state.data.rows)
      : 'reference';
  const SOURCE_META: Record<ScanDataSource, { label: string; icon: string; title: string; live: boolean }> = {
    live: { label: 'LIVE', icon: 'cloud_done', title: 'Rows served from a real-time intraday feed', live: true },
    last_close: { label: 'LAST CLOSE', icon: 'schedule', title: 'Real market data from the daily-close feed (end-of-day, not intraday real-time)', live: true },
    reference: { label: 'REFERENCE', icon: 'cloud_off', title: 'Showing reference universe (live scan unavailable)', live: false },
  };
  const source = SOURCE_META[dataSource];

  // Active inspected stock
  const activeStock = assets.find(a => a.ticker === selectedTicker) || assets[0];

  /** Run the live deterministic scan and record its wall-clock latency. */
  const handleScan = async () => {
    const t0 = performance.now();
    const resp = await scan.run();
    const secs = ((performance.now() - t0) / 1000).toFixed(2);
    if (resp) {
      // Logging aids debugging the UI<->BFF boundary without leaking payloads.
      console.debug(`[ScannerView] live scan: ${resp.rows.length} rows in ${secs}s`);
    }
    setScanLatency(`${secs}s`);
  };

  // Auto-run the live scan once on mount so the page opens with real data.
  useEffect(() => {
    void handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to trigger scan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void handleScan();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sectors = [
    { name: 'Information Technology', constituents: 74, beta: 'β 1.28' },
    { name: 'Communication Services', constituents: 22, beta: 'β 1.12' },
    { name: 'Consumer Discretionary', constituents: 52, beta: 'β 1.18' },
    { name: 'Financials', constituents: 71, beta: 'β 1.05' },
    { name: 'Healthcare', constituents: 64, beta: 'β 0.72' },
    { name: 'Industrials', constituents: 78, beta: 'β 1.02' },
    { name: 'Energy', constituents: 23, beta: 'β 0.88' },
  ];

  return (
    <div className="flex flex-col w-full pb-8">
      {/* LEVEL 1: TOP CONTROL DOCK */}
      <section className="w-full bg-[var(--c-070709)] px-4 py-2.5 border-b border-[var(--c-27272a)]/60">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 max-w-[1600px] mx-auto">
          {/* Left Controls: Universe, Sector, Factor Badge */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Universe Selector Segmented Toggle */}
            <div className="inline-flex items-center p-0.5 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)]">
              <button
                onClick={() => setUniverse('S&P 500')}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                  universe === 'S&P 500'
                    ? 'bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)]'
                    : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)]'
                }`}
              >
                S&amp;P 500 <span className="opacity-75 font-normal ml-0.5 text-[10px]">(v2026.8.2)</span>
              </button>
              <button
                onClick={() => setUniverse('Top 500 Market Cap')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  universe === 'Top 500 Market Cap'
                    ? 'bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] font-semibold'
                    : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)]'
                }`}
              >
                Top 500 Market Cap
              </button>
            </div>

            {/* Sector Selector Dropdown with Beta and Count */}
            <div className="relative">
              <button
                onClick={() => setSectorMenuOpen(!sectorMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-fafafa)] hover:bg-[var(--c-18181b)] transition-colors text-xs font-mono"
              >
                <span className="material-symbols-outlined text-[16px] text-[var(--c-a78bfa)]">category</span>
                <span className="font-semibold">{sector}</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--c-1e1e22)] text-[var(--c-a1a1aa)] text-[10px]">
                  {sectors.find(s => s.name === sector)?.constituents || 74} Constituents
                </span>
                <span className="text-[var(--c-34d399)] font-bold text-[11px]">
                  {sectors.find(s => s.name === sector)?.beta || 'β 1.28'}
                </span>
                <span className="material-symbols-outlined text-[16px] text-[var(--c-71717a)]">
                  {sectorMenuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {sectorMenuOpen && (
                <div className="absolute left-0 mt-1 w-64 bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-lg shadow-xl py-1 z-40">
                  {sectors.map(s => (
                    <button
                      key={s.name}
                      onClick={() => {
                        setSector(s.name);
                        setSectorMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between hover:bg-[var(--c-18181b)] transition-colors ${
                        sector === s.name ? 'text-[var(--c-a78bfa)] bg-[var(--c-18181b)]/60' : 'text-[var(--c-a1a1aa)]'
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-[10px] text-[var(--c-71717a)]">{s.beta}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Factor Weighting Profile Badge */}
            <div 
              onClick={onOpenFactorWeightsModal}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] cursor-pointer hover:border-[var(--c-a78bfa)]/50 transition-colors"
              title="Click to calibrate multi-factor weights"
            >
              <span className="material-symbols-outlined text-[14px] text-[var(--c-34d399)]">tune</span>
              <span className="text-xs text-[var(--c-fafafa)] font-semibold tracking-tight font-mono">Deterministic Canonical Profile</span>
              <span className="text-[11px] text-[var(--c-71717a)] font-mono">P/E Z 25% · Mom 35% · RSI 20% · Vol 20%</span>
              <span className="text-xs text-[var(--c-a78bfa)] font-mono font-semibold">v1.4.0</span>
            </div>
          </div>

          {/* Right Controls: Action & Latency Target */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block font-mono">
              <div className="text-xs text-[var(--c-a1a1aa)]">
                Execution: <span className="text-[var(--c-34d399)] font-bold">{scanLatency}</span>
              </div>
              <div className="text-[10px] text-[var(--c-71717a)] tracking-tight">p95 SLA &lt; 30.0s</div>
            </div>

            {/* Honest data-source indicator: LIVE (real-time) / LAST CLOSE
                (real end-of-day data) / REFERENCE (reference universe). */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-semibold border ${
                source.live
                  ? 'bg-[var(--c-065f46)]/20 text-[var(--c-34d399)] border-[var(--c-065f46)]/40'
                  : 'bg-[var(--c-78350f)]/20 text-[var(--c-fbbf24)] border-[var(--c-78350f)]/40'
              }`}
              title={source.title}
            >
              <span className="material-symbols-outlined text-[13px]">
                {source.icon}
              </span>
              {source.label}
            </span>

            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-xs font-mono font-semibold hover:bg-[var(--c-6d28d9)] transition-all shadow-md active:scale-[0.98] disabled:opacity-75 cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${isScanning ? 'animate-spin' : ''}`}>
                {isScanning ? 'progress_activity' : 'play_arrow'}
              </span>
              <span>{isScanning ? 'Re-computing Matrix...' : 'Run Deterministic Scan'}</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--c-070709)]/60 text-[var(--c-fafafa)] text-[10px]">
                ⌘↵
              </kbd>
            </button>
          </div>
        </div>
      </section>

      {/* ERROR BANNER: live scan failed -> reference universe shown */}
      {scanError && (
        <div className="w-full px-4 md:px-6 pt-4 max-w-[1600px] mx-auto">
          <div
            role="alert"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--c-450a0a)]/40 border border-[var(--c-ef4444)]/40 text-[var(--c-fca5a5)] font-mono text-xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[var(--c-ef4444)]">error</span>
            <span>
              <strong className="text-[var(--c-ef4444)]">{scanError.code}</strong>: {scanError.message} — showing reference universe.
            </span>
          </div>
        </div>
      )}

      {/* LEVEL 2: MASTER-DETAIL SPLIT VIEW */}
      <div className="w-full px-4 md:px-6 pt-6 max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Master Top-10 Ranked List (7 Cols) */}
        <section className="xl:col-span-7 flex flex-col bg-[var(--c-121215)] rounded-xl border border-[var(--c-27272a)] overflow-hidden shadow-lg">
          {/* Panel Header */}
          <div className="px-4 py-3 bg-[var(--c-18181b)] flex items-center justify-between border-b border-[var(--c-27272a)]">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-5 bg-[var(--c-a78bfa)] rounded-sm"></div>
              <h2 className="text-sm font-semibold text-[var(--c-fafafa)] tracking-tight font-['Inter']">
                Master Ranking: Top-10 Sector Assets
              </h2>
              <span className="px-2 py-0.5 rounded bg-[var(--c-1e1e22)] text-[var(--c-a1a1aa)] font-mono text-[11px]">
                FR2: STOCK-200
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--c-71717a)] font-mono text-xs">
              <span>Composite Z-Score</span>
            </div>
          </div>

          {/* Stock List */}
          <div className="flex flex-col divide-y divide-[var(--c-27272a)]/60 overflow-y-auto max-h-[720px]">
            {assets.map((stock) => {
              const isSelected = stock.ticker === activeStock.ticker;
              return (
                <div
                  key={stock.ticker}
                  onClick={() => setSelectedTicker(stock.ticker)}
                  className={`p-4 transition-all cursor-pointer flex items-center justify-between border-l-4 group ${
                    isSelected
                      ? 'bg-[var(--c-18181b)] border-[var(--c-a78bfa)]'
                      : 'bg-[var(--c-121215)] hover:bg-[var(--c-18181b)]/50 border-transparent hover:border-[var(--c-52525b)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono text-xl font-bold w-8 ${
                        isSelected ? 'text-[var(--c-a78bfa)]' : 'text-[var(--c-71717a)]'
                      }`}
                    >
                      {stock.rank}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--c-fafafa)] tracking-tight text-base font-['Inter']">
                          {stock.ticker}
                        </span>
                        <span className="text-[var(--c-71717a)] text-xs font-['Inter']">{stock.name}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 font-mono text-xs text-[var(--c-a1a1aa)]">
                        <span>
                          P/E Z: <strong className={stock.peZPositive ? 'text-[var(--c-ef4444)]' : 'text-[var(--c-34d399)]'}>{stock.peZ}</strong>
                        </span>
                        <span className="text-[var(--c-27272a)]">•</span>
                        <span>
                          Mom: <strong className={stock.momPositive ? 'text-[var(--c-34d399)]' : 'text-[var(--c-ef4444)]'}>{stock.mom}</strong>
                        </span>
                        <span className="text-[var(--c-27272a)]">•</span>
                        <span>
                          RSI: <strong>{stock.rsi}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="font-mono text-sm font-bold text-[var(--c-fafafa)]">{stock.price}</div>
                      <div
                        className={`font-mono text-xs font-semibold ${
                          stock.isPositive ? 'text-[var(--c-34d399)]' : 'text-[var(--c-ef4444)]'
                        }`}
                      >
                        {stock.change}
                      </div>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[var(--c-7c3aed)] text-white'
                          : 'bg-[var(--c-1e1e22)] text-[var(--c-a1a1aa)] group-hover:bg-[var(--c-7c3aed)] group-hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master Footer */}
          <div className="px-4 py-2.5 bg-[var(--c-070709)] flex items-center justify-between text-[var(--c-71717a)] font-mono text-xs border-t border-[var(--c-27272a)]">
            <span>
              PEER GROUP MEDIAN SCORE: <strong className="text-[var(--c-fafafa)]">81.75</strong>
            </span>
            <span className="flex items-center gap-1 text-[var(--c-34d399)]">
              <span className="material-symbols-outlined text-[14px]">verified</span> Zero Look-Ahead Bias
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: Active Inspection Panel (5 Cols) */}
        <section className="xl:col-span-5 flex flex-col gap-4 bg-[var(--c-121215)] rounded-xl border border-[var(--c-27272a)] p-5 shadow-lg">
          {/* Header with Live Ticker Title & Score */}
          <div className="flex items-start justify-between pb-3 border-b border-[var(--c-27272a)]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-bold text-[var(--c-fafafa)] tracking-tight font-['Inter']">
                  {activeStock.ticker}
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] font-mono text-xs font-bold">
                  SCORE {activeStock.score}
                </span>
              </div>
              <div className="text-[var(--c-71717a)] text-sm mt-0.5 font-['Inter']">{activeStock.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xl font-bold text-[var(--c-fafafa)]">{activeStock.price}</div>
              <div
                className={`font-mono text-xs font-semibold ${
                  activeStock.isPositive ? 'text-[var(--c-34d399)]' : 'text-[var(--c-ef4444)]'
                }`}
              >
                {activeStock.change}
              </div>
            </div>
          </div>

          {/* Deep Factor Breakdown Card */}
          <div className="flex flex-col gap-2.5 bg-[var(--c-18181b)] rounded-xl p-4 border border-[var(--c-27272a)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--c-fafafa)] flex items-center gap-1.5 font-['Inter']">
                <span className="material-symbols-outlined text-[var(--c-a78bfa)] text-[18px]">monitoring</span>
                Deep Factor Breakdown
              </span>
              <span className="font-mono text-[11px] text-[var(--c-71717a)]">Canonical Z-Scores</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[var(--c-1e1e22)] border border-[var(--c-27272a)]/60">
                <div className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">Valuation (P/E Z)</div>
                <div
                  className={`font-mono text-sm font-bold mt-0.5 ${
                    activeStock.peZPositive ? 'text-[var(--c-ef4444)]' : 'text-[var(--c-34d399)]'
                  }`}
                >
                  {activeStock.peZ}
                </div>
                <div className="text-[11px] text-[var(--c-71717a)] font-mono mt-0.5">Norm P/E {activeStock.normPe}</div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--c-1e1e22)] border border-[var(--c-27272a)]/60">
                <div className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">Momentum (3/6M)</div>
                <div
                  className={`font-mono text-sm font-bold mt-0.5 ${
                    activeStock.momPositive ? 'text-[var(--c-34d399)]' : 'text-[var(--c-ef4444)]'
                  }`}
                >
                  {activeStock.mom}
                </div>
                <div className="text-[11px] text-[var(--c-71717a)] font-mono mt-0.5">6M {activeStock.mom6M}</div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--c-1e1e22)] border border-[var(--c-27272a)]/60">
                <div className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">RSI (14) Indicator</div>
                <div className="font-mono text-sm font-bold text-[var(--c-fafafa)] mt-0.5">{activeStock.rsi}</div>
                <div className="w-full h-1 bg-[var(--c-121215)] rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[var(--c-a78bfa)] rounded-full"
                    style={{ width: `${Math.min(100, activeStock.rsi)}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[var(--c-1e1e22)] border border-[var(--c-27272a)]/60">
                <div className="font-mono text-[10px] text-[var(--c-71717a)] uppercase">Volume Trend (20D)</div>
                <div className="font-mono text-sm font-bold text-[var(--c-34d399)] mt-0.5">{activeStock.volumeTrend}</div>
                <div className="text-[11px] text-[var(--c-71717a)] font-mono mt-0.5">Institutional Flow</div>
              </div>
            </div>
          </div>

          {/* AI Industry Cluster Assessment Card */}
          <div className="flex flex-col gap-2.5 bg-[var(--c-18181b)] rounded-xl p-4 border border-[var(--c-27272a)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--c-fafafa)] flex items-center gap-1.5 font-['Inter']">
                <span className="material-symbols-outlined text-[var(--c-71717a)] text-[18px]">psychology</span>
                AI Industry Cluster
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--c-065f46)]/30 text-[var(--c-34d399)] font-mono text-[10px] font-bold border border-[var(--c-065f46)]/40">
                CONFIDENCE {activeStock.clusterConf}
              </span>
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--c-fafafa)] mb-1 font-['Inter']">
                {activeStock.cluster}
              </div>
              <p className="text-xs text-[var(--c-a1a1aa)] leading-relaxed font-['Inter']">
                {activeStock.clusterDesc}
              </p>
            </div>
          </div>

          {/* Strategy Trigger Action Buttons */}
          <div className="mt-auto pt-2 space-y-2">
            <button
              onClick={() => onSelectStockForStrategy(activeStock.ticker)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-sm font-semibold hover:bg-[var(--c-6d28d9)] transition-all shadow-lg active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              <span>Execute Strategy Engine for {activeStock.ticker}</span>
            </button>

            <button
              onClick={() => onSelectStockForNews(activeStock.ticker)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--c-18181b)] border border-[var(--c-27272a)] hover:border-[var(--c-a78bfa)]/50 text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] text-xs font-mono transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[var(--c-a78bfa)]">newspaper</span>
              <span>Verify News Catalysts for {activeStock.ticker}</span>
            </button>

            <div className="flex items-center justify-between font-mono text-[11px] text-[var(--c-71717a)] px-1 pt-1">
              <span>FR2.6 Guardrails Active</span>
              <span className="text-[var(--c-34d399)]">Zero-Latency DMA Route</span>
            </div>
          </div>
        </section>
      </div>

      {/* PERSISTENT REGULATORY COMPLIANCE FOOTER */}
      <div className="w-full px-4 md:px-6 mt-8 max-w-[1600px] mx-auto">
        <div className="w-full bg-[var(--c-070709)] p-4 rounded-xl border border-[var(--c-27272a)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-1 text-[var(--c-71717a)] font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              <span className="text-[var(--c-fafafa)] font-bold tracking-wider">
                FINRA RULE 2210 / 2214 &amp; SEC-IA COMPLIANCE MANDATE:
              </span>
            </div>
            <div className="flex items-center gap-2 text-[var(--c-71717a)]">
              <span>
                RECORD RETENTION ID: <code className="text-[var(--c-fafafa)]">REC-202608-SPX-IT-0042</code>
              </span>
              <span>•</span>
              <span>SUPERVISORY JURISDICTION: NY-DESK-4</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-[var(--c-71717a)] leading-relaxed">
            EDUCATIONAL DECISION-SUPPORT TOOL ONLY. Not investment advice, personalized recommendations, or an offer to
            buy or sell securities. Valtide does not execute trades, hold client balances, or manage live portfolios.
            Deterministic ranks, multi-factor scores, and AI tax summaries represent hypothetical mathematical screening
            outputs based on historical and trailing-indicator data feeds. Past statistical behavior is no guarantee of
            future returns.
          </p>
        </div>
      </div>
    </div>
  );
};
