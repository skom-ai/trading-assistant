/**
 * File: src/components/FormulaModal.tsx
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React from 'react';

interface FormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaModal: React.FC<FormulaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close formula modal"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm shadow-indigo-200">
            fx
          </div>
          <div>
            <h3 className="text-slate-900 font-bold font-headline-sm tracking-tight">Transparent Factor Math (Zero-LLM)</h3>
            <p className="text-slate-500 font-mono text-xs">Deterministic C++ Quant Core // ISO-27001 Audited</p>
          </div>
        </div>

        <div className="space-y-4 font-body-sm text-slate-600">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 shadow-xs">
            <div className="text-indigo-600 font-bold mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Composite Score Formula:
            </div>
            <code className="text-indigo-900 font-semibold block bg-white p-2.5 rounded-lg border border-slate-200/80">
              Score = 0.35 × Z<sub>Val</sub> + 0.35 × Z<sub>Mom3M/6M</sub> + 0.15 × (100 - RSI<sub>14</sub>) + 0.15 × VolRatio
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-900 font-bold text-xs mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">tune</span>
                Winsorization Boundary
              </div>
              <p className="text-xs text-slate-600">
                Extreme outlier inputs are clamped strictly between <span className="font-mono text-slate-900 font-bold">[-3.0σ, +3.0σ]</span> to preserve statistical robustness against flash events.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-slate-900 font-bold text-xs mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-indigo-600">gavel</span>
                Non-Hallucination Gate
              </div>
              <p className="text-xs text-slate-600">
                LLMs generate <span className="font-mono text-rose-600 font-bold">0.0%</span> of numerical calculations. Every metric is computed in native memory and cross-hashed on ledger.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs space-y-1.5">
            <div className="text-slate-900 font-bold">Factor Weights & Citations:</div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Trailing P/E vs 5Y Sector Z-Score:</span>
              <span className="text-indigo-600 font-bold">35.0%</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Dual Momentum (3M: 60%, 6M: 40%):</span>
              <span className="text-indigo-600 font-bold">35.0%</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>RSI Mean-Reversion Stacking:</span>
              <span className="text-indigo-600 font-bold">15.0%</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Volume Spike Ratio vs 20D ADV:</span>
              <span className="text-indigo-600 font-bold">15.0%</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-mono font-bold transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            I Acknowledge Formula Transparency
          </button>
        </div>
      </div>
    </div>
  );
};
