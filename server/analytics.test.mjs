import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalyticsBody, ALLOWED_ANALYTICS_EVENTS } from './analytics.js';

test('parseAnalyticsBody accepts known events', () => {
  const r = parseAnalyticsBody({
    event: 'page_view',
    sessionId: 'abc',
    path: '/',
    properties: { a: 'x' },
  });
  assert.equal(r.ok, true);
  assert.equal(r.value.event, 'page_view');
});

test('parseAnalyticsBody rejects unknown events', () => {
  const r = parseAnalyticsBody({ event: 'evil', sessionId: 'x' });
  assert.equal(r.ok, false);
});

test('ALLOWED_ANALYTICS_EVENTS includes funnel milestones', () => {
  for (const e of ['paywall_view', 'checkout_open', 'payment_success_client', 'share_create']) {
    assert.ok(ALLOWED_ANALYTICS_EVENTS.has(e), e);
  }
});
