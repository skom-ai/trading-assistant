/**
 * File: src/components/Header.theme.test.tsx
 * Author: Sunil+Ai Assistant
 * Work-item: FEAT-002 — Theme toggle UI + focused test.
 * Description:
 *   Focused test for the Header theme toggle. Asserts the dark default
 *   (anti-flash script simulated via document.documentElement.className),
 *   the dark<->light switch (document.documentElement .dark class +
 *   localStorage 'theme' + dynamic aria-label), and the pure
 *   resolveInitialTheme precedence cases.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { resolveInitialTheme } from '../hooks/useTheme';

// localStorage mock (jsdom provides one, but a clean in-memory stub keeps the
// test hermetic and lets beforeEach reset deterministically).
beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: true, // prefers dark
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  localStorage.clear();
  // Simulate the anti-flash script having applied dark before paint.
  document.documentElement.className = 'dark';
});

describe('Header theme toggle', () => {
  it('defaults to dark and switches to light on click', () => {
    render(
      <Header
        activeTab="scanner-multi-factor"
        setActiveTab={vi.fn()}
        universe="S&P 500"
        setUniverse={vi.fn()}
        openGuardrailsModal={vi.fn()}
      />
    );

    const toggle = screen.getByRole('button', { name: 'Switch to light mode' });
    expect(toggle).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(toggle);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeTruthy();
  });
});

describe('resolveInitialTheme', () => {
  it('honors a stored value over the OS preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('falls back to the OS preference when nothing is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
  });
});
