// Shared story persistence + progression (hero level / legendary book) integration tests.

import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resetTestDb } from './setup.mjs';
import { __testControls } from './openai-stub.mjs';
import { makeHero, makeUser } from './factories.mjs';
import { heroDb, userDb, sharedStoryRoomDb, storyBookDb } from '../db.js';
import { createStoryBook } from '../storybook.js';
import {
  createSharedStoryRoom,
  getSharedStoryRoom,
  generateSharedStoryPrompt,
  summarizeStoryArcForRoom,
} from '../sharedStory.js';
import { appendInitialRoomNarrator } from '../sharedStoryNarrator.js';
import { applyProgressEvent } from '../progression.js';

beforeEach(async () => {
  await resetTestDb();
  __testControls.reset();
});

test('createSharedStoryRoom persists room in MongoDB', async () => {
  const user = makeUser();
  await userDb.createUser(user);
  const hero = makeHero({
    userid: user.id,
    paymentStatus: 'paid',
    birthdate: new Date('1990-04-15'),
    westernZodiac: { sign: 'Aries', element: 'Fire', traits: [] },
    chineseZodiac: { sign: 'Horse', element: 'Metal', traits: [] },
  });
  await heroDb.createHero(hero);

  const roomId = await createSharedStoryRoom(hero);
  await appendInitialRoomNarrator(null, roomId);

  const raw = await sharedStoryRoomDb.findById(roomId);
  assert.ok(raw);
  assert.equal(raw.id, roomId);
  assert.equal(raw.ownerUserId, user.id);
  assert.equal(raw.mode, 'shared_story');

  const loaded = await getSharedStoryRoom(roomId);
  assert.ok(loaded?.messages?.length >= 2);
});

test('createSharedStoryRoom with storyArcId sets storyArcState and shapes prompts', async () => {
  const user = makeUser();
  await userDb.createUser(user);
  const hero = makeHero({
    userid: user.id,
    paymentStatus: 'paid',
    birthdate: new Date('1990-04-15'),
    westernZodiac: { sign: 'Aries', element: 'Fire', traits: [] },
    chineseZodiac: { sign: 'Horse', element: 'Metal', traits: [] },
  });
  await heroDb.createHero(hero);

  const roomId = await createSharedStoryRoom(hero, {
    mode: 'shared_story',
    storyArcId: 'starfall_conspiracy',
  });
  await appendInitialRoomNarrator(null, roomId);

  const raw = await sharedStoryRoomDb.findById(roomId);
  assert.equal(raw.mode, 'shared_story');
  assert.ok(raw.storyArcState?.templateId, 'storyArcState.templateId');
  assert.equal(raw.storyArcState.templateId, 'starfall_conspiracy');
  assert.equal(raw.storyArcState.stepIndex, 0);

  const loaded = await getSharedStoryRoom(roomId);
  const summary = summarizeStoryArcForRoom(loaded);
  assert.ok(summary);
  assert.equal(summary.templateId, 'starfall_conspiracy');

  const prompt = await generateSharedStoryPrompt(loaded);
  assert.ok(prompt.includes('STRUCTURED STORY ARC'));
  assert.ok(prompt.includes('Starfall'));
});

test('generateSharedStoryPrompt includes contributed lore from hero records', async () => {
  const user = makeUser();
  await userDb.createUser(user);
  const token = 'UNIQUE_LORE_TOKEN_XYZZY';
  const hero = makeHero({
    userid: user.id,
    paymentStatus: 'paid',
    birthdate: new Date('1990-04-15'),
    westernZodiac: { sign: 'Aries', element: 'Fire', traits: [], strengths: [], weaknesses: [] },
    chineseZodiac: { sign: 'Horse', element: 'Metal', traits: [] },
    loreJournal: [
      {
        id: 'journal-lore-test-1',
        text: `${token} keeps a spare button in their boot.`,
        kind: 'note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  });
  await heroDb.createHero(hero);

  const roomId = await createSharedStoryRoom(hero);
  const loaded = await getSharedStoryRoom(roomId);
  const prompt = await generateSharedStoryPrompt(loaded);

  assert.ok(prompt.includes(token));
  assert.ok(prompt.includes('Contributed lore journals'));
});

test('applyProgressEvent links level-up to storybook chapter unlock', async () => {
  const hero = makeHero({ paymentStatus: 'paid' });
  await heroDb.createHero(hero);
  const sb = await createStoryBook(hero.id, true, 'p');
  assert.equal(sb.chapters_unlocked_count, 1);

  const r = await applyProgressEvent(hero.id, 'xp_grant', { xp: 100 });
  assert.ok(r.levelUps.length >= 1, 'expected at least one level-up');
  const book = await storyBookDb.findStoryBookById(sb.id);
  assert.equal(book.chapters_unlocked_count, 2);
  assert.equal(book.legendaryRank, 2);
  const h = await heroDb.findHeroById(hero.id);
  assert.equal(h.level, 2);
});
