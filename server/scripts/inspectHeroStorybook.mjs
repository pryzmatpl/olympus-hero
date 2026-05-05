#!/usr/bin/env node
/**
 * Read-only: dump hero + storybook + chapter rows for debugging premium / chapter state.
 * Usage: node server/scripts/inspectHeroStorybook.mjs <heroId>
 * Requires MONGO_URI (see server/db.js default).
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const heroId = process.argv[2];
if (!heroId) {
  console.error('Usage: node server/scripts/inspectHeroStorybook.mjs <heroId>');
  process.exit(1);
}

const { connectDB, heroDb, storyBookDb, chapterDb } = await import('../db.js');

await connectDB();

const hero = await heroDb.findHeroById(heroId);
const book = await storyBookDb.findStoryBookByHeroId(heroId);
const chapters = book ? await chapterDb.getChaptersByStoryBookId(book.id) : [];

console.log(JSON.stringify({ hero, storyBook: book, chapters }, null, 2));

const { closeDB } = await import('../db.js');
await closeDB();
