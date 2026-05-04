// Storybook & chapter unlock integration tests.
// Risk: customers paying for chapters and either getting fewer than
// purchased, getting stuck on quota errors with corrupt counts, or
// the daily background job silently no-op'ing because of a wrong
// query shape.

import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resetTestDb, getTestDb } from './setup.mjs';
import { __testControls, setOpenAIQuotaExceeded } from './openai-stub.mjs';
import {
  createStoryBook,
  getOrCreateStoryBook,
  unlockChapters,
  checkAndUnlockDailyChapters,
} from '../storybook.js';
import { heroDb, storyBookDb, chapterDb } from '../db.js';
import { makeHero } from './factories.mjs';

beforeEach(async () => {
  await resetTestDb();
  __testControls.reset();
});

async function seedHero(overrides = {}) {
  const hero = makeHero(overrides);
  await heroDb.createHero(hero);
  return hero;
}

test('createStoryBook (free): single chapter total, chapter 1 generated and unlocked', async () => {
  const hero = await seedHero();

  const storyBook = await createStoryBook(hero.id, false, 'free-prompt');

  assert.equal(storyBook.is_premium, false);
  assert.equal(storyBook.chapters_total_count, 1);
  assert.equal(storyBook.chapters_unlocked_count, 1);

  const chapters = await chapterDb.getChaptersByStoryBookId(storyBook.id);
  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].chapter_number, 1);
  assert.equal(chapters[0].is_unlocked, true);
  assert.match(chapters[0].content, /Stub Chapter 1/);
});

test('createStoryBook (premium): 10 chapters total, only chapter 1 unlocked, 9 placeholders', async () => {
  const hero = await seedHero();

  const storyBook = await createStoryBook(hero.id, true, 'premium-prompt');

  assert.equal(storyBook.is_premium, true);
  assert.equal(storyBook.chapters_total_count, 10);
  assert.equal(storyBook.chapters_unlocked_count, 1);

  const chapters = await chapterDb.getChaptersByStoryBookId(storyBook.id);
  assert.equal(chapters.length, 10);
  const unlocked = chapters.filter((c) => c.is_unlocked);
  assert.equal(unlocked.length, 1);
  assert.equal(unlocked[0].chapter_number, 1);
});

test('getOrCreateStoryBook returns the existing storybook on second call', async () => {
  const hero = await seedHero();

  const first = await getOrCreateStoryBook(hero.id, false);
  const second = await getOrCreateStoryBook(hero.id, true);

  assert.equal(first.id, second.id, 'must not duplicate storybook records per hero');
  const all = await storyBookDb.getAllStoryBooks();
  assert.equal(all.length, 1);
});

test('unlockChapters increments unlocked count and generates chapter rows', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const storyBook = await createStoryBook(hero.id, true);
  __testControls.reset();

  const updated = await unlockChapters(storyBook.id, 3);

  assert.equal(updated.chapters_unlocked_count, 4, '1 initial + 3 unlocked');

  const chapters = await chapterDb.getChaptersByStoryBookId(storyBook.id);
  const unlockedNumbers = chapters
    .filter((c) => c.is_unlocked)
    .map((c) => c.chapter_number)
    .sort((a, b) => a - b);
  assert.deepEqual(unlockedNumbers, [1, 2, 3, 4]);
});

test('unlockChapters rejects non-positive batches', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const storyBook = await createStoryBook(hero.id, true);

  await assert.rejects(() => unlockChapters(storyBook.id, 0), /positive/);
  await assert.rejects(() => unlockChapters(storyBook.id, -2), /positive/);
});

test('unlockChapters short-circuits with a 429 error when quota flag is already set', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const storyBook = await createStoryBook(hero.id, true);

  setOpenAIQuotaExceeded(true);

  await assert.rejects(
    () => unlockChapters(storyBook.id, 3),
    (err) => {
      assert.equal(err.status, 429);
      assert.equal(err.code, 'insufficient_quota');
      return true;
    },
  );

  const sb = await storyBookDb.findStoryBookById(storyBook.id);
  assert.equal(sb.chapters_unlocked_count, 1, 'count must not advance on quota short-circuit');
});

test('unlockChapters surfaces quota errors mid-generation but still marks attempted chapters unlocked', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const storyBook = await createStoryBook(hero.id, true);
  __testControls.reset();
  __testControls.setShouldThrowQuotaOnGenerate(true);

  await assert.rejects(() => unlockChapters(storyBook.id, 3), /quota/i);

  const sb = await storyBookDb.findStoryBookById(storyBook.id);
  assert.equal(sb.has_openai_quota_error, true, 'quota flag should be persisted on storybook');
  assert.equal(
    sb.chapters_unlocked_count,
    4,
    'attempted unlocks are persisted so the user is not silently overcharged',
  );
});

test('checkAndUnlockDailyChapters returns null for non-premium storybooks', async () => {
  const hero = await seedHero();
  const storyBook = await createStoryBook(hero.id, false);

  const result = await checkAndUnlockDailyChapters(storyBook.id);

  assert.equal(result, null);
});

test('checkAndUnlockDailyChapters returns null once everything is unlocked', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const storyBook = await createStoryBook(hero.id, true);
  await storyBookDb.updateStoryBook(storyBook.id, {
    chapters_unlocked_count: 10,
  });

  const result = await checkAndUnlockDailyChapters(storyBook.id);

  assert.equal(result, null);
});

test('checkAndUnlockDailyChapters unlocks chapters proportional to elapsed days', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const storyBook = await createStoryBook(hero.id, true);
  // Pretend the storybook was started 4 days ago so 5 chapters should be unlocked (1 + 4).
  const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  await storyBookDb.updateStoryBook(storyBook.id, {
    initial_chapter_generated_at: fourDaysAgo,
  });
  __testControls.reset();

  const updated = await checkAndUnlockDailyChapters(storyBook.id);

  assert.ok(updated, 'should return updated storybook when unlocks happen');
  assert.equal(updated.chapters_unlocked_count, 5);
});

test('daily-unlock query: cron $expr finds storybooks with locked chapters; admin string-comparison query does not', async () => {
  // Risk being asserted: the admin route in index.js uses
  // `{ chapters_unlocked_count: { $lt: "$chapters_total_count" } }`
  // which compares to a literal string and matches nothing.
  // The cron job uses `$expr` and works correctly. This test pins
  // the contract so future refactors don't regress to the broken
  // shape silently.
  const hero = await seedHero({ paymentStatus: 'paid' });
  await createStoryBook(hero.id, true); // 10 total / 1 unlocked
  const db = await getTestDb();

  const cronResults = await db
    .collection('storybooks')
    .find({
      is_premium: true,
      $expr: { $lt: ['$chapters_unlocked_count', '$chapters_total_count'] },
    })
    .toArray();

  const brokenAdminResults = await db
    .collection('storybooks')
    .find({
      is_premium: true,
      chapters_unlocked_count: { $lt: '$chapters_total_count' },
    })
    .toArray();

  assert.equal(cronResults.length, 1, 'cron query must locate locked premium storybook');
  assert.equal(
    brokenAdminResults.length,
    0,
    'string-literal comparison query never matches; admin route is unreliable until rewritten with $expr',
  );
});
