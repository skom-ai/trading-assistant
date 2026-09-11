/**
 * File: src/components/Navigation.tsx
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React, { useState } from 'react';
import { ModuleId } from '../types';
import { ASSETS } from '../data/mockData';

interface NavigationProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeModule,
  onSelectModule,
  activeTicker,
  onSelectTicker
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems: { id: ModuleId; label: string; icon: string; badge: string }[] = [
    { id: 'stock-scanner', label: 'Stock Scanner', icon: 'troubleshoot', badge: 'FR2' },
    { id: 'opportunity-check', label: 'Opportunity Check', icon: 'radar', badge: 'FR1' },
    { id: 'strategy-studio', label: 'Strategy Studio', icon: 'candlestick_chart', badge: 'FR3' },
    { id: 'historical-precedents', label: 'Precedent Library', icon: 'history_edu', badge: 'FR4' },
    { id: 'audit-and-citations', label: 'Audit & Ledger', icon: 'fact_check', badge: 'SEC' },
    { id: 'edge-cases', label: 'Resilience Matrix', icon: 'shield_with_heart', badge: 'SLA' },
    { id: 'component-showcase', label: 'Micro-Interactions', icon: 'widgets', badge: 'UI' }
  ];

  const quickTickers = ['NVDA', 'MSFT', 'AAPL', 'AVGO', 'TSLA', 'AMD', 'QCOM', 'PLTR', 'IONQ'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean) {
      onSelectTicker(clean);
      setSearchInput('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 md:px-6 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-700"
            aria-label="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileOpen ? 'close' : 'menu'}
            </span>
          </button>

          <div className="flex items-center gap-2">
            <img
              src={ASSETS.brandLogo}
              alt="QuantMind Logo"
              className="w-7 h-7 object-contain rounded shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div className="hidden sm:flex flex-col">
              <span className="font-mono text-xs font-bold tracking-wider text-slate-900">
                QUANTMIND
              </span>
              <span className="font-mono text-[9px] text-indigo-600 -mt-0.5 font-bold">
                AlphaAgent // v5.1
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden md:block" />

          {/* Market Status Indicators */}
          <div className="hidden lg:flex items-center gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-800 font-semibold">NASDAQ LIVE</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span>SPX</span>
              <span className="text-slate-800 font-semibold">5,892.40</span>
              <span className="text-emerald-600 font-bold">(+0.42%)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span>VIX</span>
              <span className="text-slate-800 font-semibold">14.18</span>
              <span className="text-indigo-600 font-bold">(-1.20%)</span>
            </div>
          </div>
        </div>

        {/* Center/Right controls */}
        <div className="flex items-center gap-3">
          {/* Quick Ticker Search */}
          <div className="relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-2.5 text-[16px] text-slate-400 pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={`Active: ${activeTicker} (Search)...`}
                  className="bg-slate-100 border border-slate-200 rounded-lg pl-8 pr-10 py-1.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white w-40 sm:w-56 transition-all shadow-xs"
                />
                <kbd className="absolute right-2 text-[10px] font-mono text-slate-400 border border-slate-200 px-1 rounded bg-slate-50 hidden sm:inline-block">
                  ↵
                </kbd>
              </div>
            </form>

            {searchOpen && (
              <div
                className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-40"
                onMouseLeave={() => setSearchOpen(false)}
              >
                <div className="text-[10px] font-mono text-slate-400 mb-1.5 px-1.5 font-bold uppercase">
                  Select Ticker
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {quickTickers.map((tick) => (
                    <button
                      key={tick}
                      onClick={() => {
                        onSelectTicker(tick);
                        setSearchOpen(false);
                      }}
                      className={`text-xs font-mono py-1 rounded transition-colors text-center ${
                        activeTicker === tick
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {tick}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compliance Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600">
            <span className="material-symbols-outlined text-[14px] text-emerald-600">
              verified_user
            </span>
            <span className="text-slate-800 font-semibold">SEC-IA</span>
            <span className="text-slate-300">|</span>
            <span className="text-indigo-600 font-bold">RULE 2210</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-1">
            <img
              src={ASSETS.userProfile}
              alt="J. Vance, CFA"
              className="w-8 h-8 rounded-full border border-indigo-200 object-cover shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-mono text-xs font-bold text-slate-800 leading-tight">
                J. Vance, CFA
              </span>
              <span className="text-[10px] font-mono text-slate-500 leading-tight">
                Lead Quant Director
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-64 h-full bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-2 mb-6">
                <img
                  src={ASSETS.brandLogo}
                  alt="QuantMind"
                  className="w-6 h-6 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="font-mono text-xs font-bold text-slate-900">QUANTMIND</span>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectModule(item.id);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                      activeModule === item.id
                        ? 'bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        activeModule === item.id
                          ? 'bg-indigo-100 text-indigo-700 font-bold'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 space-y-1">
              <div className="text-slate-800 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                MATH ENGINE: ZERO-LLM
              </div>
              <div>Latency: 11.2ms</div>
              <div>Region: us-east-1a</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
