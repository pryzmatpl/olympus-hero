import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resetTestDb } from './setup.mjs';
import { heroDb, userDb } from '../db.js';
import { makeHero, makeUser } from './factories.mjs';
import {
  LORE_LINE_MAX,
  postHeroLore,
  patchHeroLore,
  deleteHeroLore,
  normalizeLoreJournal,
  formatLoreForPrompt,
} from '../heroLore.js';

beforeEach(async () => {
  await resetTestDb();
});

test('postHeroLore appends a note', async () => {
  const u = makeUser();
  await userDb.createUser(u);
  const h = makeHero({ userid: u.id, loreJournal: [] });
  await heroDb.createHero(h);

  const r = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    body: { mode: 'note', text: '  Carries jasmine in the left pocket.  ' },
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.loreJournal.length, 1);
  assert.equal(r.body.loreJournal[0].kind, 'note');
  assert.equal(r.body.loreJournal[0].text, 'Carries jasmine in the left pocket.');
});

test('postHeroLore pulse upserts once per pulseDay', async () => {
  const u = makeUser();
  await userDb.createUser(u);
  const h = makeHero({ userid: u.id });
  await heroDb.createHero(h);

  const day = '2026-03-10';
  const first = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    body: { mode: 'pulse', pulseDay: day, text: 'First line.' },
  });
  assert.equal(first.status, 200);

  const second = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    body: { mode: 'pulse', pulseDay: day, text: 'Revised single sentence.' },
  });
  assert.equal(second.status, 200);
  const pulses = second.body.loreJournal.filter((e) => e.kind === 'pulse');
  assert.equal(pulses.length, 1);
  assert.equal(pulses[0].text, 'Revised single sentence.');
});

test('postHeroLore rejects wrong owner', async () => {
  const u = makeUser();
  await userDb.createUser(u);
  const h = makeHero({ userid: u.id });
  await heroDb.createHero(h);

  const r = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: 'someone-else',
    body: { mode: 'note', text: 'Nope' },
  });
  assert.equal(r.status, 403);
});

test('patchHeroLore edits an entry', async () => {
  const u = makeUser();
  await userDb.createUser(u);
  const h = makeHero({ userid: u.id });
  await heroDb.createHero(h);

  const added = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    body: { mode: 'note', text: 'Original.' },
  });
  const id = added.body.loreJournal[0].id;

  const patched = await patchHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    loreId: id,
    body: { text: 'Edited in place.' },
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.loreJournal.find((e) => e.id === id).text, 'Edited in place.');
});

test('deleteHeroLore removes an entry', async () => {
  const u = makeUser();
  await userDb.createUser(u);
  const h = makeHero({ userid: u.id });
  await heroDb.createHero(h);

  const added = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    body: { text: 'Gone soon.' },
  });
  const id = added.body.loreJournal[0].id;

  const del = await deleteHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    loreId: id,
  });
  assert.equal(del.status, 200);
  assert.equal(del.body.loreJournal.length, 0);
});

test('assertLoreText enforces LORE_LINE_MAX', async () => {
  const u = makeUser();
  await userDb.createUser(u);
  const h = makeHero({ userid: u.id });
  await heroDb.createHero(h);

  const r = await postHeroLore({
    heroDb,
    heroId: h.id,
    userId: u.id,
    body: { text: 'x'.repeat(LORE_LINE_MAX + 1) },
  });
  assert.equal(r.status, 400);
});

test('normalizeLoreJournal tolerates missing field', () => {
  assert.deepEqual(normalizeLoreJournal({}), []);
  assert.deepEqual(normalizeLoreJournal({ loreJournal: null }), []);
});

test('formatLoreForPrompt returns empty without journal', () => {
  assert.equal(formatLoreForPrompt(null), '');
  assert.equal(formatLoreForPrompt({ loreJournal: [] }), '');
});

test('formatLoreForPrompt includes trimmed lines with tags', () => {
  const t = new Date().toISOString();
  const block = formatLoreForPrompt({
    loreJournal: [
      {
        id: 'a',
        text: '  First line  ',
        kind: 'note',
        createdAt: t,
        updatedAt: t,
      },
      {
        id: 'b',
        text: 'Second',
        kind: 'pulse',
        pulseDay: '2026-05-01',
        createdAt: t,
        updatedAt: t,
      },
    ],
  });
  assert.ok(block.includes('PLAYER-CONTRIBUTED LORE'));
  assert.ok(block.includes('(note) First line'));
  assert.ok(block.includes('(pulse 2026-05-01) Second'));
});
