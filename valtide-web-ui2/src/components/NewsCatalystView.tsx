/**
 * File: src/components/NewsCatalystView.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W2.2 — Wire NewsCatalystView to POST /api/v1/news-check (live
 *   verdict + citations, loading/error, mock fallback).
 * Description:
 *   FR1 news-catalyst page. Runs the live BFF news-check through the shared
 *   typed client (valtideApi.newsCheck) + useAsync loading/error hook, maps the
 *   response onto the CatalystVerdict display shape via the pure newsMapper,
 *   and keeps the mockTerminalData entry as a typed fallback so the verdict
 *   panel never blanks when the BFF is unreachable. A LIVE/FALLBACK badge marks
 *   the data source, matching the W2.1 ScannerView UX. The 48-72h headlines
 *   feed is not part of the news-check contract, so it continues to render from
 *   the typed reference universe.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { NEWS_CATALYST_DATA } from '../data/mockTerminalData';
import { CatalystVerdict, NewsHeadline } from '../types/terminal';
import { valtideApi } from '../api/client';
import { useAsync } from '../api/useAsync';
import { newsResponseToVerdict } from '../api/newsMapper';

interface NewsCatalystViewProps {
  onSelectStockForStrategy: (ticker: string) => void;
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  onOpenCitationModal: (title: string, text: string) => void;
}

export const NewsCatalystView: React.FC<NewsCatalystViewProps> = ({
  onSelectStockForStrategy,
  selectedTicker,
  setSelectedTicker,
  onOpenCitationModal
}) => {
  const [inputTicker, setInputTicker] = useState(selectedTicker || 'NVDA');
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'SEC' | 'TERMINAL' | 'HYPE'>('ALL');

  const currentTickerUpper = (selectedTicker || 'NVDA').toUpperCase();
  // Typed reference entry: supplies the verdict fallback AND the headlines feed
  // (the news-check contract carries no headlines).
  const currentData = NEWS_CATALYST_DATA[currentTickerUpper] || NEWS_CATALYST_DATA['NVDA'];

  // Live FR1 news-check driven by the shared typed client + loading/error hook.
  const news = useAsync(valtideApi.newsCheck);
  const isScanning = news.isLoading;
  const newsError = news.state.status === 'error' ? news.state.error : null;

  // Rendered verdict = live FR1 overlaid on the typed mock base when the call
  // succeeded for THIS ticker; else the reference verdict (panel never blanks).
  const verdict = useMemo<CatalystVerdict>(() => {
    if (
      news.state.status === 'success' &&
      news.state.data.symbol.toUpperCase() === currentTickerUpper
    ) {
      return newsResponseToVerdict(news.state.data, currentData.verdict);
    }
    return currentData.verdict;
  }, [news.state, currentTickerUpper, currentData]);
  const isLive = verdict !== currentData.verdict;

  /** Run the live FR1 news-check for a ticker, syncing the selected ticker. */
  const handleScan = (tickerToScan?: string) => {
    const target = (tickerToScan || inputTicker).trim().toUpperCase();
    if (!target) return;
    setSelectedTicker(target);
    setInputTicker(target);
    // Logging aids debugging the UI<->BFF boundary without leaking payloads.
    console.debug(`[NewsCatalystView] live news-check: ${target}`);
    void news.run(target);
  };

  // Auto-run the live news-check once on mount so the page opens with real data.
  useEffect(() => {
    void news.run(currentTickerUpper);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHeadlines = currentData.headlines.filter(h => {
    if (feedFilter === 'SEC') return h.sourceType === 'SEC FILING';
    if (feedFilter === 'TERMINAL') return h.sourceType === 'BLOOMBERG' || h.sourceType === 'REUTERS';
    if (feedFilter === 'HYPE') return h.sourceType === 'SOCIAL / HYPE';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Hero / Header context section */}
      <div className="w-full px-4 md:px-6 py-8 bg-[var(--c-0f0f12)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--c-27272a)]/60">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-[var(--c-7c3aed)]/20 text-[var(--c-a78bfa)] uppercase tracking-wider font-semibold border border-[var(--c-7c3aed)]/30">
              FR1-CATALYST-ENGINE
            </span>
            <span className="text-[var(--c-52525b)] text-xs">|</span>
            <span className="text-[var(--c-a1a1aa)] font-mono text-xs">NLP INTEL PIPELINE v4.2</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--c-fafafa)] font-['Inter']">
            News Catalyst &amp; Sentiment Verification
          </h1>
          <p className="text-sm text-[var(--c-a1a1aa)] leading-relaxed">
            Real-time LLM-assisted verification and sentiment analysis scanning 48-72 hour global newswires,
            SEC filings, and regulatory feeds to filter algorithmic hype from true market-moving catalysts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-mono text-[var(--c-71717a)] uppercase">Active Watchlist</span>
            <span className="text-lg font-bold text-[var(--c-fafafa)] flex items-center gap-2 font-['Inter']">
              <span className="material-symbols-outlined text-[var(--c-a78bfa)] text-[20px]">monitoring</span>
              1,482 Tickers Indexed
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 md:px-6 py-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* 1. Ticker Input & Validation Box */}
        <div className="w-full bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--c-a78bfa)]/10 flex items-center justify-center text-[var(--c-a78bfa)] border border-[var(--c-a78bfa)]/20">
                <span className="material-symbols-outlined text-[24px]">search</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--c-fafafa)] font-['Inter']">Target Asset Discovery</h2>
                <p className="text-xs text-[var(--c-a1a1aa)]">
                  Input US-listed equities for instantaneous multi-source sentiment &amp; catalyst cross-examination.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[var(--c-065f46)]/20 text-[var(--c-34d399)] text-xs font-mono flex items-center gap-1.5 border border-[var(--c-065f46)]/40">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-34d399)] animate-pulse"></span>
                SEC EDGAR Feed: Synced
              </span>
              <span className="px-2.5 py-1 rounded bg-[var(--c-18181b)] text-[var(--c-a1a1aa)] text-xs font-mono border border-[var(--c-27272a)]">
                Allowlist: S&amp;P 500 / Nasdaq-100
              </span>
            </div>
          </div>

          {/* Search bar & Quick Tickers */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--c-71717a)]">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
              </span>
              <input
                type="text"
                value={inputTicker}
                onChange={e => setInputTicker(e.target.value.toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleScan();
                }}
                placeholder="Enter ticker symbol (e.g. AAPL, TSLA, MSFT)..."
                className="w-full pl-10 pr-24 py-2.5 bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] text-[var(--c-fafafa)] font-mono text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--c-a78bfa)] uppercase placeholder:normal-case placeholder:text-[var(--c-52525b)]"
              />
              <div className="absolute inset-y-0 right-1.5 flex items-center gap-1.5">
                {inputTicker && (
                  <button
                    onClick={() => setInputTicker('')}
                    className="px-2 py-1 text-[var(--c-71717a)] hover:text-[var(--c-fafafa)] text-xs font-mono transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => handleScan()}
                  disabled={isScanning}
                  className="px-3.5 py-1.5 bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] font-mono text-xs rounded hover:bg-[var(--c-6d28d9)] transition-all flex items-center gap-1 shadow-sm font-semibold cursor-pointer disabled:opacity-75"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isScanning ? 'animate-spin' : ''}`}>
                    {isScanning ? 'progress_activity' : 'bolt'}
                  </span>
                  <span>{isScanning ? 'Scanning' : 'Scan'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[var(--c-71717a)] text-xs font-mono whitespace-nowrap">Quick Select:</span>
              {[
                { ticker: 'NVDA', chg: '+4.2%', positive: true },
                { ticker: 'AAPL', chg: '+0.8%', positive: true },
                { ticker: 'TSLA', chg: '-1.4%', positive: false },
                { ticker: 'MSFT', chg: '+1.9%', positive: true },
              ].map(q => (
                <button
                  key={q.ticker}
                  onClick={() => handleScan(q.ticker)}
                  className={`px-3 py-1.5 rounded bg-[var(--c-18181b)] border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                    currentTickerUpper === q.ticker
                      ? 'border-[var(--c-a78bfa)] text-[var(--c-fafafa)]'
                      : 'border-[var(--c-27272a)] text-[var(--c-a1a1aa)] hover:border-[var(--c-52525b)] hover:text-[var(--c-fafafa)]'
                  }`}
                >
                  <span className="text-[var(--c-a78bfa)] font-bold">{q.ticker}</span>
                  <span className={q.positive ? 'text-[var(--c-34d399)]' : 'text-[var(--c-ef4444)]'}>{q.chg}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid: LLM Catalyst Verdict & Headlines Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 2. LLM Catalyst Verdict Panel (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="w-full bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-xl p-6 flex flex-col gap-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--c-7c3aed)]/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--c-a78bfa)] text-[22px]">psychology</span>
                  <h3 className="text-base font-semibold text-[var(--c-fafafa)] font-['Inter']">LLM Catalyst Verdict</h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* Live vs mock-fallback data-source indicator (matches W2.1 UX) */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-[10px] font-semibold border ${
                      isLive
                        ? 'bg-[var(--c-065f46)]/20 text-[var(--c-34d399)] border-[var(--c-065f46)]/40'
                        : 'bg-[var(--c-78350f)]/20 text-[var(--c-fbbf24)] border-[var(--c-78350f)]/40'
                    }`}
                    title={isLive ? 'Verdict served live from /api/v1/news-check' : 'Showing reference verdict (live news-check unavailable)'}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isLive ? 'cloud_done' : 'cloud_off'}
                    </span>
                    {isLive ? 'LIVE' : 'FALLBACK'}
                  </span>
                  <span className="font-mono text-xs text-[var(--c-a78bfa)] bg-[var(--c-7c3aed)]/10 border border-[var(--c-7c3aed)]/20 px-2.5 py-1 rounded">
                    Conf: {verdict.confidence}
                  </span>
                </div>
              </div>

              {/* ERROR BANNER: live news-check failed -> reference verdict shown */}
              {newsError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--c-450a0a)]/40 border border-[var(--c-ef4444)]/40 text-[var(--c-fca5a5)] font-mono text-[11px]"
                >
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span>
                    {newsError.code}: live news-check unavailable — showing reference verdict.
                  </span>
                </div>
              )}

              {/* Classification Status Badge */}
              <div className="p-4 rounded-lg bg-[var(--c-065f46)]/10 border border-[var(--c-065f46)]/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--c-71717a)] uppercase tracking-wider">Classification Status</span>
                  <span className="material-symbols-outlined text-[var(--c-34d399)] text-[18px]">verified</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded bg-[var(--c-065f46)] text-[var(--c-34d399)] font-mono text-xs font-bold tracking-wide border border-[var(--c-34d399)]/40">
                    {verdict.status}
                  </span>
                  <span className="text-xs text-[var(--c-34d399)] font-medium font-['Inter']">
                    {verdict.statusLabel}
                  </span>
                </div>
              </div>

              {/* Synthesized Rationale */}
              <div className="flex flex-col gap-1.5">
                <h4 className="text-xs font-mono text-[var(--c-fafafa)] uppercase tracking-wider">Synthesized Rationale</h4>
                <p className="text-sm text-[var(--c-a1a1aa)] leading-relaxed font-['Inter']">
                  {verdict.rationale}
                </p>
              </div>

              {/* Verified Evidence Citations */}
              <div className="flex flex-col gap-2.5 pt-1">
                <h4 className="text-xs font-mono text-[var(--c-fafafa)] uppercase tracking-wider">Verified Evidence Citations</h4>
                <div className="flex flex-col gap-2">
                  {verdict.citations.map(cit => (
                    <div
                      key={cit.id}
                      onClick={() => onOpenCitationModal(cit.title, cit.textExcerpt || cit.title)}
                      className="p-3 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] hover:border-[var(--c-a78bfa)]/40 hover:bg-[var(--c-18181b)] transition-colors flex items-start gap-3 cursor-pointer group"
                    >
                      <span className="w-5 h-5 rounded-full bg-[var(--c-7c3aed)]/20 text-[var(--c-a78bfa)] font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-[var(--c-7c3aed)]/30">
                        {cit.id}
                      </span>
                      <div className="flex flex-col gap-0.5 flex-1">
                        <span className="text-xs font-medium text-[var(--c-fafafa)] group-hover:text-[var(--c-a78bfa)] transition-colors font-['Inter']">
                          {cit.title}
                        </span>
                        <span className="text-[11px] text-[var(--c-71717a)] font-mono">
                          Source: {cit.source} • {cit.timeAgo}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-[var(--c-52525b)] group-hover:text-[var(--c-a78bfa)]">
                        visibility
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trigger Strategy Engine Link */}
              <div className="pt-2">
                <button
                  onClick={() => onSelectStockForStrategy(currentTickerUpper)}
                  className="w-full py-2.5 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-xs font-semibold hover:bg-[var(--c-6d28d9)] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>Formulate Strategy For {currentTickerUpper}</span>
                </button>
              </div>

              {/* Metadata Footer */}
              <div className="pt-3 border-t border-[var(--c-27272a)] flex items-center justify-between text-xs text-[var(--c-71717a)] font-mono">
                <span>Model: {verdict.model}</span>
                <span>Latency: {verdict.latencyMs}ms</span>
              </div>
            </div>
          </div>

          {/* 3. 48-72h Credible Headlines Feed (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="w-full bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-xl p-6 flex flex-col gap-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--c-a78bfa)] text-[22px]">feed</span>
                  <h3 className="text-base font-semibold text-[var(--c-fafafa)] font-['Inter']">
                    48–72h Credible Headlines Feed
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--c-34d399)] animate-ping"></span>
                  <span className="text-xs font-mono text-[var(--c-34d399)] font-medium">Live Wire Stream</span>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-[var(--c-a1a1aa)]">
                <p>Real-time chronologically sorted newswire items filtered through institutional credibility heuristics.</p>
                <div className="flex items-center gap-1 bg-[var(--c-18181b)] p-1 rounded border border-[var(--c-27272a)] font-mono text-[11px]">
                  {(['ALL', 'SEC', 'TERMINAL', 'HYPE'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => setFeedFilter(filter)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        feedFilter === filter
                          ? 'bg-[var(--c-7c3aed)] text-white font-semibold'
                          : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headlines Stream */}
              <div className="flex flex-col gap-3.5">
                {filteredHeadlines.map(headline => {
                  const isHype = headline.sourceType === 'SOCIAL / HYPE';
                  const isSec = headline.sourceType === 'SEC FILING';
                  const isBloomberg = headline.sourceType === 'BLOOMBERG';

                  return (
                    <div
                      key={headline.id}
                      onClick={() => onOpenCitationModal(headline.title, `Full wire dispatch transcript for ${headline.wireName} regarding ${currentTickerUpper}. Certified for algorithmic validation under FINRA 2210.`)}
                      className={`p-4 rounded-lg bg-[var(--c-0f0f12)] border transition-all flex flex-col gap-2.5 group cursor-pointer ${
                        isHype
                          ? 'border-[var(--c-3b1111)]/60 opacity-80 hover:opacity-100 hover:border-[var(--c-ef4444)]/40'
                          : 'border-[var(--c-27272a)] hover:border-[var(--c-a78bfa)]/40 hover:bg-[var(--c-18181b)]/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider ${
                              isSec
                                ? 'bg-[var(--c-7c3aed)]/20 text-[var(--c-a78bfa)] border border-[var(--c-7c3aed)]/30'
                                : isBloomberg
                                ? 'bg-[var(--c-18181b)] text-[var(--c-fafafa)] border border-[var(--c-27272a)]'
                                : isHype
                                ? 'bg-[var(--c-3b1111)] text-[var(--c-ef4444)] border border-[var(--c-ef4444)]/30'
                                : 'bg-[var(--c-27272a)] text-[var(--c-a1a1aa)]'
                            }`}
                          >
                            {headline.sourceType}
                          </span>
                          <span className="text-xs text-[var(--c-71717a)] font-['Inter']">{headline.wireName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-[var(--c-71717a)]">
                          <span>{headline.timestampUtc}</span>
                          <span className="text-[var(--c-a78bfa)] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            View <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </span>
                        </div>
                      </div>

                      <h4 className="text-sm font-medium text-[var(--c-fafafa)] group-hover:text-[var(--c-a78bfa)] transition-colors leading-snug font-['Inter']">
                        {headline.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-[var(--c-a1a1aa)] font-mono flex-wrap">
                        <span>
                          Impact Score:{' '}
                          <strong className={isHype ? 'text-[var(--c-ef4444)]' : 'text-[var(--c-34d399)]'}>
                            {headline.impactScore}
                          </strong>
                        </span>
                        <span className="text-[var(--c-27272a)]">•</span>
                        <span>
                          Sentiment:{' '}
                          <strong
                            className={
                              headline.sentimentType === 'positive'
                                ? 'text-[var(--c-34d399)]'
                                : headline.sentimentType === 'speculative'
                                ? 'text-[var(--c-a1a1aa)]'
                                : 'text-[var(--c-a78bfa)]'
                            }
                          >
                            {headline.sentiment}
                          </strong>
                        </span>
                        {!isHype && (
                          <>
                            <span className="text-[var(--c-27272a)]">•</span>
                            <span>Verified Entity Match: {headline.entityMatch}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Compliance & Disclaimers Footer Card */}
        <div className="w-full bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[var(--c-065f46)]/20 border border-[var(--c-065f46)]/30 flex items-center justify-center text-[var(--c-34d399)] shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
            </div>
            <div className="flex flex-col gap-1 max-w-4xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--c-fafafa)] font-bold">
                  FINRA Rule 2210 &amp; SEC-IA Compliance Mandate
                </span>
                <span className="text-[var(--c-52525b)]">•</span>
                <span className="text-[var(--c-34d399)] text-xs font-mono">Active Guardrails Enforced</span>
              </div>
              <p className="text-xs text-[var(--c-a1a1aa)] leading-relaxed font-['Inter']">
                This module provides automated decision-support intelligence and natural language catalyst verification.
                Data presented does not constitute formal investment advice, financial planning, or a binding
                recommendation to buy or sell securities. All algorithmic scores are subject to real-time volatility and
                verification constraints in compliance with regulatory oversight standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3 py-1.5 rounded bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] font-mono text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--c-34d399)]"></span>
              Audit Hash: 0x8F9C...3B2A
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
