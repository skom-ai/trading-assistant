/**
 * File: src/App.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W3.3 — Wire GovernanceAuditView to GET /api/v1/governance.
 *   The audit ledger + event counter are now driven by the live FR5 endpoint
 *   (via the shared typed client + governanceMapper), with the mock ledger
 *   kept as a typed fallback. The old client-side random-hash generation and
 *   the Math.random() event tick-up are removed (real data, not theatre).
 * Description:
 *   Root terminal shell: owns the active tab, selected ticker, universe, and
 *   the audit-ledger state fed to the Governance view. Modals and toasts are
 *   coordinated here; feature panes own their own live BFF calls.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavTab, AuditRecord } from './types/terminal';
import { INITIAL_AUDIT_RECORDS } from './data/mockTerminalData';
import { valtideApi } from './api/client';
import { useAsync } from './api/useAsync';
import {
  deriveEventCount,
  ledgerRecordsToAuditRecords,
} from './api/governanceMapper';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ScannerView } from './components/ScannerView';
import { NewsCatalystView } from './components/NewsCatalystView';
import { StrategyEngineView } from './components/StrategyEngineView';
import { GovernanceAuditView } from './components/GovernanceAuditView';
import { AuditCertificateModal } from './components/AuditCertificateModal';
import { FactorWeightsModal } from './components/FactorWeightsModal';
import { CitationModal } from './components/CitationModal';
import { GuardrailsModal } from './components/GuardrailsModal';
import { Toast } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('scanner-multi-factor');
  const [selectedTicker, setSelectedTicker] = useState<string>('NVDA');
  const [universe, setUniverse] = useState<string>('S&P 500');

  // Modals state
  const [certModalRecord, setCertModalRecord] = useState<AuditRecord | null>(null);
  const [factorModalOpen, setFactorModalOpen] = useState<boolean>(false);
  const [citationModalData, setCitationModalData] = useState<{ title: string; text: string } | null>(null);
  const [guardrailsModalOpen, setGuardrailsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live FR5 governance ledger driven by the shared typed client + hook.
  const gov = useAsync(valtideApi.governance);
  const govError = gov.state.status === 'error' ? gov.state.error : null;

  /** Load the live audit ledger from GET /api/v1/governance. */
  const loadGovernance = useCallback(() => {
    void gov.run();
  }, [gov]);

  // Fetch the real ledger once on mount so the Governance view opens live.
  useEffect(() => {
    loadGovernance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map live records -> AuditRecord[]; fall back to the typed mock ledger when
  // the fetch has not succeeded yet or returned no rows (view never blanks).
  const liveRecords = useMemo<AuditRecord[] | null>(() => {
    if (gov.state.status !== 'success') return null;
    const mapped = ledgerRecordsToAuditRecords(gov.state.data.records);
    return mapped.length > 0 ? mapped : null;
  }, [gov.state]);
  const auditRecords = liveRecords ?? INITIAL_AUDIT_RECORDS;
  const isLive = liveRecords !== null;

  // Real event count derived from live data (record + verified-claims count);
  // the mock count stands in only while on the fallback ledger.
  const eventCount = useMemo<number>(() => {
    if (gov.state.status === 'success') {
      return deriveEventCount(
        gov.state.data.records,
        gov.state.data.canonicalBundle,
      );
    }
    return INITIAL_AUDIT_RECORDS.length;
  }, [gov.state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handleSelectStockForStrategy = (ticker: string) => {
    setSelectedTicker(ticker);
    setActiveTab('strategy-engine-precedents');
    showToast(`Loaded deterministic strategy matrix for ${ticker}`);
  };

  const handleSelectStockForNews = (ticker: string) => {
    setSelectedTicker(ticker);
    setActiveTab('news-catalyst-check');
    showToast(`Scanning NLP sentiment & filings for ${ticker}`);
  };

  // A strategy run persists its own audit row server-side (BFF -> agent -> DB),
  // so instead of fabricating a random-hash local row we re-fetch the real
  // append-only ledger. The ticker/correlationId/feature args are retained for
  // the StrategyEngineView contract but no longer mint client-side state.
  const handleCommitAuditRecord = (ticker: string) => {
    loadGovernance();
    showToast(`Audit ledger refreshed from WORM storage for ${ticker}`);
  };

  const handleApplyFactorWeights = (weights: { pe: number; mom: number; rsi: number; vol: number }) => {
    showToast(`Factor weights adjusted (PE: ${weights.pe}%, Mom: ${weights.mom}%, RSI: ${weights.rsi}%, Vol: ${weights.vol}%)`);
  };

  return (
    <div className="min-h-screen bg-[var(--c-09090b)] text-[var(--c-fafafa)] flex flex-col font-['Inter'] selection:bg-[var(--c-7c3aed)] selection:text-[var(--c-ede9fe)]">
      {/* Persistent Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        universe={universe}
        setUniverse={setUniverse}
        openGuardrailsModal={() => setGuardrailsModalOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="w-full pt-14 bg-[var(--c-09090b)] min-h-screen flex-1 flex flex-col">
        {activeTab === 'scanner-multi-factor' && (
          <ScannerView
            onSelectStockForStrategy={handleSelectStockForStrategy}
            onSelectStockForNews={handleSelectStockForNews}
            onOpenFactorWeightsModal={() => setFactorModalOpen(true)}
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
            universe={universe}
            setUniverse={setUniverse}
          />
        )}

        {activeTab === 'news-catalyst-check' && (
          <NewsCatalystView
            onSelectStockForStrategy={handleSelectStockForStrategy}
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
            onOpenCitationModal={(title, text) => setCitationModalData({ title, text })}
          />
        )}

        {activeTab === 'strategy-engine-precedents' && (
          <StrategyEngineView
            selectedTicker={selectedTicker}
            setSelectedTicker={setSelectedTicker}
            onCommitAuditRecord={handleCommitAuditRecord}
            onOpenCitationModal={(title, text) => setCitationModalData({ title, text })}
          />
        )}

        {activeTab === 'governance-audit-log' && (
          <GovernanceAuditView
            auditRecords={auditRecords}
            eventCount={eventCount}
            isLive={isLive}
            isLoading={gov.isLoading}
            errorMessage={govError?.message ?? null}
            onRetry={loadGovernance}
            onOpenAuditPackageModal={rec => setCertModalRecord(rec)}
          />
        )}
      </main>

      {/* Persistent Terminal Footer */}
      <Footer />

      {/* Modals & Dialogs */}
      <AuditCertificateModal
        record={certModalRecord}
        onClose={() => setCertModalRecord(null)}
      />

      <FactorWeightsModal
        isOpen={factorModalOpen}
        onClose={() => setFactorModalOpen(false)}
        onApply={handleApplyFactorWeights}
      />

      <CitationModal
        citation={citationModalData}
        onClose={() => setCitationModalData(null)}
      />

      <GuardrailsModal
        isOpen={guardrailsModalOpen}
        onClose={() => setGuardrailsModalOpen(false)}
      />

      {/* Notification Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
