import React, { useState } from 'react';

interface FactorWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (weights: { pe: number; mom: number; rsi: number; vol: number }) => void;
}

export const FactorWeightsModal: React.FC<FactorWeightsModalProps> = ({
  isOpen,
  onClose,
  onApply
}) => {
  const [peWeight, setPeWeight] = useState(25);
  const [momWeight, setMomWeight] = useState(35);
  const [rsiWeight, setRsiWeight] = useState(20);
  const [volWeight, setVolWeight] = useState(20);

  if (!isOpen) return null;

  const total = peWeight + momWeight + rsiWeight + volWeight;

  const setPreset = (type: 'canonical' | 'value' | 'momentum' | 'vol') => {
    if (type === 'canonical') {
      setPeWeight(25);
      setMomWeight(35);
      setRsiWeight(20);
      setVolWeight(20);
    } else if (type === 'value') {
      setPeWeight(50);
      setMomWeight(15);
      setRsiWeight(15);
      setVolWeight(20);
    } else if (type === 'momentum') {
      setPeWeight(10);
      setMomWeight(55);
      setRsiWeight(20);
      setVolWeight(15);
    } else if (type === 'vol') {
      setPeWeight(20);
      setMomWeight(20);
      setRsiWeight(25);
      setVolWeight(35);
    }
  };

  const handleSave = () => {
    onApply({ pe: peWeight, mom: momWeight, rsi: rsiWeight, vol: volWeight });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-[var(--c-fafafa)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--c-34d399)] text-[22px]">tune</span>
            <h2 className="text-base font-semibold font-['Inter']">Calibrate Canonical Multi-Factor Weights</h2>
          </div>
          <button onClick={onClose} className="text-[var(--c-71717a)] hover:text-[var(--c-fafafa)]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[var(--c-71717a)]">Presets:</span>
          <button
            onClick={() => setPreset('canonical')}
            className="px-2.5 py-1 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] hover:border-[var(--c-a78bfa)] text-xs font-mono text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] transition-colors"
          >
            Canonical (25/35/20/20)
          </button>
          <button
            onClick={() => setPreset('value')}
            className="px-2.5 py-1 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] hover:border-[var(--c-a78bfa)] text-xs font-mono text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] transition-colors"
          >
            Deep Value
          </button>
          <button
            onClick={() => setPreset('momentum')}
            className="px-2.5 py-1 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] hover:border-[var(--c-a78bfa)] text-xs font-mono text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] transition-colors"
          >
            High Momentum
          </button>
        </div>

        {/* Sliders */}
        <div className="space-y-4 font-mono text-xs">
          <div>
            <div className="flex justify-between pb-1">
              <span className="text-[var(--c-a1a1aa)]">Valuation P/E Z-Score:</span>
              <span className="text-[var(--c-a78bfa)] font-bold">{peWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={peWeight}
              onChange={e => setPeWeight(Number(e.target.value))}
              className="w-full accent-[var(--c-7c3aed)]"
            />
          </div>

          <div>
            <div className="flex justify-between pb-1">
              <span className="text-[var(--c-a1a1aa)]">3M / 6M Cross-Asset Momentum:</span>
              <span className="text-[var(--c-a78bfa)] font-bold">{momWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={momWeight}
              onChange={e => setMomWeight(Number(e.target.value))}
              className="w-full accent-[var(--c-7c3aed)]"
            />
          </div>

          <div>
            <div className="flex justify-between pb-1">
              <span className="text-[var(--c-a1a1aa)]">RSI 14 Mean-Reversion Weight:</span>
              <span className="text-[var(--c-a78bfa)] font-bold">{rsiWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={rsiWeight}
              onChange={e => setRsiWeight(Number(e.target.value))}
              className="w-full accent-[var(--c-7c3aed)]"
            />
          </div>

          <div>
            <div className="flex justify-between pb-1">
              <span className="text-[var(--c-a1a1aa)]">20-Day Volume Accumulation / Distribution:</span>
              <span className="text-[var(--c-a78bfa)] font-bold">{volWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volWeight}
              onChange={e => setVolWeight(Number(e.target.value))}
              className="w-full accent-[var(--c-7c3aed)]"
            />
          </div>
        </div>

        <div className="p-2.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--c-71717a)]">Combined Allocation:</span>
          <span className={`font-bold ${total === 100 ? 'text-[var(--c-34d399)]' : 'text-[var(--c-ef4444)]'}`}>
            {total}% {total === 100 ? '(Normalized)' : '(Normalized on save)'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--c-27272a)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] text-xs font-mono text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-xs font-mono font-semibold hover:bg-[var(--c-6d28d9)] transition-colors"
          >
            Apply &amp; Re-Score Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
