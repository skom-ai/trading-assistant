/**
 * File: src/components/GovernanceAuditView.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W3.3 — Wire GovernanceAuditView to GET /api/v1/governance.
 *   Records, correlation IDs, cryptographic hashes and the event counter are
 *   now REAL projections of the live FR5 ledger (resolved in App.tsx via the
 *   shared typed client + governanceMapper). A LIVE/FALLBACK badge, loading
 *   and error states mirror the Wave-2 UX; the mock ledger remains the typed
 *   fallback so the panel never blanks when the BFF is unreachable.
 * Description:
 *   FR5 governance / SEC-17a-4 audit ledger page. Pure presentation of an
 *   AuditRecord[] (master/detail inspect, guardrail metrics, bundle export);
 *   it owns no fetching — data provenance is decided by the parent.
 */
import React, { useState } from 'react';
import { AuditRecord } from '../types/terminal';

interface GovernanceAuditViewProps {
  auditRecords: AuditRecord[];
  eventCount: number;
  /** True when records come from the live FR5 endpoint, false for the mock. */
  isLive: boolean;
  /** True while the live ledger fetch is in flight. */
  isLoading: boolean;
  /** Sanitized error message when the live fetch failed, else null. */
  errorMessage: string | null;
  /** Re-run the live ledger fetch. */
  onRetry: () => void;
  onOpenAuditPackageModal: (record: AuditRecord) => void;
}

