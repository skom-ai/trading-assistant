import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--c-070709)] border-t border-[var(--c-27272a)]/60 py-3 mt-auto">
      <div className="w-full px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[var(--c-71717a)] font-mono">
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
          <span>VALTIDE TERMINAL v4.2.0-PROD</span>
          <span className="text-[var(--c-27272a)]">•</span>
          <span>LATENCY SLA: 99.999%</span>
          <span className="text-[var(--c-27272a)]">•</span>
          <span className="text-[var(--c-34d399)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-34d399)]"></span>
            ALL RUNTIMES SECURE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>EXECUTION ROUTE: DMA-DIRECT</span>
          <span className="text-[var(--c-27272a)]">|</span>
          <span className="text-[var(--c-71717a)]">STRICT CONFIDENTIALITY APPLIES</span>
        </div>
      </div>
    </footer>
  );
};
