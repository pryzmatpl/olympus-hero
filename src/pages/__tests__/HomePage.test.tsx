import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { AuthContext } from '../../App';
import HomePage from '../HomePage';

vi.mock('../../components/ui/MetaTags', () => ({ default: () => null }));

vi.mock('../../utils/analytics', () => ({
  track: vi.fn(),
}));

const authGuest = {
  isAuthenticated: false,
  user: null,
  token: null,
  login: vi.fn(),
  logout: vi.fn(),
};

const authUser = {
  isAuthenticated: true,
  user: { name: 'Test' },
  token: 'tok',
  login: vi.fn(),
  logout: vi.fn(),
};

function renderHome(auth: typeof authGuest) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthContext.Provider value={auth}>
        <HomePage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces Mythical Hero headline and guest primary CTA to registration', () => {
    renderHome(authGuest);

    expect(screen.getByRole('heading', { level: 1, name: /commence with glory/i })).toBeTruthy();
    const beginLinks = screen.getAllByRole('link', { name: /begin free/i });
    expect(beginLinks.length).toBeGreaterThanOrEqual(1);
    beginLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/register');
    });
  });

  it('sends signed-in users to the creator from the primary CTA', () => {
    renderHome(authUser);

    const beginLinks = screen.getAllByRole('link', { name: /begin free|enter the forge|open the forge/i });
    const primary = beginLinks.find((el) => el.getAttribute('href') === '/create');
    expect(primary).toBeTruthy();
  });
});
