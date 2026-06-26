import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ProtectedRoute from '../auth/ProtectedRoute';

function TestChild() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function LoginChild() {
  return <div data-testid="login-page">Login Page</div>;
}

function renderWithAuth({ route = '/', token = null } = {}) {
  if (token) {
    localStorage.setItem('token', token);
  }
  return render(
    React.createElement(MemoryRouter, { initialEntries: [route] },
      React.createElement(AuthProvider, null,
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/', element: React.createElement(LoginChild) }),
          React.createElement(Route, { path: '/protected', element: React.createElement(ProtectedRoute, null, React.createElement(TestChild)) })
        )
      )
    )
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders children when authenticated', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'SUCCESS', userId: 1, email: 'test@test.com', fullName: 'Test' })
      })
    );

    await act(async () => {
      renderWithAuth({ route: '/protected', token: 'valid-token' });
    });

    await act(async () => {
      // Wait for auth validation
      await new Promise(r => setTimeout(r, 100));
    });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    await act(async () => {
      renderWithAuth({ route: '/protected' });
    });

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
