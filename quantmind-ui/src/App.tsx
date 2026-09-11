/**
 * File: src/App.tsx
 * Description: QuantMind source module.
 * Source: specs/arch
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 */
import { useState, useCallback } from 'react';
import { ModuleId } from './types';
import { Navigation } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { StrategyStudio } from './components/StrategyStudio';
import { StockScanner } from './components/StockScanner';
import { OpportunityCheck } from './components/OpportunityCheck';
import { HistoricalPrecedents } from './components/HistoricalPrecedents';
import { AuditLedger } from './components/AuditLedger';
import { ResilienceMatrix } from './components/ResilienceMatrix';
import { ComponentShowcase } from './components/ComponentShowcase';
import { FormulaModal } from './components/FormulaModal';
import { ToastNotification, ToastMessage } from './components/ToastNotification';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>('strategy-studio');
  const [activeTicker, setActiveTicker] = useState<string>('NVDA');
  const [formulaModalOpen, setFormulaModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: 'success' | 'info' | 'warning' | 'error', title: string, detail?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, detail };
      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4.5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSelectTicker = (ticker: string) => {
    setActiveTicker(ticker);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar Navigation */}
      <Navigation
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        activeTicker={activeTicker}
        onSelectTicker={handleSelectTicker}
      />

      <div className="flex-1 flex w-full">
        {/* Left Desktop Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          activeTicker={activeTicker}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden min-w-0">
          {activeModule === 'strategy-studio' && (
            <StrategyStudio
              activeTicker={activeTicker}
              onNavigate={setActiveModule}
              onNotify={addToast}
            />
          )}

          {activeModule === 'stock-scanner' && (
            <StockScanner
              onSelectTicker={handleSelectTicker}
              onNavigate={setActiveModule}
              onOpenFormula={() => setFormulaModalOpen(true)}
              onNotify={addToast}
            />
          )}

          {activeModule === 'opportunity-check' && (
            <OpportunityCheck
              activeTicker={activeTicker}
              onSelectTicker={handleSelectTicker}
              onNavigate={setActiveModule}
              onNotify={addToast}
            />
          )}

          {activeModule === 'historical-precedents' && (
            <HistoricalPrecedents
              onSelectTicker={handleSelectTicker}
              onNavigate={setActiveModule}
              onNotify={addToast}
            />
          )}

          {activeModule === 'audit-and-citations' && (
            <AuditLedger
              onSelectTicker={handleSelectTicker}
              onNavigate={setActiveModule}
              onNotify={addToast}
            />
          )}

          {activeModule === 'edge-cases' && (
            <ResilienceMatrix
              onSelectTicker={handleSelectTicker}
              onNavigate={setActiveModule}
              onNotify={addToast}
            />
          )}

          {activeModule === 'component-showcase' && (
            <ComponentShowcase
              onSelectTicker={handleSelectTicker}
              onNavigate={setActiveModule}
              onNotify={addToast}
            />
          )}
        </main>
      </div>

      {/* Zero-LLM Math Formula Transparency Modal */}
      <FormulaModal
        isOpen={formulaModalOpen}
        onClose={() => setFormulaModalOpen(false)}
      />

      {/* Floating HUD Toast Notification System */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
