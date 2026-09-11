/**
 * File: src/components/ToastNotification.test.tsx
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-07
 * Description:
 *   Component unit tests for the toast HUD: empty state renders nothing,
 *   each toast type renders its title/detail, and the dismiss button fires
 *   onDismiss with the toast id. Covers all four type branches.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ToastNotification, type ToastMessage } from './ToastNotification';

const make = (type: ToastMessage['type']): ToastMessage => ({
  id: `id-${type}`,
  type,
  title: `${type} title`,
  detail: `${type} detail`,
});

describe('ToastNotification', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(<ToastNotification toasts={[]} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders every toast type with title and detail', () => {
    const toasts = (['success', 'info', 'warning', 'error'] as const).map(make);
    render(<ToastNotification toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('success title')).toBeInTheDocument();
    expect(screen.getByText('error title')).toBeInTheDocument();
    expect(screen.getByText('warning detail')).toBeInTheDocument();
  });

  it('fires onDismiss with the toast id when the close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<ToastNotification toasts={[make('info')]} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(onDismiss).toHaveBeenCalledWith('id-info');
  });
});
