import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth/AuthContext';

function AuthConsumer() {
  const { isAuthenticated, authReady, user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="authReady">{String(authReady)}</span>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="token">{token || 'null'}</span>
      <span data-testid="userEmail">{user?.email || 'null'}</span>
      <button data-testid="loginBtn" onClick={() => login({ token: 'test-token', userId: '1', email: 'test@test.com', fullName: 'Test User' })}>Login</button>
      <button data-testid="logoutBtn" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides unauthenticated state when no token exists', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    await act(async () => {
      render(
        React.createElement(AuthProvider, null,
          React.createElement(AuthConsumer)
        )
      );
    });

    expect(screen.getByTestId('authReady').textContent).toBe('true');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('token').textContent).toBe('null');
  });

  it('login sets token and user in context and localStorage', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    await act(async () => {
      render(
        React.createElement(AuthProvider, null,
          React.createElement(AuthConsumer)
        )
      );
    });

    await act(async () => {
      screen.getByTestId('loginBtn').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('test-token');
    expect(screen.getByTestId('userEmail').textContent).toBe('test@test.com');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(localStorage.getItem('token')).toBe('test-token');
    expect(localStorage.getItem('userEmail')).toBe('test@test.com');
  });

  it('logout clears token and user from context and localStorage', async () => {
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('userEmail', 'user@test.com');

    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    await act(async () => {
      render(
        React.createElement(AuthProvider, null,
          React.createElement(AuthConsumer)
        )
      );
    });

    await act(async () => {
      screen.getByTestId('logoutBtn').click();
    });

    expect(screen.getByTestId('token').textContent).toBe('null');
    expect(screen.getByTestId('userEmail').textContent).toBe('null');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('useAuth throws when used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      render(React.createElement(AuthConsumer));
    }).toThrow('useAuth must be used within an AuthProvider');
    consoleSpy.mockRestore();
  });
});
