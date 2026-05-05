// Frontend contract tests for the shared axios instance.
// Risk: silent loss of session, redirect loops on auth pages, and
// missing user-facing messaging when the AI provider is throttled.
// These behaviors are wired via interceptors that are easy to break
// during refactors, so the test suite locks the contract.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import api, {
  apiEvents,
  API_ERROR_EVENTS,
  checkOpenAIQuotaStatus,
} from '../api';

type MutableLocation = { href: string };

let originalLocation: Location;
let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(api);
  originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { href: '/' } as MutableLocation,
  });
});

afterEach(() => {
  mock.restore();
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: originalLocation,
  });
});

describe('401 interceptor', () => {
  it('clears auth state and redirects to /login on 401 for non-auth endpoints', async () => {
    window.localStorage.setItem('authToken', 'tok-123');
    window.localStorage.setItem('user', '{"id":"u"}');
    mock.onGet('/api/heroes/abc').reply(401, { error: 'Unauthorized' });

    await expect(api.get('/api/heroes/abc')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(window.localStorage.getItem('authToken')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
    expect((window.location as MutableLocation).href).toBe('/login');
  });

  it('does NOT redirect or clear storage when /api/auth/login itself returns 401', async () => {
    window.localStorage.setItem('authToken', 'tok-keep');
    mock.onPost('/api/auth/login').reply(401, { error: 'Invalid credentials' });

    await expect(
      api.post('/api/auth/login', { email: 'a', password: 'b' }),
    ).rejects.toMatchObject({ response: { status: 401 } });

    expect(window.localStorage.getItem('authToken')).toBe('tok-keep');
    expect((window.location as MutableLocation).href).toBe('/');
  });

  it('fills in a friendly error message when /api/auth/* returns 401 with no body', async () => {
    mock.onPost('/api/auth/register').reply(401, undefined);

    let caught: { response?: { data?: { error?: string } } } | undefined;
    try {
      await api.post('/api/auth/register', {});
    } catch (err) {
      caught = err as typeof caught;
    }
    expect(caught?.response?.data?.error).toMatch(/Authentication failed/i);
  });
});

describe('quota event emission', () => {
  it('emits OPENAI_QUOTA_EXCEEDED when response includes errorType=quota_exceeded', async () => {
    mock.onPost('/api/create-payment-intent').reply(429, {
      errorType: 'quota_exceeded',
      error: 'OpenAI quota',
      message: 'Try later',
    });
    const handler = vi.fn();
    apiEvents.on(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handler);

    await expect(api.post('/api/create-payment-intent', {})).rejects.toBeDefined();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      message: 'Try later',
      status: 429,
    });

    apiEvents.off(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handler);
  });

  it('emits OPENAI_QUOTA_EXCEEDED on 429 when message contains "quota" keywords', async () => {
    mock.onGet('/api/heroes/1/storybook').reply(429, {
      error: 'You exceeded your current quota',
    });
    const handler = vi.fn();
    apiEvents.on(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handler);

    await expect(api.get('/api/heroes/1/storybook')).rejects.toMatchObject({
      isOpenAIQuotaExceeded: true,
    });
    expect(handler).toHaveBeenCalledTimes(1);

    apiEvents.off(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handler);
  });

  it('does NOT emit a quota event for unrelated server errors', async () => {
    mock.onGet('/api/heroes/zzz').reply(500, { error: 'oops' });
    const handler = vi.fn();
    apiEvents.on(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handler);

    await expect(api.get('/api/heroes/zzz')).rejects.toBeDefined();
    expect(handler).not.toHaveBeenCalled();

    apiEvents.off(API_ERROR_EVENTS.OPENAI_QUOTA_EXCEEDED, handler);
  });
});

describe('checkOpenAIQuotaStatus', () => {
  it('returns isQuotaExceeded=false when the quota endpoint responds 200', async () => {
    mock.onGet('/api/status/openai-quota').reply(200, { message: 'Quota OK' });

    const result = await checkOpenAIQuotaStatus();

    expect(result.isQuotaExceeded).toBe(false);
    expect(result.message).toBe('Quota OK');
  });

  it('returns isQuotaExceeded=true when the quota endpoint responds 429', async () => {
    mock.onGet('/api/status/openai-quota').reply(429, {
      message: 'Quota exhausted',
    });

    const result = await checkOpenAIQuotaStatus();

    expect(result.isQuotaExceeded).toBe(true);
    expect(result.message).toBe('Quota exhausted');
  });

  it('treats unknown failures as quota-exceeded for safety', async () => {
    mock.onGet('/api/status/openai-quota').networkError();

    const result = await checkOpenAIQuotaStatus();

    expect(result.isQuotaExceeded).toBe(true);
    expect(result.message).toMatch(/Unable to verify/i);
  });
});
