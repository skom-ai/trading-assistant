/**
 * File: src/components/Sidebar.tsx
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React from 'react';
import { ModuleId } from '../types';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (module: ModuleId) => void;
  activeTicker: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  activeTicker
}) => {
  const navItems: {
    id: ModuleId;
    label: string;
    icon: string;
    badge: string;
    subtext: string;
  }[] = [
    {
      id: 'stock-scanner',
      label: 'Stock Scanner',
      icon: 'troubleshoot',
      badge: 'FR2',
      subtext: 'Deterministic Factor Screener'
    },
    {
      id: 'opportunity-check',
      label: 'Opportunity Check',
      icon: 'radar',
      badge: 'FR1',
      subtext: '4-State Catalyst Verdict Engine'
    },
    {
      id: 'strategy-studio',
      label: 'Strategy Studio',
      icon: 'candlestick_chart',
      badge: 'FR3',
      subtext: `Execution Matrix (${activeTicker})`
    },
    {
      id: 'historical-precedents',
      label: 'Precedent Library',
      icon: 'history_edu',
      badge: 'FR4',
      subtext: '30-Case Curated Corpus'
    },
    {
      id: 'audit-and-citations',
      label: 'Audit & Ledger',
      icon: 'fact_check',
      badge: 'SEC',
      subtext: 'SEC-17a-4 Immutable Trail'
    },
    {
      id: 'edge-cases',
      label: 'Resilience Matrix',
      icon: 'shield_with_heart',
      badge: 'SLA',
      subtext: 'Fault Recovery & Abstention'
    },
    {
      id: 'component-showcase',
      label: 'Micro-Interactions',
      icon: 'widgets',
      badge: 'UI',
      subtext: 'Interactive State Showcase'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex h-[calc(100vh-3.5rem)] sticky top-14">
      <div className="p-3 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10px] font-mono text-slate-400 font-bold tracking-wider uppercase px-2 mb-2">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectModule(item.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 group relative ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-700 border-l-2 border-indigo-600 shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[19px] mt-0.5 shrink-0 ${
                      isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold truncate leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ml-1 ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[10px] font-mono truncate mt-0.5 ${
                        isActive ? 'text-indigo-600/80' : 'text-slate-400'
                      }`}
                    >
                      {item.subtext}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Invariant Checklist */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[10px] space-y-1.5 shadow-xs">
          <div className="text-slate-900 font-bold flex items-center justify-between text-[11px]">
            <span>ENGINE INVARIANTS</span>
            <span className="text-emerald-600 font-bold">100% OK</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Zero-LLM Math:</span>
            <span className="text-indigo-600 font-bold">ENFORCED</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>FINRA 2210 Filter:</span>
            <span className="text-emerald-600 font-bold">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Anti-Hallucination:</span>
            <span className="text-indigo-600 font-bold">LOCKED</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Active Ticker:</span>
            <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {activeTicker}
            </span>
          </div>
        </div>
      </div>

      {/* Compute Node Telemetry Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 font-mono text-[10px] text-slate-600 space-y-1">
        <div className="flex items-center justify-between text-slate-800 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>DESK_01 // ASHBURN</span>
          </div>
          <span className="text-indigo-600 font-bold">11.4ms</span>
        </div>
        <div className="text-[9px] text-slate-400">Deterministic C++ Quant Core</div>
      </div>
    </aside>
  );
};
