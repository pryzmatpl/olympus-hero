import { v4 as uuidv4 } from 'uuid';
import { moderateProposalText } from './moderation.js';

export const LORE_LINE_MAX = 480;
export const LORE_JOURNAL_MAX_ENTRIES = 220;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validatePulseDay(day) {
  if (typeof day !== 'string' || !DAY_RE.test(day)) return false;
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function assertLoreText(text) {
  const m = moderateProposalText(text);
  if (!m.ok) return m;
  if (m.text.length > LORE_LINE_MAX) {
    return { ok: false, reason: 'too_long' };
  }
  return m;
}

export function normalizeLoreJournal(hero) {
  const j = hero?.loreJournal;
  if (!Array.isArray(j)) return [];
  return j
    .filter((e) => e && typeof e.id === 'string' && typeof e.text === 'string')
    .map((e) => ({
      id: e.id,
      text: String(e.text).slice(0, LORE_LINE_MAX),
      kind: e.kind === 'pulse' ? 'pulse' : 'note',
      pulseDay: typeof e.pulseDay === 'string' ? e.pulseDay : undefined,
      createdAt:
        typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
      updatedAt:
        typeof e.updatedAt === 'string'
          ? e.updatedAt
          : typeof e.createdAt === 'string'
            ? e.createdAt
            : new Date().toISOString(),
    }));
}

/** Cap total lore injected into model prompts (tokens + latency). */
export const LORE_PROMPT_MAX_CHARS = 3000;

/**
 * Compact, model-facing block of player-authored lore (newest lines first).
 * @param {object|null|undefined} hero
 * @returns {string} empty string if nothing to add
 */
export function formatLoreForPrompt(hero) {
  const entries = normalizeLoreJournal(hero);
  if (entries.length === 0) return '';

  const sorted = [...entries].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const header = `PLAYER-CONTRIBUTED LORE (player-supplied; treat as canon texture and motivation—integrate naturally, never as a bulleted appendix in the prose):\n`;
  const lines = [];
  let used = header.length;

  for (const e of sorted) {
    const tag =
      e.kind === 'pulse' && e.pulseDay
        ? `pulse ${e.pulseDay}`
        : e.kind === 'pulse'
          ? 'pulse'
          : 'note';
    const body = e.text.trim();
    if (!body) continue;
    const line = `• (${tag}) ${body}`;
    const next = used + line.length + 1;
    if (next > LORE_PROMPT_MAX_CHARS) {
      const slack = LORE_PROMPT_MAX_CHARS - used - 6;
      if (slack > 24) {
        lines.push(`• (${tag}) ${body.slice(0, slack)}…`);
      }
      break;
    }
    lines.push(line);
    used = next;
  }

  if (lines.length === 0) return '';
  return `\n${header}${lines.join('\n')}\n`;
}

function sortJournalDescending(journal) {
  return [...journal].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function postHeroLore({ heroDb, heroId, userId, body }) {
  const hero = await heroDb.findHeroById(heroId);
  if (!hero) return { status: 404, body: { error: 'Hero not found' } };
  if (hero.userid !== userId) {
    return { status: 403, body: { error: 'You do not have permission to edit this hero' } };
  }

  const mode = body?.mode === 'pulse' ? 'pulse' : 'note';
  const textCheck = assertLoreText(body?.text ?? '');
  if (!textCheck.ok) {
    const reason = textCheck.reason || 'invalid';
    const message =
      reason === 'empty'
        ? 'Lore cannot be empty.'
        : reason === 'too_long'
          ? `Keep each line under ${LORE_LINE_MAX} characters.`
          : 'Invalid lore text.';
    return { status: 400, body: { error: reason, message } };
  }
  const text = textCheck.text;

  let journal = normalizeLoreJournal(hero);
  if (journal.length >= LORE_JOURNAL_MAX_ENTRIES) {
    return {
      status: 400,
      body: {
        error: 'journal_full',
        message: 'Journal is full. Remove older lines to add more.',
      },
    };
  }

  const now = new Date().toISOString();

  if (mode === 'pulse') {
    const pulseDay = body?.pulseDay;
    if (!validatePulseDay(pulseDay)) {
      return {
        status: 400,
        body: { error: 'invalid_pulse_day', message: 'pulseDay must be YYYY-MM-DD.' },
      };
    }
    journal = journal.filter((e) => !(e.kind === 'pulse' && e.pulseDay === pulseDay));
    journal.push({
      id: uuidv4(),
      text,
      kind: 'pulse',
      pulseDay,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    journal.push({
      id: uuidv4(),
      text,
      kind: 'note',
      createdAt: now,
      updatedAt: now,
    });
  }

  await heroDb.updateHero(heroId, { loreJournal: sortJournalDescending(journal) });
  const next = await heroDb.findHeroById(heroId);
  return {
    status: 200,
    body: { loreJournal: normalizeLoreJournal(next) },
  };
}

export async function patchHeroLore({ heroDb, heroId, userId, loreId, body }) {
  const hero = await heroDb.findHeroById(heroId);
  if (!hero) return { status: 404, body: { error: 'Hero not found' } };
  if (hero.userid !== userId) {
    return { status: 403, body: { error: 'You do not have permission to edit this hero' } };
  }

  const textCheck = assertLoreText(body?.text ?? '');
  if (!textCheck.ok) {
    const reason = textCheck.reason || 'invalid';
    const message =
      reason === 'empty'
        ? 'Lore cannot be empty.'
        : reason === 'too_long'
          ? `Keep each line under ${LORE_LINE_MAX} characters.`
          : 'Invalid lore text.';
    return { status: 400, body: { error: reason, message } };
  }
  const text = textCheck.text;

  let journal = normalizeLoreJournal(hero);
  const idx = journal.findIndex((e) => e.id === loreId);
  if (idx === -1) {
    return { status: 404, body: { error: 'lore_not_found', message: 'Entry not found.' } };
  }

  const now = new Date().toISOString();
  const prev = journal[idx];
  journal[idx] = {
    ...prev,
    text,
    updatedAt: now,
  };

  await heroDb.updateHero(heroId, { loreJournal: sortJournalDescending(journal) });
  const next = await heroDb.findHeroById(heroId);
  return {
    status: 200,
    body: { loreJournal: normalizeLoreJournal(next) },
  };
}

export async function deleteHeroLore({ heroDb, heroId, userId, loreId }) {
  const hero = await heroDb.findHeroById(heroId);
  if (!hero) return { status: 404, body: { error: 'Hero not found' } };
  if (hero.userid !== userId) {
    return { status: 403, body: { error: 'You do not have permission to edit this hero' } };
  }

  let journal = normalizeLoreJournal(hero);
  const nextJournal = journal.filter((e) => e.id !== loreId);
  if (nextJournal.length === journal.length) {
    return { status: 404, body: { error: 'lore_not_found', message: 'Entry not found.' } };
  }

  await heroDb.updateHero(heroId, { loreJournal: sortJournalDescending(nextJournal) });
  const next = await heroDb.findHeroById(heroId);
  return {
    status: 200,
    body: { loreJournal: normalizeLoreJournal(next) },
  };
}
