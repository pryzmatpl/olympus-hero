import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { resetTestDb } from './setup.mjs';
import { makeUser, makeHero } from './factories.mjs';
import { userDb, heroDb } from '../db.js';
import { issueAgentDriveToken, verifyAgentDriveToken, revokeAgentDriveToken } from '../agentAuth.js';

beforeEach(async () => {
  await resetTestDb();
});

test('agent drive token issue, verify, revoke', async () => {
  const user = makeUser();
  await userDb.createUser(user);
  const hero = makeHero({ userid: user.id, paymentStatus: 'paid' });
  await heroDb.createHero(hero);

  const { plaintextToken, tokenId } = await issueAgentDriveToken({
    ownerUserId: user.id,
    heroId: hero.id,
    roomId: null,
    label: 't1',
    expiresInDays: 1,
  });
  assert.match(plaintextToken, /^adh_/);

  const v = await verifyAgentDriveToken(plaintextToken);
  assert.ok(v);
  assert.equal(v.heroId, hero.id);

  const ok = await revokeAgentDriveToken(tokenId, user.id);
  assert.equal(ok, true);

  const v2 = await verifyAgentDriveToken(plaintextToken);
  assert.equal(v2, null);
});
