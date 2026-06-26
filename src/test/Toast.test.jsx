import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Toast from '../components/Toast';

describe('Toast component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders nothing when there are no toasts', () => {
    const { container } = render(React.createElement(Toast));
    expect(container.firstChild).toBeNull();
  });

  it('renders a toast when tg-toast event is dispatched', () => {
    render(React.createElement(Toast));

    act(() => {
      window.dispatchEvent(
        new CustomEvent('tg-toast', { detail: { message: 'Test message', type: 'info' } })
      );
    });

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    render(React.createElement(Toast));

    act(() => {
      window.dispatchEvent(
        new CustomEvent('tg-toast', { detail: { message: 'First', type: 'info' } })
      );
    });
    act(() => {
      window.dispatchEvent(
        new CustomEvent('tg-toast', { detail: { message: 'Second', type: 'error' } })
      );
    });

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('auto-removes toast after 4 seconds', () => {
    render(React.createElement(Toast));

    act(() => {
      window.dispatchEvent(
        new CustomEvent('tg-toast', { detail: { message: 'Auto-remove', type: 'success' } })
      );
    });

    expect(screen.getByText('Auto-remove')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Auto-remove')).not.toBeInTheDocument();
  });

  it('dismisses toast when close button is clicked', () => {
    render(React.createElement(Toast));

    act(() => {
      window.dispatchEvent(
        new CustomEvent('tg-toast', { detail: { message: 'Dismiss me', type: 'warning' } })
      );
    });

    expect(screen.getByText('Dismiss me')).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss');
    act(() => {
      dismissBtn.click();
    });

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });
});
