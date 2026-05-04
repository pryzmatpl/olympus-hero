import { connectDB } from './db.js';

export const ALLOWED_ANALYTICS_EVENTS = new Set([
  'page_view',
  'landing_view',
  'cta_create_click',
  'register_success',
  'register_success_server',
  'login_success',
  'hero_generate_start',
  'hero_generate_success',
  'paywall_view',
  'checkout_open',
  'checkout_open_server',
  'payment_success',
  'payment_success_client',
  'payment_success_webhook',
  'share_create',
  'share_visit',
  'checkout_submit',
  'experiment_assign',
  'quest_pulse_view',
  'quest_pulse_complete',
]);

function safeProperties(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (Object.keys(out).length >= 32) break;
    if (typeof k !== 'string' || k.length > 48) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 240);
    else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

export function parseAnalyticsBody(body) {
  const event = typeof body?.event === 'string' ? body.event : '';
  if (!ALLOWED_ANALYTICS_EVENTS.has(event)) {
    return { ok: false, error: 'Invalid event name' };
  }
  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.length > 0 && body.sessionId.length <= 80
      ? body.sessionId
      : 'unknown';
  const path =
    typeof body.path === 'string' && body.path.length <= 512 ? body.path : '';
  const properties = safeProperties(body.properties);
  return { ok: true, value: { event, sessionId, path, properties } };
}

export async function insertAnalyticsEvent(doc) {
  const db = await connectDB();
  await db.collection('analytics_events').insertOne({
    ...doc,
    ts: new Date(),
  });
}
