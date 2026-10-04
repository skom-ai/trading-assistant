import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { NavTab } from '../types/terminal';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  universe: string;
  setUniverse: (u: string) => void;
  openGuardrailsModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  universe,
  setUniverse,
  openGuardrailsModal
}) => {
  const [utcTime, setUtcTime] = useState('');
  const [estTime, setEstTime] = useState('');
  const [ping, setPing] = useState(12);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setUtcTime(
        now.toUTCString().slice(17, 25)
      );
      // EST is UTC-5 / EDT is UTC-4
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setEstTime(estFormatter.format(now));
    };

    updateClocks();
    const clockInterval = setInterval(updateClocks, 1000);

    // Subtle random ping fluctuation
    const pingInterval = setInterval(() => {
      setPing(prev => {
        const delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.min(16, Math.max(9, prev + delta));
      });
    }, 4000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(pingInterval);
    };
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--c-070709)]/90 backdrop-blur-md border-b border-[var(--c-27272a)]/60">
      <div className="h-14 w-full px-4 flex items-center justify-between gap-4">
        {/* Left Side: Brand, Universe, Navigation */}
        <div className="flex items-center gap-3 xl:gap-4">
          {/* Logo & Latency */}
          <div 
            className="flex items-center gap-1.5 cursor-pointer group"
            onClick={() => setActiveTab('scanner-multi-factor')}
          >
            <span className="font-bold tracking-tight text-[var(--c-fafafa)] text-lg font-['Inter']">Valtide</span>
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--c-34d399)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--c-34d399)]"></span>
            </span>
            <span className="font-mono text-xs text-[var(--c-34d399)] pl-0.5 font-medium">{ping}ms</span>
          </div>

          <div className="h-4 w-px bg-[var(--c-27272a)]"></div>

          {/* Universe Badge / Toggle */}
          <button 
            onClick={() => setUniverse(universe === 'S&P 500' ? 'Top 500 Market Cap' : 'S&P 500')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] hover:border-[var(--c-52525b)] transition-colors"
            title="Click to toggle universe"
          >
            <span className="text-[10px] uppercase tracking-wider text-[var(--c-71717a)] font-semibold font-mono">UNIVERSE:</span>
            <span className="text-xs text-[var(--c-fafafa)] font-semibold font-mono">{universe}</span>
          </button>

          {/* Main Navigation Tabs */}
          <nav className="flex items-center gap-1 ml-1 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('scanner-multi-factor')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap font-medium ${
                activeTab === 'scanner-multi-factor'
                  ? 'bg-[var(--c-18181b)] text-[var(--c-a78bfa)] border border-[var(--c-a78bfa)]/40 font-semibold shadow-sm'
                  : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] hover:bg-[var(--c-121215)]'
              }`}
            >
              Scanner &amp; Multi-Factor
            </button>

            <button
              onClick={() => setActiveTab('news-catalyst-check')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap font-medium ${
                activeTab === 'news-catalyst-check'
                  ? 'bg-[var(--c-18181b)] text-[var(--c-a78bfa)] border border-[var(--c-a78bfa)]/40 font-semibold shadow-sm'
                  : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] hover:bg-[var(--c-121215)]'
              }`}
            >
              News Catalyst Check
            </button>

            <button
              onClick={() => setActiveTab('strategy-engine-precedents')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap font-medium ${
                activeTab === 'strategy-engine-precedents'
                  ? 'bg-[var(--c-18181b)] text-[var(--c-a78bfa)] border border-[var(--c-a78bfa)]/40 font-semibold shadow-sm'
                  : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] hover:bg-[var(--c-121215)]'
              }`}
            >
              Strategy Engine &amp; Precedents
            </button>

            <button
              onClick={() => setActiveTab('governance-audit-log')}
              className={`px-3 py-1.5 rounded text-xs transition-colors whitespace-nowrap font-medium ${
                activeTab === 'governance-audit-log'
                  ? 'bg-[var(--c-18181b)] text-[var(--c-a78bfa)] border border-[var(--c-a78bfa)]/40 font-semibold shadow-sm'
                  : 'text-[var(--c-a1a1aa)] hover:text-[var(--c-fafafa)] hover:bg-[var(--c-121215)]'
              }`}
            >
              Governance &amp; Audit Log
            </button>
          </nav>
        </div>

        {/* Right Side: Clocks, Guardrails, VIX, Desk, Avatar */}
        <div className="flex items-center gap-3 xl:gap-4 shrink-0">
          {/* Live UTC & EST Clocks */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-[var(--c-a1a1aa)] font-mono">
            <span className="text-[var(--c-71717a)]">UTC</span>
            <span>{utcTime || '14:32:08'}</span>
            <span className="text-[var(--c-27272a)]">|</span>
            <span className="text-[var(--c-71717a)]">EST</span>
            <span className="text-[var(--c-fafafa)] font-semibold">{estTime || '10:32:08'}</span>
          </div>

          {/* Active Guardrails Pill */}
          <div 
            onClick={openGuardrailsModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--c-065f46)]/20 border border-[var(--c-065f46)]/50 text-[var(--c-34d399)] cursor-pointer hover:bg-[var(--c-065f46)]/30 transition-colors"
            title="Click to view FINRA 2210 & SEC-IA system guardrails"
          >
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            <span className="text-xs font-semibold tracking-tight font-mono">FINRA 2210 / SEC-IA Guardrails Active</span>
          </div>

          {/* VIX Level */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] text-xs font-mono">
            <span className="text-[var(--c-71717a)]">VIX:</span>
            <span className="font-semibold text-[var(--c-a78bfa)]">14.2</span>
            <span className="text-[var(--c-34d399)] font-bold">LOW</span>
          </div>

          {/* Desk Tag */}
          <div className="px-2.5 py-1 rounded bg-[var(--c-27272a)]/60 border border-[var(--c-52525b)]/40 text-[var(--c-a1a1aa)] text-xs font-semibold tracking-wider font-mono hidden md:block">
            INSTITUTIONAL DESK
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center px-2.5 py-1 rounded bg-[var(--c-121215)] border border-[var(--c-27272a)] text-[var(--c-a1a1aa)] hover:border-[var(--c-52525b)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--c-a78bfa)]"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-8 h-8 rounded-full bg-[var(--c-7c3aed)] text-[var(--c-ede9fe)] flex items-center justify-center shrink-0 font-bold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--c-a78bfa)]"
              aria-label="User profile & desk settings"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>

            {profileOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-[var(--c-121215)] border border-[var(--c-27272a)] rounded-xl shadow-2xl p-4 text-xs z-50"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-[var(--c-27272a)]">
                  <div className="w-9 h-9 rounded-full bg-[var(--c-7c3aed)] flex items-center justify-center font-bold text-white">
                    SK
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--c-fafafa)]">Trader Desk #4</div>
                    <div className="text-[var(--c-71717a)] font-mono text-[11px]">skommirk@gmail.com</div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 font-mono text-[var(--c-a1a1aa)] text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--c-71717a)]">Jurisdiction:</span>
                    <span className="text-[var(--c-fafafa)]">NY-DESK-4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--c-71717a)]">Route:</span>
                    <span className="text-[var(--c-34d399)]">DMA-DIRECT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--c-71717a)]">Retention:</span>
                    <span className="text-[var(--c-fafafa)]">SEC Rule 17a-4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--c-71717a)]">API Gateway:</span>
                    <span className="text-[var(--c-34d399)]">Secured (TLS 1.3)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--c-27272a)] flex justify-between items-center">
                  <span className="text-[10px] text-[var(--c-71717a)]">v4.2.0-PROD</span>
                  <button 
                    onClick={() => setProfileOpen(false)}
                    className="text-[var(--c-a78bfa)] hover:underline text-[11px] font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
