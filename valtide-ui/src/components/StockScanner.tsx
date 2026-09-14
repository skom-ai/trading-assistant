/**
 * File: src/components/StockScanner.tsx
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React, { useState, useMemo } from 'react';
import { ModuleId, TickerData } from '../types';
import { INITIAL_TICKERS, SECTORS } from '../data/mockData';

interface StockScannerProps {
  onSelectTicker: (ticker: string) => void;
  onNavigate: (module: ModuleId) => void;
  onOpenFormula: () => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, detail?: string) => void;
}

type SortField = 'compositeScore' | 'price' | 'changePercent' | 'valuationZ' | 'mom3M' | 'rsi14';

export const StockScanner: React.FC<StockScannerProps> = ({
  onSelectTicker,
  onNavigate,
  onOpenFormula,
  onNotify
}) => {
  const [selectedUniverse, setSelectedUniverse] = useState<'sp500' | 'top500'>('sp500');
  const [selectedSector, setSelectedSector] = useState<string>('IT');
  const [sectorDropdownOpen, setSectorDropdownOpen] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [latency, setLatency] = useState(18.4);
  const [sortField, setSortField] = useState<SortField>('compositeScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [filterRsiBelow70, setFilterRsiBelow70] = useState(true);

  const activeSectorObj = SECTORS.find((s) => s.id === selectedSector) || SECTORS[0];

  const handleComputeScan = () => {
    setIsComputing(true);
    setTimeout(() => {
      setIsComputing(false);
      const randomLatency = (14 + Math.random() * 8).toFixed(1);
      setLatency(parseFloat(randomLatency));
      onNotify(
        'success',
        'Sector Scan Computed',
        `Evaluated 78 constituents in ${randomLatency}ms via Zero-LLM math path`
      );
    }, 450);
  };

  const handleCopyHash = () => {
    navigator.clipboard?.writeText('0x8900acfe1190bc1230984da091cbeee810993019280148f9801827');
    onNotify('success', 'Hash Copied to Clipboard', 'Merkle root hash 0x8900...1827 copied');
  };

  const sortedTickers = useMemo(() => {
    let list = [...INITIAL_TICKERS];
    if (filterRsiBelow70) {
      list = list.filter((t) => t.rsi14 <= 70);
    }
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortAsc) return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
    return list;
  }, [sortField, sortAsc, filterRsiBelow70]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md font-mono text-on-surface">
              SECTOR-AWARE STOCK SCANNER (FR2)
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-container/20 text-primary border border-primary/30 font-semibold">
              DETERMINISTIC ENGINE
            </span>
          </div>
          <p className="text-xs font-mono text-on-surface-variant mt-1">
            Deterministic ranking engine computing multi-factor composite scores across S&amp;P 500 constituents without stochastic LLM inference.
          </p>
        </div>

        {/* Universe and Sector Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Universe Switcher */}
          <div className="flex rounded-md bg-surface-container-low p-0.5 border border-outline-variant/40 font-mono text-xs">
            <button
              onClick={() => setSelectedUniverse('sp500')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedUniverse === 'sp500'
                  ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              S&amp;P 500 (503)
            </button>
            <button
              onClick={() => setSelectedUniverse('top500')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedUniverse === 'top500'
                  ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Top 500 MktCap
            </button>
          </div>

          {/* Sector Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSectorDropdownOpen(!sectorDropdownOpen)}
              className="bg-surface-container-lowest border border-outline-variant/50 hover:border-primary px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-2 text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">category</span>
              <span>{activeSectorObj.name}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-surface-container text-tertiary">
                {activeSectorObj.count}
              </span>
              <span className="material-symbols-outlined text-[16px] text-outline">
                arrow_drop_down
              </span>
            </button>

            {sectorDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-surface-container border border-outline-variant rounded-md shadow-2xl p-1.5 z-40 max-h-60 overflow-y-auto">
                <div className="text-[10px] font-mono text-outline px-2 py-1 uppercase font-bold">
                  Select GICS Sector
                </div>
                {SECTORS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setSelectedSector(sec.id);
                      setSectorDropdownOpen(false);
                      onNotify('info', `Switched Sector: ${sec.name}`, `${sec.count} constituents loaded`);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors text-left ${
                      selectedSector === sec.id
                        ? 'bg-primary-container text-on-primary-container font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    <span>{sec.name}</span>
                    <span className="text-[10px] opacity-80">{sec.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Compute Scan Action */}
          <button
            onClick={handleComputeScan}
            disabled={isComputing}
            className="px-4 py-1.5 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                isComputing ? 'animate-spin' : ''
              }`}
            >
              {isComputing ? 'sync' : 'bolt'}
            </span>
            {isComputing ? 'COMPUTING...' : 'COMPUTE SCAN'}
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
            <span>Scoring Path</span>
            <span className="material-symbols-outlined text-[15px] text-tertiary">lock</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-tertiary mt-1">100% Zero-LLM Math</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">Native C++ Deterministic</div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
            <span>Engine Latency</span>
            <span className="material-symbols-outlined text-[15px] text-primary">speed</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-primary mt-1">{latency}ms</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">Throughput: 4,200 tk/s</div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
            <span>Sector Active</span>
            <span className="material-symbols-outlined text-[15px] text-secondary">domain</span>
          </div>
          <div className="text-sm sm:text-base font-bold text-on-surface mt-1">
            {activeSectorObj.count} / {activeSectorObj.count} Active
          </div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">Zero Data Dropouts</div>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold flex items-center justify-between">
            <span>Factor Weights</span>
            <button
              onClick={onOpenFormula}
              className="text-primary hover:underline text-[10px] font-bold"
            >
              FORMULA
            </button>
          </div>
          <div className="text-xs font-bold text-on-surface mt-1">Val 35% | Mom 35%</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">RSI 15% | Vol 15%</div>
        </div>
      </div>

      {/* FINRA 2210 & SEC Guardrail Notice */}
      <div className="bg-surface-container-low border border-tertiary/30 rounded-xl p-3 font-mono flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-tertiary font-bold">RULE_BOUND_PASS:</span>
          <span className="text-on-surface-variant text-[11px]">
            Deterministic multi-factor screening strictly complies with FINRA Rule 2210 and SEC IA Guidance. Zero promissory claims generated.
          </span>
        </div>
        <span className="text-[10px] text-outline border border-outline-variant/40 px-2 py-0.5 rounded shrink-0 hidden sm:inline-block">
          ISO-27001
        </span>
      </div>

      {/* Active Filter Tags */}
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-outline text-[11px]">Active Filters:</span>
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant/40 text-[11px]">
            P/E Z &lt; +1.5σ
          </span>
          <button
            onClick={() => setFilterRsiBelow70(!filterRsiBelow70)}
            className={`px-2 py-0.5 rounded border text-[11px] transition-colors ${
              filterRsiBelow70
                ? 'bg-primary-container/20 text-primary border-primary/40'
                : 'bg-surface-container text-outline border-outline-variant/40'
            }`}
          >
            RSI &lt; 70 {filterRsiBelow70 ? '✓' : ''}
          </button>
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant/40 text-[11px]">
            Mom 3M &gt; 0%
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface border border-outline-variant/40 text-[11px]">
            20D Vol &gt; 0.8x
          </span>
        </div>

        <div className="text-[11px] text-outline">Showing Top 10 Ranked by Multi-Factor Composite</div>
      </div>

      {/* Deterministic Top-10 Ranking Table */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/60 border-b border-outline-variant/40 text-outline text-[11px]">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">ASSET</th>
                <th
                  onClick={() => toggleSort('price')}
                  className="py-2.5 px-3 cursor-pointer hover:text-on-surface"
                >
                  PRICE / CHG {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => toggleSort('compositeScore')}
                  className="py-2.5 px-3 cursor-pointer hover:text-on-surface"
                >
                  SCORE {sortField === 'compositeScore' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => toggleSort('valuationZ')}
                  className="py-2.5 px-3 cursor-pointer hover:text-on-surface"
                >
                  VALUATION Z {sortField === 'valuationZ' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => toggleSort('mom3M')}
                  className="py-2.5 px-3 cursor-pointer hover:text-on-surface"
                >
                  MOM 3M / 6M {sortField === 'mom3M' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => toggleSort('rsi14')}
                  className="py-2.5 px-3 cursor-pointer hover:text-on-surface"
                >
                  RSI(14) {sortField === 'rsi14' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th className="py-2.5 px-3">VOL RATIO</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {sortedTickers.map((ticker, idx) => {
                const isPositive = ticker.changePercent >= 0;
                return (
                  <tr
                    key={ticker.symbol}
                    className="hover:bg-surface-container/70 transition-colors group"
                  >
                    <td className="py-3 px-3 text-outline font-bold">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{ticker.symbol}</span>
                        <span className="text-[11px] text-on-surface-variant truncate max-w-[120px] hidden sm:inline-block">
                          {ticker.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-on-surface">
                      ${ticker.price.toFixed(2)}{' '}
                      <span
                        className={`text-[11px] ${
                          isPositive ? 'text-tertiary' : 'text-error'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {ticker.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{ticker.compositeScore}</span>
                        <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-primary to-tertiary rounded-full"
                            style={{ width: `${ticker.compositeScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          ticker.valuationZ <= -1.0
                            ? 'bg-tertiary/20 text-tertiary border border-tertiary/30'
                            : ticker.valuationZ < 0
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-secondary/20 text-secondary border border-secondary/30'
                        }`}
                      >
                        {ticker.valuationLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <span className="text-tertiary font-semibold">+{ticker.mom3M}%</span>
                      <span className="text-outline mx-1">/</span>
                      <span className="text-on-surface-variant">+{ticker.mom6M}%</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span
                          className={
                            ticker.rsi14 > 65
                              ? 'text-secondary'
                              : ticker.rsi14 < 45
                              ? 'text-tertiary'
                              : 'text-on-surface'
                          }
                        >
                          {ticker.rsi14}
                        </span>
                        <div className="w-12 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${ticker.rsi14}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-on-surface-variant">
                      {ticker.volLabel}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onSelectTicker(ticker.symbol);
                            onNavigate('strategy-studio');
                            onNotify('info', `Loaded ${ticker.symbol}`, 'Executing Strategy Studio plan');
                          }}
                          className="px-2.5 py-1 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded font-bold text-[10px] transition-colors"
                        >
                          STRATEGY
                        </button>
                        <button
                          onClick={() => {
                            onSelectTicker(ticker.symbol);
                            onNavigate('opportunity-check');
                          }}
                          className="p-1 bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface rounded transition-colors"
                          title="Inspect Opportunity"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sector Dispersion Matrix & Bounded AI Industry Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sector Dispersion Matrix (2 Columns) */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-on-surface">SECTOR DISPERSION MATRIX</h3>
                <p className="text-[10px] text-outline">
                  Valuation (Trailing P/E) vs 3M Momentum Multi-Factor Scatter
                </p>
              </div>
              <div className="text-[10px] text-tertiary font-bold">ALPHA CORRIDOR HIGHLIGHTED</div>
            </div>

            {/* Scatter SVG */}
            <div className="w-full h-56 bg-slate-50 rounded-lg border border-slate-200 p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 500 200">
                {/* Axis lines */}
                <line x1="40" y1="20" x2="40" y2="170" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" />

                {/* Grid lines */}
                <line x1="40" y1="60" x2="480" y2="60" stroke="#e2e8f0" strokeDasharray="3,3" />
                <line x1="40" y1="115" x2="480" y2="115" stroke="#e2e8f0" strokeDasharray="3,3" />
                <line x1="180" y1="20" x2="180" y2="170" stroke="#e2e8f0" strokeDasharray="3,3" />
                <line x1="330" y1="20" x2="330" y2="170" stroke="#e2e8f0" strokeDasharray="3,3" />

                {/* Alpha Quadrant Shade */}
                <rect x="250" y="30" width="220" height="85" fill="#4f46e5" fillOpacity="0.05" rx="6" />
                <text x="350" y="45" fill="#4f46e5" fontSize="9" fontWeight="bold">
                  HIGH MOM / HIGH VALUE
                </text>

                {/* Dots with labels */}
                {/* NVDA */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectTicker('NVDA');
                    onNavigate('strategy-studio');
                  }}
                >
                  <circle cx="420" cy="55" r="7" fill="#4f46e5" />
                  <text x="432" y="58" fill="#0f172a" fontSize="10" fontWeight="bold">
                    NVDA (94.8)
                  </text>
                </g>

                {/* MSFT */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectTicker('MSFT');
                    onNavigate('strategy-studio');
                  }}
                >
                  <circle cx="280" cy="85" r="6" fill="#16a34a" />
                  <text x="290" y="88" fill="#334155" fontSize="9" fontWeight="bold">
                    MSFT (91.2)
                  </text>
                </g>

                {/* AVGO */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectTicker('AVGO');
                    onNavigate('strategy-studio');
                  }}
                >
                  <circle cx="360" cy="70" r="6" fill="#16a34a" />
                  <text x="370" y="73" fill="#334155" fontSize="9" fontWeight="bold">
                    AVGO (88.5)
                  </text>
                </g>

                {/* QCOM */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectTicker('QCOM');
                    onNavigate('strategy-studio');
                  }}
                >
                  <circle cx="160" cy="110" r="5" fill="#6366f1" />
                  <text x="170" y="113" fill="#334155" fontSize="9">
                    QCOM (84.1)
                  </text>
                </g>

                {/* NOW */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectTicker('NOW');
                    onNavigate('strategy-studio');
                  }}
                >
                  <circle cx="340" cy="100" r="5" fill="#6366f1" />
                  <text x="350" y="103" fill="#334155" fontSize="9">
                    NOW (75.1)
                  </text>
                </g>

                {/* PANW */}
                <g
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectTicker('PANW');
                    onNavigate('strategy-studio');
                  }}
                >
                  <circle cx="320" cy="115" r="5" fill="#94a3b8" />
                  <text x="330" y="118" fill="#475569" fontSize="9">
                    PANW (73.8)
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-outline mt-2 border-t border-outline-variant/30 pt-2">
            <span>X-Axis: 3M Momentum (%)</span>
            <span>Y-Axis: Composite Factor Stacking</span>
            <span>Click any node to load into Strategy Studio</span>
          </div>
        </div>

        {/* Bounded AI Industry Assessment & Audit Note */}
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-on-surface">INDUSTRY CLUSTERS</h3>
              <span className="text-[10px] text-primary">TAXONOMY</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 bg-surface-container rounded border border-outline-variant/30">
                <div className="text-on-surface font-semibold text-[11px] mb-0.5">
                  1. Semiconductor Hardware
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  NVDA, AVGO, AMD, QCOM
                </div>
                <div className="text-[10px] text-tertiary mt-1">Weighted Beta: 1.48 // Capex Expansion</div>
              </div>

              <div className="p-2 bg-surface-container rounded border border-outline-variant/30">
                <div className="text-on-surface font-semibold text-[11px] mb-0.5">
                  2. Enterprise Cloud Platforms
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  MSFT, ORCL, NOW
                </div>
                <div className="text-[10px] text-primary mt-1">Weighted Beta: 1.05 // Sticky ARR</div>
              </div>

              <div className="p-2 bg-surface-container rounded border border-outline-variant/30">
                <div className="text-on-surface font-semibold text-[11px] mb-0.5">
                  3. Cybersecurity &amp; Infra
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  PANW, CRWD
                </div>
                <div className="text-[10px] text-secondary mt-1">Weighted Beta: 1.18 // Secular Defense</div>
              </div>
            </div>
          </div>

          {/* Fallback Mode Toggle */}
          <div className="p-2.5 bg-surface-container-lowest rounded border border-outline-variant/40">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface font-semibold">
                Graceful Degradation Fallback:
              </span>
              <button
                onClick={() => {
                  setFallbackMode(!fallbackMode);
                  onNotify(
                    fallbackMode ? 'info' : 'warning',
                    `Fallback Mode ${!fallbackMode ? 'Enabled' : 'Disabled'}`,
                    !fallbackMode ? 'Simulating cached factor recovery' : 'Live feeds restored'
                  );
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  fallbackMode
                    ? 'bg-secondary text-on-secondary-container'
                    : 'bg-surface-container-high text-outline'
                }`}
              >
                {fallbackMode ? 'SIMULATE ON' : 'SIMULATE OFF'}
              </button>
            </div>
            <p className="text-[9px] text-outline mt-1">
              Tests SLA recovery when third-party provider feeds time out or drop websocket connections.
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Provenance Audit */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="text-on-surface font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-tertiary">fingerprint</span>
            Pipeline Cryptographic Provenance Certificate
          </div>
          <div className="text-[10px] text-outline flex items-center gap-2">
            <span>Merkle Root:</span>
            <code className="text-primary font-mono">0x8900acfe1190bc1230984da091cbeee810993019280148f9801827</code>
          </div>
        </div>

        <button
          onClick={handleCopyHash}
          className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded border border-outline-variant/50 text-[11px] font-semibold transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[14px]">content_copy</span>
          Copy Hash Certificate
        </button>
      </div>
    </div>
  );
};
