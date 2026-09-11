/**
 * File: src/components/ResilienceMatrix.tsx
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import React, { useState } from 'react';
import { ModuleId } from '../types';

interface ResilienceMatrixProps {
  onSelectTicker: (ticker: string) => void;
  onNavigate: (module: ModuleId) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, detail?: string) => void;
}

export const ResilienceMatrix: React.FC<ResilienceMatrixProps> = ({
  onSelectTicker,
  onNavigate,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ionq' | 'timeout' | 'pltr' | 'crwd'>('all');

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 font-mono">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline-md text-on-surface">
              EDGE-CASE &amp; RESILIENCE STATE MATRIX
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary/30 font-bold">
              ZERO_HAL_LOCK: ON
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Deterministic fault injection, SLA failure modes, and systematic non-speculative abstention protocols.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant/40 text-on-surface">
            SLA RECOVERY: ENABLED
          </span>
          <span className="px-2.5 py-1 rounded bg-tertiary-container/30 text-tertiary border border-tertiary/40 font-bold">
            RESILIENCE PROTOCOL ACTIVE
          </span>
        </div>
      </div>

      {/* State Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'all'
              ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
              : 'bg-surface-container text-outline hover:text-on-surface'
          }`}
        >
          ALL STATES OVERVIEW
        </button>
        <button
          onClick={() => setActiveTab('ionq')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'ionq'
              ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
              : 'bg-surface-container text-outline hover:text-on-surface'
          }`}
        >
          FR1: NO NEWS / ABSTENTION (IONQ)
        </button>
        <button
          onClick={() => setActiveTab('timeout')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'timeout'
              ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
              : 'bg-surface-container text-outline hover:text-on-surface'
          }`}
        >
          FR2: TAXONOMY TIMEOUT (504)
        </button>
        <button
          onClick={() => setActiveTab('pltr')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'pltr'
              ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
              : 'bg-surface-container text-outline hover:text-on-surface'
            }`}
        >
          FR3/4: NO ANALOGS FOUND (PLTR)
        </button>
        <button
          onClick={() => setActiveTab('crwd')}
          className={`px-3 py-1.5 rounded transition-colors ${
            activeTab === 'crwd'
              ? 'bg-surface-container-highest text-primary font-bold shadow-xs'
              : 'bg-surface-container text-outline hover:text-on-surface'
          }`}
        >
          FR1: CONFLICT RESOLUTION (CRWD)
        </button>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold">Active Fault Events</div>
          <div className="text-base font-bold text-tertiary mt-1">0 Active Faults</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">Automated Recovery Engaged</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold">Math Engine Invariant</div>
          <div className="text-base font-bold text-primary mt-1">19.2ms Constant Time</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">Deterministic O(N) Execution</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold">Analog Rejection Rate</div>
          <div className="text-base font-bold text-secondary mt-1">38.4% Filtered</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">Strict &lt;65% Threshold</div>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5">
          <div className="text-[10px] text-outline uppercase font-semibold">Abstention Integrity</div>
          <div className="text-base font-bold text-tertiary mt-1">100% Non-Hallucinatory</div>
          <div className="text-[10px] text-on-surface-variant mt-0.5">SEC IA Guard Enforced</div>
        </div>
      </div>

      {/* 4 Detailed State Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State 1: IONQ */}
        {(activeTab === 'all' || activeTab === 'ionq') && (
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-on-surface">
                  FR1: NO NEWS / INSUFFICIENT EVIDENCE (IONQ)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-outline border border-outline-variant/40">
                  ABSTENTION ACTIVE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                When APIs return empty wire payloads or zero SEC filings in the 48-72h window, the model strictly abstains from inventing a synthetic narrative.
              </p>
              <div className="mt-2.5 p-2.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-xs">
                <div className="text-outline text-[10px]">Client Experience:</div>
                <div className="text-on-surface font-semibold text-[11px] mt-0.5">
                  Displays "INSUFFICIENT EVIDENCE (IONQ)" with neutral factor vector and zero trading order generation.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectTicker('IONQ');
                onNavigate('opportunity-check');
              }}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold transition-colors flex items-center justify-between"
            >
              <span>Inspect in Opportunity Check</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* State 2: AI Taxonomy Timeout */}
        {(activeTab === 'all' || activeTab === 'timeout') && (
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-on-surface">
                  FR2: AI INDUSTRY TAXONOMY TIMEOUT (HTTP 504)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary-container/30 text-secondary border border-secondary/40">
                  CACHED GICS FALLBACK
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                If the dynamic AI taxonomy service fails to return a response within 400ms, the engine automatically falls back to static GICS Sub-Industry maps without blocking the screening pipeline.
              </p>
              <div className="mt-2.5 p-2.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-xs">
                <div className="text-outline text-[10px]">Client Experience:</div>
                <div className="text-on-surface font-semibold text-[11px] mt-0.5">
                  Screening table renders instantly; subtle warning indicator displays "Static GICS Mode Engaged".
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onNavigate('stock-scanner');
                onNotify('info', 'Viewing Stock Scanner Fallback', 'GICS Fallback mode demonstrated in stock matrix');
              }}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold transition-colors flex items-center justify-between"
            >
              <span>Simulate in Stock Scanner</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* State 3: PLTR No Precedents */}
        {(activeTab === 'all' || activeTab === 'pltr') && (
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-on-surface">
                  FR3/4: NO HISTORICAL ANALOGS (PLTR)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-error-container/30 text-error border border-error/40">
                  GATE ABORT
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                If the target asset does not match any of the 30 curated historical precedents with &gt;65% structural correlation, the analog module explicitly reports non-correlation.
              </p>
              <div className="mt-2.5 p-2.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-xs">
                <div className="text-outline text-[10px]">Client Experience:</div>
                <div className="text-on-surface font-semibold text-[11px] mt-0.5">
                  "No Statistically Significant Analog Found" notice presented. Does not hallucinate fake chart patterns.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectTicker('PLTR');
                onNavigate('historical-precedents');
              }}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold transition-colors flex items-center justify-between"
            >
              <span>View Precedent Corpus</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* State 4: CRWD Conflict Resolution */}
        {(activeTab === 'all' || activeTab === 'crwd') && (
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-on-surface">
                  FR1: CONFLICTING WIRES RESOLUTION (CRWD)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-tertiary-container/30 text-tertiary border border-tertiary/40">
                  4.8:1 WEIGHTING
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                When simultaneous headlines contradict (e.g. severe incident reports vs positive recovery guidance), the engine weights official regulatory and primary filings over secondary blogs.
              </p>
              <div className="mt-2.5 p-2.5 bg-surface-container-lowest rounded border border-outline-variant/30 text-xs">
                <div className="text-outline text-[10px]">Client Experience:</div>
                <div className="text-on-surface font-semibold text-[11px] mt-0.5">
                  Commitment to deterministic verdict with comprehensive Conflict Disclosure banner explaining the decision.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onSelectTicker('NVDA');
                onNavigate('opportunity-check');
              }}
              className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold transition-colors flex items-center justify-between"
            >
              <span>Inspect Conflict Disclosure</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
        )}
      </div>

      {/* SLA Failure Taxonomy & Fallback Protocols Table */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl overflow-hidden shadow-md text-xs">
        <div className="p-3 bg-surface-container-highest/60 border-b border-outline-variant/40 font-bold text-on-surface">
          SLA FAILURE TAXONOMY &amp; RECOVERY PROTOCOLS
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 text-outline text-[11px]">
                <th className="py-2.5 px-3">FAILURE MODE</th>
                <th className="py-2.5 px-3">DETECTION VECTOR</th>
                <th className="py-2.5 px-3">FALLBACK ACTION</th>
                <th className="py-2.5 px-3">CLIENT STATE</th>
                <th className="py-2.5 px-3 text-right">RECOVERY SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-xs">
              <tr className="hover:bg-surface-container/60">
                <td className="py-2.5 px-3 font-bold text-primary">Websocket Drop</td>
                <td className="py-2.5 px-3 text-on-surface-variant">Heartbeat timeout &gt; 3,000ms</td>
                <td className="py-2.5 px-3 text-on-surface">Auto-switch to HTTPS REST polling</td>
                <td className="py-2.5 px-3 text-tertiary font-semibold">Zero UI Interruption</td>
                <td className="py-2.5 px-3 text-right font-bold text-on-surface">&lt; 800ms</td>
              </tr>
              <tr className="hover:bg-surface-container/60">
                <td className="py-2.5 px-3 font-bold text-primary">Rate Limit (429)</td>
                <td className="py-2.5 px-3 text-on-surface-variant">HTTP 429 Header received</td>
                <td className="py-2.5 px-3 text-on-surface">Redis Cache-Aside replay with TTL</td>
                <td className="py-2.5 px-3 text-secondary font-semibold">Cache Banner Highlighted</td>
                <td className="py-2.5 px-3 text-right font-bold text-on-surface">&lt; 50ms</td>
              </tr>
              <tr className="hover:bg-surface-container/60">
                <td className="py-2.5 px-3 font-bold text-primary">LLM Math Contamination</td>
                <td className="py-2.5 px-3 text-on-surface-variant">Zero-LLM invariant checksum mismatch</td>
                <td className="py-2.5 px-3 text-on-surface">Immediate task kill; pure C++ recalculation</td>
                <td className="py-2.5 px-3 text-tertiary font-semibold">Clean Mathematical Result</td>
                <td className="py-2.5 px-3 text-right font-bold text-on-surface">&lt; 15ms</td>
              </tr>
              <tr className="hover:bg-surface-container/60">
                <td className="py-2.5 px-3 font-bold text-primary">Invalid Regex Ticker</td>
                <td className="py-2.5 px-3 text-on-surface-variant">Non-conforming alphanumeric input</td>
                <td className="py-2.5 px-3 text-on-surface">Client-side sanitization clamp</td>
                <td className="py-2.5 px-3 text-error font-semibold">CWE-89 Rejection Badge</td>
                <td className="py-2.5 px-3 text-right font-bold text-on-surface">Instantaneous</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
