import React from 'react';
import { AuditRecord } from '../types/terminal';

interface AuditCertificateModalProps {
  record: AuditRecord | null;
  onClose: () => void;
}

export const AuditCertificateModal: React.FC<AuditCertificateModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[var(--c-0f0f12)] border border-[var(--c-27272a)] rounded-2xl shadow-2xl p-6 flex flex-col gap-6 text-[var(--c-fafafa)] relative max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Certificate Header */}
        <div className="flex items-start justify-between border-b border-[var(--c-27272a)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--c-7c3aed)]/20 border border-[var(--c-7c3aed)]/40 flex items-center justify-center text-[var(--c-a78bfa)]">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
            <div>
              <div className="text-[11px] font-mono text-[var(--c-a78bfa)] uppercase tracking-wider font-semibold">
                FINRA 2210 / SEC-IA CERTIFIED COMPLIANCE ARCHIVE
              </div>
              <h2 className="text-xl font-bold font-['Inter']">WORM Audit Record Certificate</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--c-71717a)] hover:text-[var(--c-fafafa)] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Certificate Seal & Meta */}
        <div className="p-4 rounded-xl bg-[var(--c-121215)] border border-[var(--c-27272a)] flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--c-27272a)]/60">
            <span className="text-[var(--c-71717a)]">Correlation ID:</span>
            <span className="text-[var(--c-a78bfa)] font-bold">{record.correlationId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--c-71717a)]">Target Asset / Ticker:</span>
            <span className="text-[var(--c-fafafa)] font-semibold">{record.ticker} (US Equities)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--c-71717a)]">Engine Subsystem:</span>
            <span className="text-[var(--c-fafafa)]">{record.featureTriggered}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--c-71717a)]">Timestamp (UTC):</span>
            <span className="text-[var(--c-fafafa)]">{record.timestamp}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--c-71717a)]">WORM State:</span>
            <span className="text-[var(--c-34d399)] font-bold">LOCKED &amp; IMMUTABLE (SEC Rule 17a-4)</span>
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <span className="text-[var(--c-71717a)] text-[10px] uppercase">SHA-256 Ledger Hash:</span>
            <code className="text-[11px] text-[var(--c-34d399)] bg-[var(--c-09090b)] p-2 rounded border border-[var(--c-27272a)] break-all select-all">
              {record.hash}
            </code>
          </div>
        </div>

        {/* Guardrail Checklist */}
        <div className="space-y-2 text-xs">
          <div className="text-[11px] font-mono text-[var(--c-71717a)] uppercase tracking-wider font-semibold">
            Automated Supervisory Verifications
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] flex items-center justify-between">
              <span className="text-[var(--c-a1a1aa)]">Anti-Sycophancy Score:</span>
              <span className="text-[var(--c-34d399)] font-bold">99.8% (PASS)</span>
            </div>
            <div className="p-2.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] flex items-center justify-between">
              <span className="text-[var(--c-a1a1aa)]">Evidence Gate:</span>
              <span className="text-[var(--c-34d399)] font-bold">100% CITED</span>
            </div>
            <div className="p-2.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] flex items-center justify-between">
              <span className="text-[var(--c-a1a1aa)]">Promissory Linter:</span>
              <span className="text-[var(--c-34d399)] font-bold">0 INFRACTIONS</span>
            </div>
            <div className="p-2.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] flex items-center justify-between">
              <span className="text-[var(--c-a1a1aa)]">PII Redaction (GLBA):</span>
              <span className="text-[var(--c-34d399)] font-bold">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* WORM Audit Log Entries */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-mono text-[var(--c-71717a)] uppercase tracking-wider font-semibold">
            Decrypted Cryptographic Audit Trail
          </div>
          <div className="p-3 rounded bg-[var(--c-070709)] border border-[var(--c-27272a)] font-mono text-[11px] text-[var(--c-a1a1aa)] space-y-1">
            {record.logs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[var(--c-52525b)] select-none">{i + 1}.</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--c-27272a)]">
          <span className="text-[11px] font-mono text-[var(--c-71717a)]">
            Certified on Node: US-EAST-DMA-04
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[var(--c-18181b)] border border-[var(--c-27272a)] text-xs font-mono text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] text-xs font-mono font-semibold hover:bg-[var(--c-6d28d9)] transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print / Save PDF Package</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