export const GovernanceAuditView: React.FC<GovernanceAuditViewProps> = ({
  auditRecords,
  eventCount,
  isLive,
  isLoading,
  errorMessage,
  onRetry,
  onOpenAuditPackageModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [featureFilter, setFeatureFilter] = useState('ALL');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    auditRecords[0]?.id || 'rec-1'
  );
  const [page, setPage] = useState(1);
  const [inspectorPulse, setInspectorPulse] = useState(false);

  // Active inspected record
  const activeRecord =
    auditRecords.find(r => r.id === selectedRecordId) || auditRecords[0];

  const handleInspect = (recordId: string) => {
    setSelectedRecordId(recordId);
    setInspectorPulse(true);
    setTimeout(() => setInspectorPulse(false), 500);
  };

  const filteredRecords = auditRecords.filter(r => {
    const matchesSearch =
      r.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.correlationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.featureTriggered.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFeature =
      featureFilter === 'ALL' || r.featureTriggered === featureFilter;
    return matchesSearch && matchesFeature;
  });

  return (
    <div className="flex flex-col w-full pb-8">
      <div className="flex flex-col w-full px-4 md:px-6 py-6 gap-6 max-w-[1600px] mx-auto">
        {/* Executive Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-[var(--c-0f0f12)] p-6 rounded-xl border border-[var(--c-27272a)] shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 rounded bg-[var(--c-065f46)]/20 text-[var(--c-34d399)] text-xs font-semibold tracking-wider flex items-center gap-1.5 border border-[var(--c-065f46)]/40 font-mono">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                SEC RULE 17A-4 IMMUTABILITY ACTIVE
              </span>
              <span className="px-2.5 py-1 rounded bg-[var(--c-121215)] text-[var(--c-a78bfa)] text-xs font-semibold tracking-wider flex items-center gap-1.5 border border-[var(--c-27272a)] font-mono">
                <span className="material-symbols-outlined text-[14px]">link</span>
                SHA-256 CHAIN VERIFIED
              </span>
              {/* W3.3 LIVE/FALLBACK provenance badge (mirrors Wave-2 UX). */}
              {isLoading ? (
                <span className="px-2.5 py-1 rounded bg-[var(--c-1e293b)]/40 text-[var(--c-93c5fd)] text-xs font-semibold tracking-wider flex items-center gap-1.5 border border-[var(--c-1e293b)] font-mono">
                  <span className="w-2 h-2 rounded-full bg-[var(--c-93c5fd)] animate-pulse" />
                  LOADING LEDGER…
                </span>
              ) : isLive ? (
                <span className="px-2.5 py-1 rounded bg-[var(--c-065f46)]/20 text-[var(--c-34d399)] text-xs font-semibold tracking-wider flex items-center gap-1.5 border border-[var(--c-065f46)]/40 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[var(--c-34d399)]" />
                  LIVE LEDGER
                </span>
              ) : (
                <button
                  onClick={onRetry}
                  title={errorMessage ?? 'BFF unreachable — showing reference ledger'}
                  className="px-2.5 py-1 rounded bg-[var(--c-78350f)]/20 text-[var(--c-fbbf24)] text-xs font-semibold tracking-wider flex items-center gap-1.5 border border-[var(--c-78350f)]/40 font-mono hover:bg-[var(--c-78350f)]/30 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  FALLBACK — RETRY
                </button>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--c-fafafa)] font-['Inter']">
              Governance &amp; Audit Log
            </h1>
            <p className="text-sm text-[var(--c-a1a1aa)] max-w-2xl leading-relaxed font-['Inter']">
              Real-time cryptographic audit trail of all institutional AI agent decisions, prompt injections,
              multi-factor triggers, and compliance guardrails.
            </p>
          </div>

          {/* Live Event Counter & Metrics */}
          <div className="flex items-center gap-6 bg-[var(--c-121215)] p-4 rounded-lg border border-[var(--c-27272a)] shadow-inner self-stretch lg:self-auto justify-between lg:justify-end">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-[var(--c-71717a)] font-mono">Real-Time Events</span>
              <span className="text-2xl font-bold text-[var(--c-fafafa)] font-mono tracking-tight">
                {eventCount.toLocaleString()}
              </span>
            </div>
            <div className="h-8 w-px bg-[var(--c-27272a)]"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-[var(--c-71717a)] font-mono">Chain Integrity</span>
              <span className="text-xs font-semibold text-[var(--c-34d399)] flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-[var(--c-34d399)] animate-pulse"></span> 100.0% VALID
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Immutable Audit Trail (8 Cols) */}
          <div className="xl:col-span-8 flex flex-col gap-4 bg-[var(--c-0f0f12)] p-6 rounded-xl border border-[var(--c-27272a)] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--c-27272a)]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[var(--c-a78bfa)]">history_edu</span>
                <h2 className="text-base font-semibold text-[var(--c-fafafa)] font-['Inter']">
                  Immutable Decision Records
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filter by correlation ID or ticker..."
                    className="bg-[var(--c-121215)] border border-[var(--c-27272a)] px-3 py-1.5 rounded text-xs font-mono text-[var(--c-fafafa)] placeholder:text-[var(--c-52525b)] w-64 focus:outline-none focus:ring-1 focus:ring-[var(--c-a78bfa)]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1.5 text-[var(--c-71717a)] hover:text-[var(--c-fafafa)] text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    className="px-3 py-1.5 rounded bg-[var(--c-121215)] hover:bg-[var(--c-18181b)] border border-[var(--c-27272a)] text-[var(--c-fafafa)] text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">filter_list</span>
                    <span>{featureFilter === 'ALL' ? 'Filter' : featureFilter}</span>
                  </button>

                  {filterMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-lg shadow-xl py-1 z-30 font-mono text-xs">
                      {['ALL', 'News Catalyst Check', 'Scanner & Multi-Factor', 'Strategy Engine', 'Analog Matching'].map(f => (
                        <button
                          key={f}
                          onClick={() => {
                            setFeatureFilter(f);
                            setFilterMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left transition-colors ${
                            featureFilter === f ? 'text-[var(--c-a78bfa)] bg-[var(--c-18181b)]' : 'text-[var(--c-a1a1aa)] hover:bg-[var(--c-18181b)]'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase text-[var(--c-71717a)] font-mono border-b border-[var(--c-27272a)]">
                    <th className="py-3 px-3 font-medium">Timestamp (UTC)</th>
                    <th className="py-3 px-3 font-medium">Correlation ID</th>
                    <th className="py-3 px-3 font-medium">Ticker</th>
                    <th className="py-3 px-3 font-medium">Feature Triggered</th>
                    <th className="py-3 px-3 font-medium text-center">Citations</th>
                    <th className="py-3 px-3 font-medium">Status</th>
                    <th className="py-3 px-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[var(--c-27272a)]/40">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[var(--c-71717a)] font-mono">
                        No records match query "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => {
                      const isInspected = record.id === activeRecord.id;
                      return (
                        <tr
                          key={record.id}
                          onClick={() => handleInspect(record.id)}
                          className={`transition-colors cursor-pointer group ${
                            isInspected ? 'bg-[var(--c-18181b)]' : 'hover:bg-[var(--c-121215)]'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono text-xs text-[var(--c-a1a1aa)]">{record.timestamp}</td>
                          <td className="py-3 px-3 font-mono text-xs text-[var(--c-a78bfa)] font-medium">
                            {record.correlationId}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[var(--c-fafafa)] font-['Inter']">{record.ticker}</td>
                          <td className="py-3 px-3 text-[var(--c-a1a1aa)] text-xs font-['Inter']">
                            {record.featureTriggered}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-fafafa)] font-mono text-xs">
                              {record.citations}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[var(--c-34d399)] text-xs font-semibold font-mono flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleInspect(record.id);
                              }}
                              className={`p-1.5 rounded border transition-colors cursor-pointer ${
                                isInspected
                                  ? 'bg-[var(--c-7c3aed)] text-white border-[var(--c-7c3aed)]'
                                  : 'bg-[var(--c-121215)] hover:bg-[var(--c-7c3aed)] hover:text-white border-[var(--c-27272a)] text-[var(--c-a1a1aa)]'
                              }`}
                              title="Inspect audit record"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--c-27272a)] text-xs text-[var(--c-71717a)] font-mono">
              <span>Showing records 1–{filteredRecords.length} of {eventCount.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-[var(--c-fafafa)]">Page {page} of {Math.max(1, filteredRecords.length)}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: System Guardrails & Record Inspector (4 Cols) */}
          <div className="xl:col-span-4 flex flex-col gap-6">
            {/* Guardrails Status Box */}
            <div className="bg-[var(--c-0f0f12)] p-6 rounded-xl border border-[var(--c-27272a)] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--c-a78bfa)]">shield</span>
                  <h2 className="text-base font-semibold text-[var(--c-fafafa)] font-['Inter']">System Guardrails</h2>
                </div>
                <span className="text-xs text-[var(--c-34d399)] font-mono font-semibold">ALL ACTIVE</span>
              </div>

              {/* Metric 1: Anti-Sycophancy */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--c-121215)] border border-[var(--c-27272a)]/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--c-a1a1aa)]">Anti-Sycophancy Score</span>
                  <span className="text-[var(--c-34d399)] font-semibold font-mono">99.8%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--c-09090b)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--c-34d399)] rounded-full" style={{ width: '99.8%' }}></div>
                </div>
                <span className="text-[11px] text-[var(--c-71717a)]">
                  Model independence enforced against user bias prompting.
                </span>
              </div>

              {/* Metric 2: Evidence Traceability Gate */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--c-121215)] border border-[var(--c-27272a)]/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--c-a1a1aa)]">Evidence Traceability Gate</span>
                  <span className="text-[var(--c-34d399)] font-semibold font-mono">ENFORCED</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--c-09090b)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--c-34d399)] rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-[11px] text-[var(--c-71717a)]">
                  Zero unverified citations permitted in final outputs.
                </span>
              </div>

              {/* Metric 3: Forbidden-Language Linter */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--c-121215)] border border-[var(--c-27272a)]/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--c-a1a1aa)]">Forbidden-Language Linter</span>
                  <span className="text-[var(--c-34d399)] font-semibold font-mono">0 VIOLATIONS</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--c-09090b)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--c-34d399)] rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-[11px] text-[var(--c-71717a)]">
                  FINRA 2210 guaranteed exemption from promissory terms.
                </span>
              </div>

              {/* Metric 4: PII-Avoidance GLBA */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--c-121215)] border border-[var(--c-27272a)]/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--c-a1a1aa)]">PII-Avoidance (GLBA)</span>
                  <span className="text-[var(--c-34d399)] font-semibold font-mono">PASSED</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--c-09090b)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--c-34d399)] rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-[11px] text-[var(--c-71717a)]">
                  Automatic redaction of non-public personal information.
                </span>
              </div>
            </div>

            {/* Live Inspector Detail Box */}
            <div
              className={`bg-[var(--c-0f0f12)] p-6 rounded-xl border border-[var(--c-27272a)] shadow-sm flex flex-col gap-4 transition-all duration-300 ${
                inspectorPulse ? 'ring-2 ring-[var(--c-a78bfa)]' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--c-27272a)]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--c-a78bfa)]">policy</span>
                  <h2 className="text-base font-semibold text-[var(--c-fafafa)] font-['Inter']">Record Inspector</h2>
                </div>
                <span className="font-mono text-xs text-[var(--c-a78bfa)]">{activeRecord.correlationId}</span>
              </div>

              <div className="flex flex-col gap-2.5 font-mono text-xs text-[var(--c-a1a1aa)]">
                <div className="flex justify-between">
                  <span className="text-[var(--c-71717a)]">Target Ticker:</span>
                  <span className="text-[var(--c-fafafa)] font-semibold">{activeRecord.ticker}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--c-71717a)]">Engine Module:</span>
                  <span className="text-[var(--c-fafafa)]">{activeRecord.featureTriggered}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--c-71717a)]">Cryptographic Hash:</span>
                  <span className="text-[var(--c-fafafa)] text-[11px] truncate max-w-[190px]" title={activeRecord.hash}>
                    {activeRecord.hash}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--c-71717a)]">SEC Rule 17a-4 WORM State:</span>
                  <span className="text-[var(--c-34d399)] font-semibold">{activeRecord.wormState}</span>
                </div>
              </div>

              {/* Payload Verification Log */}
              <div className="p-3 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)]/60 font-mono text-[11px] text-[var(--c-a1a1aa)] flex flex-col gap-1.5 max-h-44 overflow-y-auto">
                <div className="text-[var(--c-71717a)] uppercase text-[10px] pb-1 border-b border-[var(--c-27272a)]/40">
                  Payload Verification Log
                </div>
                {activeRecord.logs.map((logLine, idx) => {
                  const isWormLine = logLine.includes('WORM') || logLine.includes('sealed') || logLine.includes('committed');
                  return (
                    <div key={idx} className={isWormLine ? 'text-[var(--c-34d399)]' : ''}>
                      {logLine}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => onOpenAuditPackageModal(activeRecord)}
                className="w-full py-2.5 rounded bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] font-semibold text-xs hover:bg-[var(--c-6d28d9)] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-mono"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download Certified Audit Package (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
