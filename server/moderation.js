/**
 * Lightweight proposal moderation (length / basic sanity).
 * @param {string} text
 * @returns {{ ok: boolean, text?: string, reason?: string }}
 */
export function moderateProposalText(text) {
  if (typeof text !== 'string') {
    return { ok: false, reason: 'invalid' };
  }
  const t = text.trim();
  if (t.length === 0) {
    return { ok: false, reason: 'empty' };
  }
  if (t.length > 4000) {
    return { ok: false, reason: 'too_long' };
  }
  return { ok: true, text: t };
}
