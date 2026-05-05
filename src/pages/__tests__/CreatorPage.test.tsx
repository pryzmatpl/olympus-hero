// Frontend contract test for the "one unpaid hero at a time" rule.
// Risk: a paying customer is allowed past the gate while still owing
// a paid upgrade, or a paid customer is wrongly blocked. The rule
// is enforced server-side AND advertised on mount via /api/user/heroes
// so this test pins the client behavior for both directions.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

const { navigateMock, apiMock, showNotificationMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  apiMock: { get: vi.fn(), post: vi.fn() },
  showNotificationMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('../../utils/api', () => ({ default: apiMock }));
vi.mock('../../utils/api.ts', () => ({ default: apiMock }));

// Stub heavy or DOM-bound child components so this test focuses on the
// gating behavior rather than re-asserting their internals.
vi.mock('../../components/ui/MetaTags', () => ({ default: () => null }));
vi.mock('../../components/form/DatePickerInput', () => ({ default: () => null }));

vi.mock('../../context/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: showNotificationMock,
    hideNotification: vi.fn(),
  }),
}));

vi.mock('../../utils/analytics', () => ({
  track: vi.fn(),
  getSessionId: () => 'test-session',
}));

import CreatorPage from '../CreatorPage';

function renderCreator() {
  return render(
    <MemoryRouter initialEntries={['/create']}>
      <CreatorPage />
    </MemoryRouter>,
  );
}

describe('CreatorPage one-unpaid-hero gate', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    apiMock.get.mockReset();
    apiMock.post.mockReset();
    showNotificationMock.mockReset();
    window.localStorage.setItem('authToken', 'tok-test');
  });

  it('redirects to /heroes and notifies the user when an unpaid hero already exists', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: { heroes: [{ id: 'h1', paymentStatus: 'unpaid' }] },
    });

    renderCreator();

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/heroes');
    });
    expect(apiMock.get).toHaveBeenCalledWith('/api/user/heroes');
    expect(showNotificationMock).toHaveBeenCalledWith(
      'info',
      expect.stringMatching(/unpaid|one/i),
      expect.any(String),
      true,
      expect.any(Number),
    );
    cleanup();
  });

  it('does NOT redirect when every hero is already paid', async () => {
    apiMock.get.mockResolvedValueOnce({
      data: {
        heroes: [
          { id: 'h1', paymentStatus: 'paid' },
          { id: 'h2', paymentStatus: 'paid' },
        ],
      },
    });

    renderCreator();

    // Wait for the effect to finish; ensure no navigation is triggered.
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    expect(navigateMock).not.toHaveBeenCalled();
    expect(showNotificationMock).not.toHaveBeenCalled();
    cleanup();
  });

  it('does not call /api/user/heroes when there is no auth token (skips the gate)', async () => {
    window.localStorage.removeItem('authToken');

    renderCreator();

    // Give effects a tick to run without performing the API call.
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(apiMock.get).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
    cleanup();
  });
});
