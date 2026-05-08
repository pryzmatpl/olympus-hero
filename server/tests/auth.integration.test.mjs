// Auth boundary integration tests.
// Risk: account compromise, broken authentication, silent JWT bypass.
// These tests exercise the real bcrypt hashing path and the real Mongo
// (in-memory) so regressions in password format or JWT verification
// surface immediately.

import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { resetTestDb } from './setup.mjs';
import {
  registerUser,
  loginUser,
  authMiddleware,
  getUserById,
} from '../auth.js';
import { userDb } from '../db.js';
import { makeUser } from './factories.mjs';

beforeEach(async () => {
  await resetTestDb();
});

test('registerUser persists a user with a bcrypt-shaped password hash', async () => {
  const result = await registerUser('alice@example.test', 'super-secret-pass', 'Alice');

  assert.equal(result.email, 'alice@example.test');
  assert.equal(result.name, 'Alice');
  assert.match(result.userId, /^[0-9a-f-]{36}$/i);

  const stored = await userDb.findUserByEmail('alice@example.test');
  assert.ok(stored, 'user should exist in DB');
  assert.notEqual(stored.password, 'super-secret-pass', 'must not store plaintext');
  assert.match(stored.password, /^\$2[ab]\$/, 'bcrypt hash prefix expected');
});

test('registerUser rejects a duplicate email', async () => {
  await registerUser('dup@example.test', 'pw-one', 'First');

  await assert.rejects(
    () => registerUser('dup@example.test', 'pw-two', 'Second'),
    /already exists/i,
  );
});

test('loginUser returns a valid JWT for correct credentials', async () => {
  await registerUser('bob@example.test', 'correct-horse', 'Bob');

  const { token, user } = await loginUser('bob@example.test', 'correct-horse');

  assert.equal(user.email, 'bob@example.test');
  assert.equal(user.name, 'Bob');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(decoded.email, 'bob@example.test');
  assert.equal(decoded.userId, user.id);
});

test('loginUser rejects an unknown email with generic credentials error', async () => {
  await assert.rejects(
    () => loginUser('nobody@example.test', 'whatever'),
    /invalid credentials/i,
  );
});

test('loginUser rejects an incorrect password', async () => {
  await registerUser('carol@example.test', 'right-password', 'Carol');

  await assert.rejects(
    () => loginUser('carol@example.test', 'wrong-password'),
    /invalid credentials/i,
  );
});

test('loginUser migrates a plaintext-stored password to bcrypt on success', async () => {
  // Arrange a legacy user with plaintext password (pre-migration record).
  const legacy = makeUser({
    email: 'legacy@example.test',
    password: 'legacy-plain-pw',
    name: 'Legacy',
  });
  await userDb.createUser(legacy);

  const { token } = await loginUser('legacy@example.test', 'legacy-plain-pw');
  assert.ok(token);

  const after = await userDb.findUserByEmail('legacy@example.test');
  assert.match(after.password, /^\$2[ab]\$/, 'legacy plaintext must be migrated to bcrypt');
});

test('loginUser does not migrate when a legacy plaintext password mismatches', async () => {
  const legacy = makeUser({
    email: 'legacy2@example.test',
    password: 'legacy-plain-pw',
  });
  await userDb.createUser(legacy);

  await assert.rejects(
    () => loginUser('legacy2@example.test', 'guessing'),
    /invalid credentials/i,
  );
  const after = await userDb.findUserByEmail('legacy2@example.test');
  assert.equal(after.password, 'legacy-plain-pw', 'failed login must not rewrite the password');
});

test('getUserById omits the password field', async () => {
  const created = await registerUser('dan@example.test', 'pw-dan-123', 'Dan');

  const user = await getUserById(created.userId);

  assert.ok(user);
  assert.equal(user.email, 'dan@example.test');
  assert.equal(user.password, undefined, 'password must never leak through getUserById');
});

// --- authMiddleware boundary tests --------------------------------------------------

function makeReq(headers = {}) {
  return { headers, method: 'GET', path: '/api/heroes/example' };
}
function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test('authMiddleware rejects requests without an Authorization header', () => {
  const req = makeReq();
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /no token/i);
});

test('authMiddleware rejects a missing Bearer prefix', () => {
  const req = makeReq({ authorization: 'Token abc.def.ghi' });
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('authMiddleware rejects an invalid JWT', () => {
  const req = makeReq({ authorization: 'Bearer not-a-real-jwt' });
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /invalid token/i);
});

test('authMiddleware rejects a JWT signed with a different secret', () => {
  const foreign = jwt.sign({ userId: 'x', email: 'x@x' }, 'a-different-secret');
  const req = makeReq({ authorization: `Bearer ${foreign}` });
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('authMiddleware accepts a valid JWT and attaches the decoded user', () => {
  const token = jwt.sign(
    { userId: 'user-123', email: 'ok@example.test' },
    process.env.JWT_SECRET,
  );
  const req = makeReq({ authorization: `Bearer ${token}` });
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true, 'next() must be called for valid tokens');
  assert.equal(req.user.userId, 'user-123');
  assert.equal(req.user.email, 'ok@example.test');
  assert.equal(res.statusCode, 200, 'no error response should be sent');
});

test('authMiddleware bypasses shared-story narration endpoint without JWT', () => {
  const req = makeReq();
  req.path = '/api/shared-story/room-1/messages/msg-1/narration';
  req.method = 'GET';
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true, 'narration endpoint should bypass auth');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, undefined);
});
