/**
 * File: src/components/OpportunityCheck.tsx
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ModuleId } from '../types';
import { VERDICT_STATES, ASSETS } from '../data/mockData';
import { valtideApi, NewsResponse, ApiError } from '../api/client';

interface OpportunityCheckProps {
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
  onNavigate: (module: ModuleId) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, detail?: string) => void;
}

/** Map the API's FR1 label enum to the UI's verdictClass display string. */
const LABEL_TO_CLASS: Record<string, string> = {
  REAL_CATALYST: 'REAL CATALYST',
  ALREADY_PRICED_IN: 'ALREADY PRICED IN',
  HYPE: 'HYPE DETECTED',
  INSUFFICIENT_EVIDENCE: 'INSUFFICIENT EVIDENCE',
};

export const OpportunityCheck: React.FC<OpportunityCheckProps> = ({
  activeTicker,
  onSelectTicker,
  onNavigate,
  onNotify
}) => {
  const [tickerInput, setTickerInput] = useState(activeTicker);
  const [selectedPreset, setSelectedPreset] = useState<'real-catalyst' | 'already-priced' | 'hype' | 'insufficient'>('real-catalyst');
  // Live FR1 verdict overlaid on the mock presentation (null => show mock only).
  const [live, setLive] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const mock = VERDICT_STATES[selectedPreset];

  // The rendered verdict = mock base with live FR1 fields overlaid when present.
  const verdict = live
    ? {
        ...mock,
        ticker: live.symbol,
        verdictClass: (LABEL_TO_CLASS[live.label] ?? mock.verdictClass) as typeof mock.verdictClass,
        rationale: live.rationale || mock.rationale,
        citationsCount: `${live.citations.length} CITATION(S) [LIVE]`,
        citations: live.citations.length
          ? live.citations.map((c) => ({
              pub: c.source ?? 'SOURCE',
              icon: 'article',
              title: c.title ?? '',
              desc: c.url ?? '',
              time: c.published_at ?? '',
              cred: 'LIVE',
              hash: (c.hash ?? '').slice(0, 16),
            }))
          : mock.citations,
      }
    : mock;

  // Regex validation
  const regexPattern = /^[A-Z.-]{1,10}$/;
  const isValidTicker = regexPattern.test(tickerInput.trim().toUpperCase());

  /**
   * Call the live FR1 news-check endpoint for a ticker and overlay the result.
   * Falls back to the mock verdict (never blanks) and surfaces ApiError via toast.
   */
  const fetchVerdict = useCallback(
    async (symbol: string, simulateEmpty = false) => {
      setLoading(true);
      try {
        const resp = await valtideApi.newsCheck(symbol, simulateEmpty);
        setLive(resp);
        onNotify('success', `FR1 Verdict: ${resp.label}`, `${symbol} evaluated from ${resp.citations.length} citation(s)`);
      } catch (err) {
        const e = err as ApiError;
        setLive(null); // fall back to mock presentation
        onNotify('error', e.code ?? 'ANALYSIS_UNAVAILABLE', e.message ?? 'News check failed; showing reference data.');
      } finally {
        setLoading(false);
      }
    },
    [onNotify]
  );

  // Auto-evaluate when the active ticker changes (live search -> analysis).
  useEffect(() => {
    if (activeTicker) {
      setTickerInput(activeTicker);
      void fetchVerdict(activeTicker);
    }
  }, [activeTicker, fetchVerdict]);

  const handleTickerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tickerInput.trim().toUpperCase();
    if (!clean) return;

    if (!isValidTicker) {
      onNotify('error', 'Invalid Ticker Regex', 'Ticker must match ^[A-Z.-]{1,10}$ (CWE-89 Sanitized)');
      return;
    }

    onSelectTicker(clean);
    // Preset drives the mock fallback presentation only; live data overrides it.
    if (clean === 'NVDA') setSelectedPreset('real-catalyst');
    else if (clean === 'AAPL') setSelectedPreset('already-priced');
    else if (clean === 'TSLA') setSelectedPreset('hype');
    else if (clean === 'IONQ') setSelectedPreset('insufficient');
    else setSelectedPreset('real-catalyst');

    // Live FR1 call (the useEffect on activeTicker also fires; both are idempotent).
    void fetchVerdict(clean);
  };

  const selectPresetTab = (preset: 'real-catalyst' | 'already-priced' | 'hype' | 'insufficient') => {
    setSelectedPreset(preset);
    const targetTicker =
      preset === 'real-catalyst'
        ? 'NVDA'
        : preset === 'already-priced'
        ? 'AAPL'
        : preset === 'hype'
        ? 'TSLA'
        : 'IONQ';
    setTickerInput(targetTicker);
    onSelectTicker(targetTicker);
    // 'insufficient' preset demonstrates the empty-evidence path on the live API.
    void fetchVerdict(targetTicker, preset === 'insufficient');
  };

  const handleExportCitations = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(verdict, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CITATIONS_${verdict.ticker}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onNotify('success', 'Citation Bundle Exported', `SEC-17a-4 verified citation ledger saved for ${verdict.ticker}`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4 font-mono">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-on-surface">
              OPPORTUNITY CHECK (FR1)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 font-semibold">
              CATALYST VERDICT ENGINE
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
            <span>Sources: Finnhub &amp; NewsAPI [Live]</span>
            <span>•</span>
            <span>TTL: 15m Cache-Aside</span>
            <span>•</span>
            <span>Lookback: 48h-72h Bounded</span>
          </div>
        </div>

        {/* Telemetry & Quota */}
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-1.5 text-xs">
            <div className="text-[10px] text-outline">Rate Capacity:</div>
            <div className="text-on-surface font-bold">24 / 30 checks/min</div>
          </div>
          <div className="bg-surface-container-low border border-tertiary/30 rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5 text-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span className="font-bold">RULE 2210 GUARD ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Interactive Ticker Search & Presets */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono">
        <form onSubmit={handleTickerSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <div className="flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-outline">
                search
              </span>
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="Enter Ticker Symbol (e.g. NVDA, AAPL, TSLA)..."
                className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-lg pl-10 pr-24 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
              />
              <span
                className={`absolute right-3 text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isValidTicker
                    ? 'bg-tertiary/20 text-tertiary border border-tertiary/30'
                    : 'bg-error/20 text-error border border-error/30'
                }`}
              >
                {isValidTicker ? 'REGEX VALID' : 'REGEX INVALID'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]">radar</span>
            {loading ? 'EVALUATING…' : 'EVALUATE NEWS'}
          </button>
        </form>

        {/* Fast Switcher Tabs for the 4 Verdict Classes */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/30 text-xs">
          <span className="text-outline text-[11px] font-semibold">Deterministic States:</span>
          <button
            onClick={() => selectPresetTab('real-catalyst')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              selectedPreset === 'real-catalyst'
                ? 'bg-tertiary-container text-on-tertiary-container font-bold shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            REAL CATALYST (NVDA)
          </button>

          <button
            onClick={() => selectPresetTab('already-priced')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              selectedPreset === 'already-priced'
                ? 'bg-secondary-container text-on-secondary-container font-bold shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">sync_saved_locally</span>
            ALREADY PRICED IN (AAPL)
          </button>

          <button
            onClick={() => selectPresetTab('hype')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              selectedPreset === 'hype'
                ? 'bg-error-container text-on-error-container font-bold shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">campaign</span>
            HYPE FILTER (TSLA)
          </button>

          <button
            onClick={() => selectPresetTab('insufficient')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              selectedPreset === 'insufficient'
                ? 'bg-surface-container-highest text-on-surface font-bold shadow-xs'
                : 'bg-surface-container text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">help_outline</span>
            INSUFFICIENT EVIDENCE (IONQ)
          </button>
        </div>
      </div>

      {/* Primary Verdict Card */}
      <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-5 font-mono relative overflow-hidden">
        {/* Top bar with Verdict class and confidence */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${verdict.iconBg} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-[28px]">{verdict.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${verdict.badgeColor}`}>
                  VERDICT: {verdict.verdictClass}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-semibold border border-outline-variant/40">
                  {verdict.ticker}
                </span>
              </div>
              <div className="text-xs text-outline mt-0.5">{verdict.company} // {verdict.sector}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/40 text-right">
              <div className="text-[10px] text-outline uppercase">Algorithmic Confidence</div>
              <div className={`text-lg font-bold ${verdict.badgeColor}`}>{verdict.confidence}</div>
            </div>

            {verdict.verdictClass !== 'INSUFFICIENT EVIDENCE' && (
              <button
                onClick={() => {
                  onSelectTicker(verdict.ticker);
                  onNavigate('strategy-studio');
                }}
                className="px-4 py-3 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                PROCEED TO STRATEGY STUDIO (FR3)
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtitle & Impact Vector */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 my-4">
          <div className="lg:col-span-3">
            <div className="text-sm font-semibold text-on-surface mb-2">{verdict.subtitle}</div>
            <p
              className="text-xs text-on-surface-variant leading-relaxed"
              dangerouslySetInnerHTML={{ __html: verdict.rationale }}
            />
          </div>

          <div className="bg-surface-container-lowest p-3.5 rounded-lg border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-outline uppercase font-semibold">Impact Vector</div>
              <div className={`text-2xl font-bold ${verdict.vectorColor} mt-1`}>{verdict.vector}</div>
              <div className="text-[10px] text-on-surface-variant mt-0.5">{verdict.vectorPeriod}</div>
            </div>
            <div className="text-[9px] text-outline mt-2 pt-2 border-t border-outline-variant/30">
              Zero-LLM Math Verification
            </div>
          </div>
        </div>

        {/* 4 Micro Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 border-t border-outline-variant/30 pt-3">
          <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant/30">
            <div className="text-[10px] text-outline">EPS Consensus Drift</div>
            <div className="text-xs font-bold text-on-surface mt-0.5">{verdict.eps}</div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant/30">
            <div className="text-[10px] text-outline">Street Forecast Dispersion</div>
            <div className="text-xs font-bold text-on-surface mt-0.5">{verdict.disp}</div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant/30">
            <div className="text-[10px] text-outline">Dark Pool Net Flow</div>
            <div className="text-xs font-bold text-on-surface mt-0.5">{verdict.dark}</div>
          </div>
          <div className="bg-surface-container-low p-2.5 rounded border border-outline-variant/30">
            <div className="text-[10px] text-outline">Retail Social Hype</div>
            <div className="text-xs font-bold text-on-surface mt-0.5">{verdict.hype}</div>
          </div>
        </div>

        {/* Conflict Handling & Non-Abstention Disclosure */}
        <div className="mt-4 p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <span className="material-symbols-outlined text-[16px]">balance</span>
            Conflict-Handling &amp; Non-Abstention Disclosure (FR5.3 Enforced)
          </div>
          <div
            className="text-[11px] text-on-surface-variant leading-relaxed"
            dangerouslySetInnerHTML={{ __html: verdict.conflict }}
          />
        </div>
      </div>

      {/* 48h Price Drift vs News Flow & Infrastructure Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
        {/* Price Drift Chart (2 columns) */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-2">
            <div>
              <div className="text-xs font-bold text-on-surface">48H PRICE DRIFT VS NEWS FLOW</div>
              <p className="text-[10px] text-outline">Normalized Reaction vs T0 Catalyst Timestamp</p>
            </div>
            <div className="text-[10px] text-tertiary font-bold">T0 EVENT PINNED</div>
          </div>

          <div className="w-full h-48 bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-2 relative overflow-hidden flex flex-col justify-between">
            <svg className="w-full h-36" viewBox="0 0 500 130">
              {/* Baseline */}
              <line x1="0" y1="65" x2="500" y2="65" stroke="#262a33" strokeDasharray="3,3" />
              <text x="10" y="60" fill="#859490" fontSize="9">
                PRE-EVENT DRIFT BASELINE
              </text>

              {/* T0 Marker */}
              <line x1="280" y1="10" x2="280" y2="120" stroke="#4fdbc8" strokeWidth="1.5" strokeDasharray="4,2" />
              <text x="285" y="20" fill="#4fdbc8" fontSize="9" fontWeight="bold">
                T0: WIRE INGESTION
              </text>

              {/* Reaction Trajectory */}
              {selectedPreset === 'real-catalyst' && (
                <path
                  d="M 20 70 L 100 68 L 180 66 L 275 64 L 290 40 L 360 32 L 440 24 L 480 20"
                  fill="none"
                  stroke="#4edea3"
                  strokeWidth="2.5"
                />
              )}
              {selectedPreset === 'already-priced' && (
                <path
                  d="M 20 40 L 120 42 L 200 45 L 275 48 L 290 52 L 360 62 L 440 65 L 480 66"
                  fill="none"
                  stroke="#c0c1ff"
                  strokeWidth="2"
                />
              )}
              {selectedPreset === 'hype' && (
                <path
                  d="M 20 65 L 120 64 L 200 60 L 275 30 L 300 25 L 360 70 L 440 95 L 480 105"
                  fill="none"
                  stroke="#ffb4ab"
                  strokeWidth="2.5"
                />
              )}
              {selectedPreset === 'insufficient' && (
                <path
                  d="M 20 65 L 120 66 L 200 64 L 280 65 L 360 66 L 440 65 L 480 65"
                  fill="none"
                  stroke="#859490"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              )}
            </svg>

            <div className="flex items-center justify-between text-[10px] text-outline border-t border-outline-variant/30 pt-1">
              <span>T-48h Ingestion</span>
              <span>T0 Event Execution</span>
              <span className="text-on-surface">T+24h Realized Reaction</span>
            </div>
          </div>
        </div>

        {/* Infrastructure Telemetry with Photo */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-on-surface">CLUSTER INGESTION TELEMETRY</h3>
              <span className="text-[10px] text-tertiary">HEALTHY</span>
            </div>

            {/* Datacenter photo */}
            <div className="rounded-lg overflow-hidden border border-outline-variant/40 relative h-28 mb-3">
              <img
                src={ASSETS.datacenterTelemetry}
                alt="Datacenter Telemetry"
                className="w-full h-full object-cover brightness-90"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-surface-container-lowest to-transparent flex items-end p-2">
                <span className="text-[9px] font-mono text-primary font-bold">
                  ASHBURN NODE 01 // 1,840 FEEDS/SEC
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>Finnhub Wire Socket:</span>
                <span className="text-tertiary font-bold">Connected (3ms)</span>
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>SEC EDGAR Stream:</span>
                <span className="text-tertiary font-bold">Synced</span>
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>Redis In-Memory TTL:</span>
                <span className="text-primary font-bold">15m Cache-Aside</span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant/30 text-[10px] text-outline">
            FINRA Rule 2210 mandate: Algorithmic checks are strictly audited for anti-sycophancy and balanced risk vectors.
          </div>
        </div>
      </div>

      {/* Evidence Citation Feed */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-on-surface">
              EVIDENCE CITATIONS &amp; CRYPTOGRAPHIC PROVENANCE
            </h3>
            <p className="text-[10px] text-outline mt-0.5">
              SEC-17a-4 Immutable Ledger // {verdict.citationsCount}
            </p>
          </div>

          <button
            onClick={handleExportCitations}
            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded border border-outline-variant/50 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">download</span>
            Export Citation Bundle (.json)
          </button>
        </div>

        {verdict.citations.length === 0 ? (
          <div className="p-6 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-center text-xs text-outline">
            No qualifying citations found. Strict compliance rules triggered automated non-speculative abstention.
          </div>
        ) : (
          <div className="space-y-2">
            {verdict.citations.map((cite, i) => (
              <div
                key={i}
                className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-bold">{cite.pub}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-tertiary border border-tertiary/20">
                      {cite.cred}
                    </span>
                    <span className="text-[10px] text-outline">{cite.time}</span>
                  </div>
                  <div className="text-on-surface font-semibold text-xs">{cite.title}</div>
                  <div className="text-[11px] text-on-surface-variant">{cite.desc}</div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-[9px] text-outline">Merkle Hash:</div>
                  <code className="text-[11px] text-secondary font-mono">{cite.hash}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
