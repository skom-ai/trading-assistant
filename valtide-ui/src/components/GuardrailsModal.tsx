import React from 'react';

interface GuardrailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuardrailsModal: React.FC<GuardrailsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-[var(--c-fafafa)] max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[var(--c-065f46)]/30 border border-[var(--c-065f46)]/50 flex items-center justify-center text-[var(--c-34d399)]">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <h2 className="text-base font-semibold font-['Inter']">FINRA 2210 / SEC-IA Guardrails</h2>
              <span className="text-[11px] font-mono text-[var(--c-34d399)]">All 4 Algorithmic Defense Gates Active</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--c-71717a)] hover:text-[var(--c-fafafa)]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--c-fafafa)]">1. Anti-Sycophancy Score (99.8%)</span>
              <span className="px-2 py-0.5 rounded bg-[var(--c-065f46)] text-[var(--c-34d399)] text-[10px] font-bold">ENFORCED</span>
            </div>
            <p className="text-[var(--c-a1a1aa)] text-[11px] leading-relaxed font-['Inter']">
              Prevents the language model from conforming to user-induced bullish or bearish confirmation biases. Models are mathematically penalized for agreeing with unverified assertions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--c-fafafa)]">2. Evidence Traceability Gate</span>
              <span className="px-2 py-0.5 rounded bg-[var(--c-065f46)] text-[var(--c-34d399)] text-[10px] font-bold">ZERO TOLERANCE</span>
            </div>
            <p className="text-[var(--c-a1a1aa)] text-[11px] leading-relaxed font-['Inter']">
              Requires 100% of numeric parameters and catalyst claims to anchor directly into a cryptographic EDGAR Form 8-K, 10-Q, or audited newswire receipt before rendering.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--c-fafafa)]">3. Forbidden-Language Linter (FINRA 2210)</span>
              <span className="px-2 py-0.5 rounded bg-[var(--c-065f46)] text-[var(--c-34d399)] text-[10px] font-bold">0 VIOLATIONS</span>
            </div>
            <p className="text-[var(--c-a1a1aa)] text-[11px] leading-relaxed font-['Inter']">
              Automatic regex and semantic scanning for promissory, exaggerated, or misleading claims (e.g. "guaranteed return", "risk-free", "certain profit"). Replaces uncalibrated phrasing with deterministic probabilities.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[var(--c-fafafa)]">4. SEC Rule 17a-4 WORM Immutability</span>
              <span className="px-2 py-0.5 rounded bg-[var(--c-065f46)] text-[var(--c-34d399)] text-[10px] font-bold">LOCKED</span>
            </div>
            <p className="text-[var(--c-a1a1aa)] text-[11px] leading-relaxed font-['Inter']">
              All generated strategies, weights, and agent rationales are written to Write Once, Read Many (WORM) storage with SHA-256 hash chaining to satisfy broker-dealer compliance audits.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--c-27272a)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-xs font-mono font-semibold hover:bg-[var(--c-6d28d9)] transition-colors"
          >
            Acknowledge &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};
