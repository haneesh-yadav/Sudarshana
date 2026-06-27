import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import LandingPage from '../components/Main';

function renderLanding() {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ clientId: 'test-client-id' }) })
  );

  return render(
    React.createElement(MemoryRouter, { initialEntries: ['/'] },
      React.createElement(AuthProvider, null,
        React.createElement(LandingPage)
      )
    )
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders brand name', async () => {
    renderLanding();
    const elements = await screen.findAllByText('Sudarshana');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders without crashing', () => {
    const { container } = renderLanding();
    expect(container).toBeInTheDocument();
  });
});
