/**
 * File: src/components/AuditLedger.tsx
 * Description: Valtide source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React, { useState } from 'react';
import { ModuleId } from '../types';
import { AUDIT_RECORDS, CANONICAL_BUNDLE_JSON } from '../data/mockData';

interface AuditLedgerProps {
  onSelectTicker: (ticker: string) => void;
  onNavigate: (module: ModuleId) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, detail?: string) => void;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  onSelectTicker,
  onNavigate,
  onNotify
}) => {
  const [filterSymbol, setFilterSymbol] = useState('');
  const [selectedTraceId, setSelectedTraceId] = useState(AUDIT_RECORDS[0].traceId);

  const activeRecord = AUDIT_RECORDS.find(r => r.traceId === selectedTraceId) || AUDIT_RECORDS[0];

  const filteredRecords = AUDIT_RECORDS.filter(r => {
    if (!filterSymbol) return true;
    return r.symbol.toLowerCase().includes(filterSymbol.toLowerCase()) || r.traceId.toLowerCase().includes(filterSymbol.toLowerCase());
  });

  const handleCopyMerkle = () => {
    navigator.clipboard?.writeText(activeRecord.merkleHash);
    onNotify('success', 'Merkle Root Hash Copied', `${activeRecord.merkleHash.slice(0, 16)}...`);
  };

  const handleDownloadBundle = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(CANONICAL_BUNDLE_JSON);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SEC_17a4_BUNDLE_${activeRecord.symbol}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    onNotify('success', 'Signed Bundle Downloaded', `Canonical SEC-17a-4 JSON archive for ${activeRecord.symbol}`);
  };

  const handleCliProof = () => {
    onNotify('info', 'CLI Proof Command Copied', 'valtide-verify --merkle-root ' + activeRecord.merkleHash.slice(0, 14));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-on-surface">
              CRYPTOGRAPHIC AUDIT ENGINE &amp; SEC-17a-4 IMMUTABLE LEDGER
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 font-bold">
              CHAIN #892,104 SYNCED
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Verifiable record of deterministic inputs, zero-LLM math execution traces, model system invariant hashes, and evidentiary citation graphs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBundle}
            className="px-3 py-1.5 bg-primary-container hover:bg-primary-container/90 text-on-primary-container rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            DOWNLOAD SIGNED BUNDLE
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              placeholder="Filter Symbol or Trace ID..."
              className="bg-surface-container-lowest border border-outline-variant/50 rounded px-2.5 py-1 text-xs text-on-surface w-52 focus:outline-none focus:border-primary"
            />
          </div>
          <span className="text-outline text-[11px]">|</span>
          <span className="text-on-surface font-semibold text-[11px]">Subsystem:</span>
          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] border border-outline-variant/30">
            ALL SUBSYSTEMS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="text-tertiary font-bold text-[11px]">100% MERKLE VERIFIED</span>
          <span className="text-outline text-[11px]">•</span>
          <span className="text-on-surface-variant text-[11px]">SEC-IA MANDATE PASS</span>
        </div>
      </div>

      {/* Reconstructed Decision Context Card */}
      <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-5 relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline uppercase font-semibold">
                Reconstructed Trace Decision:
              </span>
              <span className="text-sm font-bold text-primary">{activeRecord.traceId}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 font-bold">
                UNBROKEN CHAIN
              </span>
            </div>
            <div className="text-xs text-on-surface-variant mt-0.5">
              Correlation UUID: <code className="text-on-surface">c08e4f1a-7b92-4f21-a39c-1982bde94a02</code>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="text-[10px] text-outline">Engine Latency</div>
              <div className="font-bold text-primary">{activeRecord.latencyMs} ms</div>
            </div>
            <button
              onClick={() => {
                onSelectTicker(activeRecord.symbol);
                onNavigate('strategy-studio');
              }}
              className="px-2.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded border border-outline-variant/50 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              INSPECT STRATEGY ({activeRecord.symbol})
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Cryptographic Merkle Root Bar */}
        <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-[10px] text-outline uppercase block font-semibold">
              Root Merkle Hash (SHA-256 Provenance Anchor):
            </span>
            <code className="text-tertiary text-xs break-all">{activeRecord.merkleHash}</code>
          </div>
          <button
            onClick={handleCopyMerkle}
            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-on-surface rounded border border-outline-variant/40 text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[13px]">content_copy</span>
            Copy Hash
          </button>
        </div>

        {/* Ingestion Hashes & Deterministic Invariants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Ingestion Feeds */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
            <div className="text-on-surface font-semibold flex items-center justify-between">
              <span>Input Payload Ingestion Hashes</span>
              <span className="text-[10px] text-tertiary font-bold">100% AUDITED</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-on-surface-variant">
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span>1. yFinance Snapshot:</span>
                <code className="text-secondary">0x44f1...89a0</code>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span>2. Finnhub Wire Stream:</span>
                <code className="text-secondary">0x7b12...ce41</code>
              </div>
              <div className="flex justify-between">
                <span>3. SEC EDGAR 8-K Regulatory:</span>
                <code className="text-tertiary">0x9e44...fd12</code>
              </div>
            </div>
          </div>

          {/* Model Safety Invariants */}
          <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
            <div className="text-on-surface font-semibold flex items-center justify-between">
              <span>Model Governance &amp; Safety Invariants</span>
              <span className="text-[10px] text-primary font-bold">ZERO-LLM MATH</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-on-surface-variant">
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span>Decoding Temperature:</span>
                <span className="text-on-surface font-bold">0.0000 (Strictly Locked)</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/20 pb-1">
                <span>Arithmetic Path:</span>
                <span className="text-tertiary font-bold">Native C++ Engine Only</span>
              </div>
              <div className="flex justify-between">
                <span>System Invariant Drift:</span>
                <span className="text-primary font-bold">0.00% Entropy Invariant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Material Claims Mapping */}
        <div className="space-y-2">
          <div className="text-xs text-outline uppercase font-semibold">
            Material Claims &amp; Evidentiary Mapping (FINRA Rule 2210)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant/30">
              <div className="text-tertiary font-bold text-[11px] mb-1">CLAIM CLM-01</div>
              <div className="text-on-surface font-semibold text-[11px]">Sovereign Cloud $14.2B Capex</div>
              <div className="text-[10px] text-outline mt-1">Verified via SEC 8-K Definitive Agreement</div>
            </div>
            <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant/30">
              <div className="text-primary font-bold text-[11px] mb-1">CLAIM CLM-02</div>
              <div className="text-on-surface font-semibold text-[11px]">+1.8σ Valuation Overextension</div>
              <div className="text-[10px] text-outline mt-1">Verified via C++ Factor Screener Matrix</div>
            </div>
            <div className="p-2.5 bg-surface-container-low rounded border border-outline-variant/30">
              <div className="text-secondary font-bold text-[11px] mb-1">CLAIM CLM-03</div>
              <div className="text-on-surface font-semibold text-[11px]">MA20 Pullback Hypo Entry $122.50</div>
              <div className="text-[10px] text-outline mt-1">Verified via Technical Moving Ribbon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Canonical JSON Bundle Preview */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 font-mono">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">data_object</span>
            <span className="text-xs font-bold text-on-surface">CANONICAL BUNDLE ARTIFACT (.JSON)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCliProof}
              className="text-[11px] text-primary hover:underline"
            >
              Verify via CLI
            </button>
            <button
              onClick={handleDownloadBundle}
              className="text-[11px] text-tertiary hover:underline font-bold"
            >
              Download
            </button>
          </div>
        </div>
        <pre className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 text-[11px] text-on-surface-variant overflow-x-auto max-h-52">
          {CANONICAL_BUNDLE_JSON}
        </pre>
      </div>

      {/* Audit Trail Ledger Table */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl overflow-hidden shadow-md">
        <div className="p-3 bg-surface-container-highest/60 border-b border-outline-variant/40 flex items-center justify-between text-xs">
          <span className="font-bold text-on-surface">HISTORICAL AUDIT RECONSTRUCTION LEDGER</span>
          <span className="text-[10px] text-outline">Showing Recent 5 Immutable Ledger Blocks</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-outline text-[11px]">
                <th className="py-2.5 px-3">TRACE ID</th>
                <th className="py-2.5 px-3">SUBSYSTEM EVENT</th>
                <th className="py-2.5 px-3">ASSET</th>
                <th className="py-2.5 px-3">PIPELINE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">TIMESTAMP (UTC)</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {filteredRecords.map((r) => (
                <tr
                  key={r.traceId}
                  className={`hover:bg-surface-container/70 transition-colors ${
                    selectedTraceId === r.traceId ? 'bg-surface-container/50' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-primary text-[11px]">{r.traceId}</td>
                  <td className="py-2.5 px-3 text-on-surface">{r.event}</td>
                  <td className="py-2.5 px-3 font-bold text-secondary">{r.symbol}</td>
                  <td className="py-2.5 px-3 text-on-surface-variant text-[11px]">{r.pipeline}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.2 rounded bg-tertiary/20 text-tertiary border border-tertiary/30 text-[10px]">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-outline text-[11px]">{r.timestamp}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedTraceId(r.traceId)}
                      className="px-2 py-0.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded text-[10px] font-semibold transition-colors"
                    >
                      INSPECT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
