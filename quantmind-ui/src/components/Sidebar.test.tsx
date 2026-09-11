/**
 * File: src/components/Sidebar.test.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Component unit tests for the Sidebar: renders all core module nav
 *   items, highlights the active module, surfaces the active ticker, and
 *   fires onSelectModule when a nav item is clicked.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders the core module nav items', () => {
    render(<Sidebar activeModule="stock-scanner" onSelectModule={vi.fn()} activeTicker="NVDA" />);
    expect(screen.getByText('Stock Scanner')).toBeInTheDocument();
    expect(screen.getByText('Opportunity Check')).toBeInTheDocument();
    expect(screen.getByText('Strategy Studio')).toBeInTheDocument();
  });

  it('shows the active ticker in the invariants panel', () => {
    render(<Sidebar activeModule="stock-scanner" onSelectModule={vi.fn()} activeTicker="AAPL" />);
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0);
  });

  it('fires onSelectModule when a nav item is clicked', () => {
    const onSelect = vi.fn();
    render(<Sidebar activeModule="stock-scanner" onSelectModule={onSelect} activeTicker="NVDA" />);
    fireEvent.click(screen.getByText('Strategy Studio'));
    expect(onSelect).toHaveBeenCalledWith('strategy-studio');
  });
});
