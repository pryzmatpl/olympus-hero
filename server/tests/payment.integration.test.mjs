// Payment + entitlement integration tests.
// Risk: customers being charged but not unlocked, double-charging,
// or the wrong asset being credited. This is the highest-priority
// area in the audit because every failure here is a money problem.

import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resetTestDb, getTestDb } from './setup.mjs';
import { __testControls } from './openai-stub.mjs';
import {
  processPaymentAndCreateNFT,
  getNFTById,
  getNFTsByHeroId,
} from '../stripe.js';
import { heroDb, storyBookDb, chapterDb } from '../db.js';
import { makeHero, makePaymentIntent } from './factories.mjs';

beforeEach(async () => {
  await resetTestDb();
  __testControls.reset();
});

async function seedHero(overrides = {}) {
  const hero = makeHero(overrides);
  await heroDb.createHero(hero);
  return hero;
}

test('processPaymentAndCreateNFT rejects calls without a heroId', async () => {
  await assert.rejects(
    () => processPaymentAndCreateNFT('', makePaymentIntent()),
    /Hero ID is required/,
  );
});

test('processPaymentAndCreateNFT marks hero as paid, creates NFT and a premium storybook', async () => {
  const hero = await seedHero();
  const intent = makePaymentIntent({
    amount: 399,
    walletAddress: '0xabc',
    metadata: { heroId: hero.id, paymentType: 'premium_upgrade' },
  });

  const nft = await processPaymentAndCreateNFT(hero.id, intent);

  assert.match(nft.id, /^[0-9a-f-]{36}$/i);
  assert.equal(nft.heroId, hero.id);
  assert.equal(nft.metadata.amount, 399);
  assert.equal(nft.metadata.paymentType, 'premium_upgrade');
  assert.equal(nft.metadata.status, 'confirmed');
  assert.equal(nft.ownerAddress, '0xabc');

  const persistedNft = await getNFTById(nft.id);
  assert.ok(persistedNft);

  const updatedHero = await heroDb.findHeroById(hero.id);
  assert.equal(updatedHero.paymentStatus, 'paid');
  assert.equal(updatedHero.nftId, nft.id);

  const storyBook = await storyBookDb.findStoryBookByHeroId(hero.id);
  assert.ok(storyBook, 'storybook should exist after premium upgrade');
  assert.equal(storyBook.is_premium, true);
  assert.equal(storyBook.chapters_total_count, 10);
});

test('processPaymentAndCreateNFT defaults walletAddress to a zero address when missing', async () => {
  const hero = await seedHero();
  const intent = makePaymentIntent({ metadata: { heroId: hero.id } });

  const nft = await processPaymentAndCreateNFT(hero.id, intent);

  assert.equal(nft.ownerAddress, '0x0000000000000000000000000000000000000000');
});

test('chapter_unlock paymentType triggers a 3-chapter unlock', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  // Pre-existing premium storybook (chapter unlock purchase happens after upgrade).
  const intent = makePaymentIntent({
    metadata: { heroId: hero.id, paymentType: 'chapter_unlock' },
  });

  await processPaymentAndCreateNFT(hero.id, intent);

  const storyBook = await storyBookDb.findStoryBookByHeroId(hero.id);
  assert.equal(
    storyBook.chapters_unlocked_count,
    4,
    'chapter_unlock should advance from 1 to 4 (initial + 3 purchased)',
  );

  const chapters = await chapterDb.getChaptersByStoryBookId(storyBook.id);
  const unlockedCount = chapters.filter((c) => c.is_unlocked).length;
  assert.equal(unlockedCount, 4);
});

test('metadata.unlockChapters="true" also triggers chapter unlocks', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const intent = makePaymentIntent({
    metadata: { heroId: hero.id, unlockChapters: 'true' },
  });

  await processPaymentAndCreateNFT(hero.id, intent);

  const storyBook = await storyBookDb.findStoryBookByHeroId(hero.id);
  assert.equal(storyBook.chapters_unlocked_count, 4);
});

