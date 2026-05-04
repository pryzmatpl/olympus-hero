const ATTR_KEY = 'mh_attribution_v1';

export function initAttributionFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(ATTR_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const keys = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'gclid',
      'fbclid',
    ] as const;
    const out: Record<string, string> = {};
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) out[k] = v.slice(0, 120);
    });
    if (document.referrer) {
      out.referrer = document.referrer.slice(0, 240);
    }
    if (Object.keys(out).length > 0) {
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(out));
    }
  } catch {
    /* ignore */
  }
}

export function getAttribution(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}
