// Test bootstrap. Loaded via `node --import ./server/tests/setup.mjs ...`
// before any test file is evaluated, so MONGO_URI is populated before
// db.js captures it at module-evaluation time. This avoids touching the
// production db.js to make the URI lazy and keeps the change surface
// small while still giving every test a real-Mongo integration target.
// Also registers an ESM resolver hook that swaps `openai.js` for a
// deterministic stub so chapter generation and chat completions are
// hermetic.

import { register } from 'node:module';
register('./loader.mjs', import.meta.url);

import { MongoMemoryServer } from 'mongodb-memory-server';
import { after } from 'node:test';

const memoryServer = await MongoMemoryServer.create();

process.env.MONGO_URI = memoryServer.getUri();
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_for_olympus_hero_tests';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Imported lazily so consumers (test files) can await `getTestDb()` /
// `resetTestDb()` without re-evaluating db.js before MONGO_URI is set.
const dbModule = await import('../db.js');

export async function getTestDb() {
  return dbModule.connectDB();
}

export async function resetTestDb() {
  const db = await dbModule.connectDB();
  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map((c) => db.collection(c.name).deleteMany({}))
  );
}

after(async () => {
  try {
    await dbModule.closeDB();
  } catch {
    // Already closed or never connected.
  }
  await memoryServer.stop();
});