test('paymentIntent.unlockChapters=true (top-level flag) also triggers chapter unlocks', async () => {
  const hero = await seedHero({ paymentStatus: 'paid' });
  const intent = makePaymentIntent({
    metadata: { heroId: hero.id },
    unlockChapters: true,
  });

  await processPaymentAndCreateNFT(hero.id, intent);

  const storyBook = await storyBookDb.findStoryBookByHeroId(hero.id);
  assert.equal(storyBook.chapters_unlocked_count, 4);
});

test('premium_upgrade without unlock flags does NOT auto-unlock additional chapters', async () => {
  const hero = await seedHero();
  const intent = makePaymentIntent({
    metadata: { heroId: hero.id, paymentType: 'premium_upgrade' },
  });

  await processPaymentAndCreateNFT(hero.id, intent);

  const storyBook = await storyBookDb.findStoryBookByHeroId(hero.id);
  assert.equal(storyBook.chapters_unlocked_count, 1, 'only the included first chapter');
});

test('getNFTsByHeroId returns every NFT minted for that hero', async () => {
  const hero = await seedHero();
  const intentA = makePaymentIntent({ metadata: { heroId: hero.id } });
  const intentB = makePaymentIntent({
    metadata: { heroId: hero.id, paymentType: 'chapter_unlock' },
  });

  await processPaymentAndCreateNFT(hero.id, intentA);
  await processPaymentAndCreateNFT(hero.id, intentB);

  const nfts = await getNFTsByHeroId(hero.id);
  assert.equal(nfts.length, 2);
});

test('processPaymentAndCreateNFT handles missing backstory (no crash, storybook still created)', async () => {
  const hero = await seedHero({ backstory: undefined });
  const intent = makePaymentIntent({ metadata: { heroId: hero.id } });

  const nft = await processPaymentAndCreateNFT(hero.id, intent);
  assert.ok(nft.id);

  const updatedHero = await heroDb.findHeroById(hero.id);
  assert.equal(updatedHero.paymentStatus, 'paid');
  const nfts = await getNFTsByHeroId(hero.id);
  assert.equal(nfts.length, 1);
  const sb = await storyBookDb.findStoryBookByHeroId(hero.id);
  assert.ok(sb, 'storybook row exists after payment');
});

test('duplicate webhook delivery for the same paymentIntent is idempotent (single NFT)', async () => {
  const hero = await seedHero();
  const intent = makePaymentIntent({ metadata: { heroId: hero.id } });

  const first = await processPaymentAndCreateNFT(hero.id, intent);
  const second = await processPaymentAndCreateNFT(hero.id, intent);

  assert.equal(first.id, second.id, 'second call returns the same NFT document');

  const nfts = await getNFTsByHeroId(hero.id);
  assert.equal(nfts.length, 1);
});

test('Stripe webhook signature contract: invalid signature must reject before any side effects', async () => {
  // The webhook handler in index.js delegates signature verification
  // to `stripeInstance.webhooks.constructEvent`. This test asserts
  // the upstream contract stays in sync: a tampered body must throw
  // with a recognizable error before any handler-level work runs.
  const stripeFactory = (await import('stripe')).default;
  const stripeInstance = stripeFactory('sk_test_dummy_key', {
    apiVersion: '2024-06-20',
  });
  const secret = 'whsec_test_secret_for_olympus_hero';
  const body = Buffer.from(
    JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_x' } } }),
  );

  assert.throws(
    () => stripeInstance.webhooks.constructEvent(body, 'definitely-bogus', secret),
    /No signatures found|Webhook|signature/i,
  );

  // And: the same body with a valid signature parses successfully.
  const header = stripeInstance.webhooks.generateTestHeaderString({
    payload: body.toString(),
    secret,
  });
  const event = stripeInstance.webhooks.constructEvent(body, header, secret);
  assert.equal(event.type, 'payment_intent.succeeded');
});
