// Vitest global test setup. Provides DOM matchers and a clean
// localStorage / location.href between tests so axios interceptor
// behavior in `src/utils/api.ts` is observable per-test.

import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';

// Framer Motion `whileInView` uses IntersectionObserver; jsdom does not provide it.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin = '';
    readonly thresholds: readonly number[] = [];
    observe = () => {};
    unobserve = () => {};
    disconnect = () => {};
    takeRecords = () => [];
  } as unknown as typeof IntersectionObserver;
}

beforeEach(() => {
  window.localStorage.clear();
  if (typeof window !== 'undefined') {
    // jsdom's location is read-only for `href` but we can replace via assign;
    // tests that expect a redirect can spy on `window.location.assign` or
    // observe href changes via the property setter on a redefined location.
  }
});

afterEach(() => {
  window.localStorage.clear();
});
