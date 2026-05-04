// Test data factories. Keeps arrange-blocks of integration tests
// short and consistent so failures stand out clearly in the
// assertion phase. Defaults are listed explicitly and can be
// fully overridden (including with explicit `undefined`) via the
// trailing spread.

import { v4 as uuidv4 } from 'uuid';

export function makeUser(overrides = {}) {
  return {
    id: uuidv4(),
    email: `user-${uuidv4().slice(0, 8)}@example.test`,
    password: 'plaintext-bypass-only-for-direct-db-seed',
    name: 'Test User',
    heroes: [],
    created: new Date(),
    ...overrides,
  };
}

export function makeHero(overrides = {}) {
  return {
    id: uuidv4().replace(/-/g, ''),
    userid: uuidv4(),
    name: 'Test Hero',
    birthdate: new Date('1990-04-15').toISOString(),
    backstory:
      'A brave soul forged from cosmic dust, the hero embarks on a journey across constellations.',
    images: [{ angle: 'front', url: '/storage/test.png', prompt: 't' }],
    paymentStatus: 'unpaid',
    nftId: null,
    status: 'complete',
    created: new Date(),
    ...overrides,
  };
}

export function makePaymentIntent(overrides = {}) {
  return {
    id: `pi_test_${uuidv4().slice(0, 8)}`,
    amount: 399,
    currency: 'usd',
    metadata: {},
    ...overrides,
  };
}
