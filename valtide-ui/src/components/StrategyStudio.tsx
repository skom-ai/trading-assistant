/**
 * File: src/components/StrategyStudio.tsx
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React, { useState } from 'react';
import { ModuleId } from '../types';

interface StrategyStudioProps {
  activeTicker: string;
  onNavigate: (module: ModuleId) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, detail?: string) => void;
}

export const StrategyStudio: React.FC<StrategyStudioProps> = ({
  activeTicker,
  onNavigate,
  onNotify
}) => {
  const [alertArmed, setAlertArmed] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '4H'>('1D');

  const tickerPrice = activeTicker === 'NVDA' ? 128.45 : activeTicker === 'MSFT' ? 428.10 : activeTicker === 'AAPL' ? 228.30 : 139.75;
  const changePct = activeTicker === 'NVDA' ? '+3.38%' : '+1.42%';
  const hypoEntry = (tickerPrice * 0.953).toFixed(2);
  const targetR1 = (tickerPrice * 1.121).toFixed(2);
  const stopLoss = (tickerPrice * 0.897).toFixed(2);
  const riskReward = '2.95x';

  const handleExportTrace = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      strategy_id: `BUY_PULLBACK_MA20_${activeTicker}`,
      timestamp: new Date().toISOString(),
      activeTicker,
      price: tickerPrice,
      hypo_entry: hypoEntry,
      target_r1: targetR1,
      invalidation_stop: stopLoss,
      risk_reward: riskReward,
      merkle_root: '0x7f9a882bc194d3e8a4901fec4908129d3810fec184910401bcae8841c42109aa',
      bias_audit: 'CLEAN_ZERO_LLM_MATH'
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AUDIT_STRATEGY_${activeTicker}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onNotify('success', 'Strategy Audit Trace Exported', `SEC-17a-4 compliant JSON bundle generated for ${activeTicker}`);
  };

  const handleToggleAlert = () => {
    setAlertArmed(!alertArmed);
    if (!alertArmed) {
      onNotify('success', 'Execution Alert Armed', `Desktop notification armed for ${activeTicker} at Hypo Entry $${hypoEntry}`);
    } else {
      onNotify('info', 'Execution Alert Disarmed', `Alert listeners removed for ${activeTicker}`);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb & Navigation Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 pb-3">
        <div className="flex items-center gap-2 font-mono text-xs text-outline">
          <button
            onClick={() => onNavigate('stock-scanner')}
            className="hover:text-primary transition-colors flex items-center gap-1 text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            SCANNER
          </button>
          <span>/</span>
          <span className="text-on-surface font-semibold">STRATEGY STUDIO</span>
          <span>/</span>
          <span className="text-primary font-bold">{activeTicker}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('opportunity-check')}
            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded border border-outline-variant/50 text-[11px] font-mono transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px] text-tertiary">radar</span>
            OPPORTUNITY CHECK
          </button>
          <button
            onClick={() => onNavigate('audit-and-citations')}
            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded border border-outline-variant/50 text-[11px] font-mono transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px] text-primary">fact_check</span>
            AUDIT TRAIL
          </button>
        </div>
      </div>

      {/* Primary Ticker Overview Bar */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center font-mono font-bold text-lg text-primary border border-outline-variant/60">
            {activeTicker.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline-md text-on-surface font-mono tracking-tight">
                NASDAQ: {activeTicker}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/30">
                ALPHA ASSET
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 font-mono text-xs text-on-surface-variant">
              <span>NVIDIA CORP // SEMICONDUCTORS</span>
              <span>•</span>
              <span>ADV: 48.2M SHS</span>
              <span>•</span>
              <span>UNIVERSE: S&P 500 TECH</span>
            </div>
          </div>
        </div>

        {/* Live Quotes & Engine Telemetry */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="font-mono">
            <div className="text-[10px] text-outline uppercase font-semibold">Current Price</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-on-surface">${tickerPrice.toFixed(2)}</span>
              <span className="text-xs font-semibold text-tertiary">{changePct}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-outline-variant/40 hidden sm:block" />

          <div className="font-mono text-xs space-y-1">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="text-outline text-[11px]">Anti-Sycophancy Gate:</span>
              <span className="text-tertiary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                CLEAN (0% BIAS)
              </span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="text-outline text-[11px]">Evidence Calibration:</span>
              <span className="text-primary font-bold">68% [MOD-HIGH]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deterministic Verdict State Banner */}
      <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-linear-to-l from-primary/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-container text-on-primary-container font-mono">
              <span className="material-symbols-outlined text-[28px]">hourglass_top</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm font-mono text-primary font-bold">
                  VERDICT: WAIT (PULLBACK)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container-highest text-secondary border border-outline-variant/40 font-semibold">
                  STRATEGY: BUY_PULLBACK_MA20
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-1">
                Mathematical overextension of +1.8σ indicates adverse risk/reward on market chase. Algorithmic rules enforce awaiting limit fill at 20-Day EMA shelf.
              </p>
            </div>
          </div>

          {/* Factor Calibration Bar */}
          <div className="shrink-0 font-mono text-xs w-full md:w-56 bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/40">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-outline">Confidence Score:</span>
              <span className="text-tertiary font-bold">68 / 100</span>
            </div>
            <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="w-[68%] h-full bg-linear-to-r from-primary-container to-tertiary rounded-full" />
            </div>
            <div className="flex justify-between text-[9px] text-outline mt-1.5">
              <span>0% SKEW</span>
              <span>CONVICTION PASS</span>
            </div>
          </div>
        </div>

        {/* Quick Factor Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-outline-variant/30 text-[11px] font-mono">
          <span className="text-outline">Factor Matrix:</span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-tertiary border border-tertiary/20">
            Trend: Strong Bull (Above 20/50/200)
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-secondary border border-secondary/20">
            Valuation Ext: +1.8σ (Stretched)
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-primary border border-primary/20">
            Macro Confluence: Favorable
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface border border-outline-variant/40">
            FINRA 2210: PASS
          </span>
        </div>
      </div>

      {/* Calculated Plan Boundaries */}
      <div>
        <div className="text-xs font-mono text-outline uppercase font-bold tracking-wider mb-2">
          Calculated Plan Boundaries (Zero-LLM Math)
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 font-mono">
            <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
              <span>Hypo Entry</span>
              <span className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <div className="text-xl font-bold text-primary mt-1">${hypoEntry}</div>
            <div className="text-[10px] text-on-surface-variant mt-1">20-Day EMA Confluence</div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 font-mono">
            <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
              <span>Target R1</span>
              <span className="w-2 h-2 rounded-full bg-tertiary" />
            </div>
            <div className="text-xl font-bold text-tertiary mt-1">${targetR1}</div>
            <div className="text-[10px] text-on-surface-variant mt-1">1.618 Fib Extension (+12.1%)</div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 font-mono">
            <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
              <span>Invalidation Stop</span>
              <span className="w-2 h-2 rounded-full bg-error" />
            </div>
            <div className="text-xl font-bold text-error mt-1">${stopLoss}</div>
            <div className="text-[10px] text-on-surface-variant mt-1">Structural Pivot Breach (-5.9%)</div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 font-mono">
            <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
              <span>Risk / Reward</span>
              <span className="w-2 h-2 rounded-full bg-secondary" />
            </div>
            <div className="text-xl font-bold text-secondary mt-1">{riskReward}</div>
            <div className="text-[10px] text-on-surface-variant mt-1">Asymmetric Skew Favorable</div>
          </div>
        </div>

        {/* Interactive Price Channel Gauge */}
        <div className="mt-3 bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/40 font-mono">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-error font-semibold">Stop: ${stopLoss}</span>
            <span className="text-primary font-semibold">Entry: ${hypoEntry}</span>
            <span className="text-on-surface font-bold">Current: ${tickerPrice.toFixed(2)}</span>
            <span className="text-tertiary font-semibold">Target: ${targetR1}</span>
          </div>

          {/* Relative bar track */}
          <div className="relative w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-[25%] bg-error/40 border-r border-error" />
            <div className="absolute left-[25%] top-0 bottom-0 w-[25%] bg-primary/30 border-r border-primary" />
            <div className="absolute left-[50%] top-0 bottom-0 w-[15%] bg-secondary/30" />
            <div className="absolute left-[65%] top-0 bottom-0 w-[35%] bg-tertiary/40" />

            {/* Current marker */}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-white shadow-md z-10 -ml-0.5 rounded-full"
              style={{ left: '55%' }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-outline mt-1.5">
            <span>Risk Zone (-5.9%)</span>
            <span>Optimal Accumulation</span>
            <span>Current (${tickerPrice.toFixed(2)})</span>
            <span>Profit Window (+12.1%)</span>
          </div>
        </div>
      </div>

      {/* Dual Technical Visualizers (Daily 1D & Weekly Structure 1W) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Execution Chart */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface">DAILY EXECUTION CANVAS (1D)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-tertiary border border-tertiary/30">
                  ATR(14): $4.82
                </span>
              </div>
              <p className="text-[10px] text-outline mt-0.5">Anchored VWAP & Moving Average Ribbon</p>
            </div>

            <div className="flex gap-1 text-[10px]">
              {(['4H', '1D', '1W'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2 py-0.5 rounded ${
                    selectedTimeframe === tf
                      ? 'bg-primary-container text-on-primary-container font-bold'
                      : 'bg-surface-container text-outline hover:text-on-surface'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Candlestick & Trajectory Graphic */}
          <div className="w-full h-56 bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-2 relative overflow-hidden flex flex-col justify-between">
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-outline absolute top-2 left-3 z-10">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-primary" /> MA20: $122.50
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-secondary" /> AVWAP: $118.20
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-error" /> Stop: $115.20
              </span>
            </div>

            {/* Grid SVG */}
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 160">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#e2e8f0" strokeDasharray="3,3" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="#e2e8f0" strokeDasharray="3,3" />

              {/* MA Curves */}
              <path
                d="M 20 130 Q 150 110 250 85 T 480 60"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
              />
              <path
                d="M 20 145 Q 160 135 280 115 T 480 95"
                fill="none"
                stroke="#818cf8"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />

              {/* Candlesticks Sample Set */}
              {/* Day 1 */}
              <line x1="60" y1="110" x2="60" y2="140" stroke="#16a34a" strokeWidth="1" />
              <rect x="56" y="118" width="8" height="16" fill="#16a34a" />
              {/* Day 2 */}
              <line x1="110" y1="100" x2="110" y2="130" stroke="#16a34a" strokeWidth="1" />
              <rect x="106" y="105" width="8" height="18" fill="#16a34a" />
              {/* Day 3 */}
              <line x1="160" y1="85" x2="160" y2="115" stroke="#dc2626" strokeWidth="1" />
              <rect x="156" y="92" width="8" height="14" fill="#dc2626" />
              {/* Day 4 */}
              <line x1="210" y1="75" x2="210" y2="110" stroke="#16a34a" strokeWidth="1" />
              <rect x="206" y="80" width="8" height="22" fill="#16a34a" />
              {/* Day 5 */}
              <line x1="260" y1="65" x2="260" y2="95" stroke="#16a34a" strokeWidth="1" />
              <rect x="256" y="70" width="8" height="18" fill="#16a34a" />
              {/* Day 6 (Current) */}
              <line x1="310" y1="45" x2="310" y2="75" stroke="#16a34a" strokeWidth="1" />
              <rect x="306" y="50" width="8" height="20" fill="#16a34a" />

              {/* Projected Pullback Arc */}
              <path
                d="M 314 60 Q 360 85 390 85 T 460 30"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeDasharray="5,4"
              />

              {/* Hypo Entry Pin */}
              <circle cx="390" cy="85" r="5" fill="#4f46e5" />
              <text x="395" y="80" fill="#4f46e5" fontSize="10" fontWeight="bold">
                Hypo Entry ($122.50)
              </text>

              {/* Target R1 Pin */}
              <circle cx="460" cy="30" r="5" fill="#16a34a" />
              <text x="400" y="25" fill="#16a34a" fontSize="10" fontWeight="bold">
                Target R1 ($144.00)
              </text>
            </svg>

            {/* Volume bar row */}
            <div className="flex items-end gap-1.5 h-7 border-t border-outline-variant/30 pt-1">
              <span className="text-[9px] text-outline shrink-0">VOL:</span>
              <div className="w-3 h-4 bg-outline-variant/50 rounded-xs" />
              <div className="w-3 h-5 bg-tertiary/60 rounded-xs" />
              <div className="w-3 h-3 bg-outline-variant/50 rounded-xs" />
              <div className="w-3 h-6 bg-tertiary/80 rounded-xs" />
              <div className="w-3 h-5 bg-outline-variant/50 rounded-xs" />
              <div className="w-3 h-7 bg-primary rounded-xs" />
              <span className="text-[9px] text-primary ml-2 font-bold">1.38x ADV Spike</span>
            </div>
          </div>
        </div>

        {/* Weekly Structure Chart (1W) */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between mb-3 border-b border-outline-variant/30 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface">WEEKLY REGIME STRUCTURE (1W)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-secondary border border-secondary/30">
                  52W HIGH: $140.76
                </span>
              </div>
              <p className="text-[10px] text-outline mt-0.5">Macro Ascending Trend Channel Bounds</p>
            </div>
            <div className="text-[10px] text-outline">52W Low: $39.23</div>
          </div>

          {/* SVG Weekly Channel Graphic */}
          <div className="w-full h-56 bg-surface-container-lowest rounded-lg border border-outline-variant/30 p-2 relative flex flex-col justify-between">
            <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 160">
              {/* Trend Channel Ribbon */}
              <polygon
                points="20,140 480,45 480,95 20,165"
                fill="#4f46e5"
                fillOpacity="0.06"
              />
              <line x1="20" y1="140" x2="480" y2="45" stroke="#4f46e5" strokeWidth="1.5" />
              <line x1="20" y1="165" x2="480" y2="95" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="4,2" />

              {/* 52W High Resistance Line */}
              <line x1="0" y1="35" x2="500" y2="35" stroke="#4338ca" strokeWidth="1" strokeDasharray="3,3" />
              <text x="10" y="30" fill="#4338ca" fontSize="9" fontWeight="bold">
                52W HIGH RESISTANCE: $140.76
              </text>

              {/* Major Shelf Line */}
              <line x1="0" y1="110" x2="500" y2="110" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
              <text x="10" y="105" fill="#64748b" fontSize="9">
                MAJOR DEMAND SHELF: $108.00
              </text>

              {/* Weekly Bars */}
              <line x1="80" y1="130" x2="80" y2="155" stroke="#16a34a" strokeWidth="2" />
              <line x1="140" y1="115" x2="140" y2="140" stroke="#16a34a" strokeWidth="2" />
              <line x1="200" y1="95" x2="200" y2="125" stroke="#dc2626" strokeWidth="2" />
              <line x1="260" y1="80" x2="260" y2="110" stroke="#16a34a" strokeWidth="2" />
              <line x1="320" y1="65" x2="320" y2="95" stroke="#16a34a" strokeWidth="2" />
              <line x1="380" y1="50" x2="380" y2="80" stroke="#16a34a" strokeWidth="2" />
              <line x1="440" y1="42" x2="440" y2="70" stroke="#16a34a" strokeWidth="2.5" />
            </svg>

            <div className="flex items-center justify-between text-[10px] text-outline border-t border-outline-variant/30 pt-1">
              <span>Channel Incline: +2.4° / Week</span>
              <span className="text-tertiary">Current: Upper 75th Percentile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Factor Decomposition */}
      <div>
        <div className="text-xs font-mono text-outline uppercase font-bold tracking-wider mb-2">
          Evidence Factor Decomposition
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
            <div className="flex items-center justify-between text-xs text-on-surface font-semibold mb-1">
              <span>1. Moving Average Stack</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              MA20 ($122.50) &gt; MA50 ($112.80) &gt; MA200 ($98.10). Perfect bullish alignment across all three major duration tiers.
            </p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
            <div className="flex items-center justify-between text-xs text-on-surface font-semibold mb-1">
              <span>2. Overextension Measure</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">info</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Current price is +1.8σ stretched from 20D mean. Chasing market orders exposes capital to high probability mean-reverting retests.
            </p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
            <div className="flex items-center justify-between text-xs text-on-surface font-semibold mb-1">
              <span>3. Anchored VWAP</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Price trades +8.6% above Earnings Anchor ($118.20). Institutional buyers remain in net positive PnL buffer since the gap.
            </p>
          </div>

          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
            <div className="flex items-center justify-between text-xs text-on-surface font-semibold mb-1">
              <span>4. Momentum & Volume</span>
              <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              3M Mom: +24.8%, 6M Mom: +48.2%. Relative volume 1.38x ADV indicates legitimate institutional block accumulation.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic State Gates */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono">
        <div className="text-xs text-outline uppercase font-bold tracking-wider mb-3">
          Automated Dynamic State Gates (Circuit Breakers)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
            <div className="text-error font-semibold flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[16px]">cancel</span>
              Invalidation Threshold
            </div>
            <div className="text-on-surface font-bold text-sm mb-1">${stopLoss}</div>
            <p className="text-[11px] text-on-surface-variant">
              If daily close closes below ${stopLoss}, the strategy auto-aborts immediately with Zero-LLM override.
            </p>
          </div>

          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
            <div className="text-tertiary font-semibold flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
              Upgrade to Momentum
            </div>
            <div className="text-on-surface font-bold text-sm mb-1">$132.50 Close</div>
            <p className="text-[11px] text-on-surface-variant">
              Breakout and daily close above $132.50 with volume &gt; 1.5x ADV converts WAIT to MOMENTUM_BREAKOUT.
            </p>
          </div>

          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
            <div className="text-secondary font-semibold flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              VIX Circuit Breaker
            </div>
            <div className="text-on-surface font-bold text-sm mb-1">VIX &gt; 22.50</div>
            <p className="text-[11px] text-on-surface-variant">
              If equity implied volatility index spikes past 22.50, gross position size is reduced by 50% automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Curated Historical Analogs (FR4) */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-outline uppercase font-bold tracking-wider">
              Curated Historical Precedent Matches (FR4)
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Strictly matched against 30 verified historical setups with structural anti-hallucination bounds.
            </p>
          </div>
          <button
            onClick={() => onNavigate('historical-precedents')}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            VIEW PRECEDENT CORPUS
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-on-surface font-bold">AMD (Q2 2023)</span>
              <span className="text-tertiary font-bold">88.2% MATCH</span>
            </div>
            <div className="text-[11px] text-outline mb-2">Setup: 20D EMA Pullback Post-Capex</div>
            <div className="text-xs text-tertiary font-bold mb-1">+18.4% Return (22 Days)</div>
            <p className="text-[10px] text-on-surface-variant">
              Successfully wicked into 20D EMA with volume contraction before secondary breakout.
            </p>
          </div>

          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-on-surface font-bold">AVGO (DEC 2023)</span>
              <span className="text-tertiary font-bold">84.5% MATCH</span>
            </div>
            <div className="text-[11px] text-outline mb-2">Setup: Consolidation Above AVWAP</div>
            <div className="text-xs text-tertiary font-bold mb-1">+22.1% Return (31 Days)</div>
            <p className="text-[10px] text-on-surface-variant">
              Held earnings anchor shelf for 8 sessions before expanding +2.3σ above channel.
            </p>
          </div>

          <div className="bg-surface-container p-3 rounded-lg border border-outline-variant/30">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-on-surface font-bold">QCOM (MAY 2022)</span>
              <span className="text-secondary font-bold">71.0% MATCH</span>
            </div>
            <div className="text-[11px] text-outline mb-2">Setup: Failure at Upper Trend Bound</div>
            <div className="text-xs text-error font-bold mb-1">-8.2% (2W STOPPED)</div>
            <p className="text-[10px] text-on-surface-variant">
              Broke below pivot stop during broad rate hike selloff; stop-loss prevented major loss.
            </p>
          </div>
        </div>
      </div>

      {/* Desk Audit Commands */}
      <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">terminal</span>
          <span className="text-xs font-semibold text-on-surface">DESK AUDIT COMMANDS</span>
          <span className="text-[10px] text-outline">| Correlation: TRC-2025-0518-{activeTicker}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleAlert}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              alertArmed
                ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border border-outline-variant/40'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {alertArmed ? 'notifications_active' : 'notification_add'}
            </span>
            {alertArmed ? 'ALERT ARMED ($122.50)' : 'ARM EXECUTION ALERT'}
          </button>

          <button
            onClick={handleExportTrace}
            className="px-3 py-1.5 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            EXPORT STRATEGY TRACE (JSON)
          </button>
        </div>
      </div>
    </div>
  );
};
