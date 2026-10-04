import React from 'react';

interface CitationModalProps {
  citation: { title: string; text: string } | null;
  onClose: () => void;
}

export const CitationModal: React.FC<CitationModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-[var(--c-fafafa)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--c-a78bfa)] text-[22px]">policy</span>
            <h2 className="text-base font-semibold font-['Inter']">Regulatory Citation Details</h2>
          </div>
          <button onClick={onClose} className="text-[var(--c-71717a)] hover:text-[var(--c-fafafa)]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-[var(--c-a78bfa)] uppercase">Primary Filing Reference</span>
          <h3 className="text-sm font-semibold text-[var(--c-fafafa)] font-['Inter']">{citation.title}</h3>
        </div>

        <div className="p-4 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] font-mono text-xs text-[var(--c-a1a1aa)] leading-relaxed">
          <div className="text-[10px] text-[var(--c-71717a)] uppercase mb-2">Verified Disclosure Extract</div>
          <p className="text-[var(--c-fafafa)] bg-[var(--c-09090b)] p-3 rounded border border-[var(--c-27272a)]/60">
            "{citation.text}"
          </p>
          <div className="mt-3 pt-2 border-t border-[var(--c-27272a)]/40 flex justify-between text-[11px] text-[var(--c-71717a)]">
            <span>EDGAR Ingest: CIK 0001045810</span>
            <span className="text-[var(--c-34d399)]">Chain Status: VERIFIED</span>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--c-27272a)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-xs font-mono font-semibold hover:bg-[var(--c-6d28d9)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
