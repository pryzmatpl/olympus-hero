import { getAttribution } from './attribution';

const SESSION_KEY = 'mh_analytics_session_v1';

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  try {
    let s = sessionStorage.getItem(SESSION_KEY);
    if (!s) {
      s =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return `fallback_${Date.now()}`;
  }
}

export function track(
  event: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return;
  const merged: Record<string, string | number | boolean> = {
    ...getAttribution(),
    ...(properties || {}),
  };
  const payload = {
    event,
    sessionId: getSessionId(),
    path: `${window.location.pathname}${window.location.search}`,
    properties: merged,
  };
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        '/api/analytics/event',
        new Blob([body], { type: 'application/json' })
      );
      if (ok) return;
    }
  } catch {
    /* fall through */
  }
  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
