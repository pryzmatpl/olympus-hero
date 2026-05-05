#!/usr/bin/env node
/**
 * One-off: run promoteStorybookAfterPremiumPayment for a paid hero whose storybook stayed on the
 * free tier (is_premium false, total chapters 1). Safe to re-run: skips extra batch if already >1 unlocked.
 *
 * Usage: node server/scripts/repairPremiumStorybook.mjs <heroId>
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const heroId = process.argv[2];
if (!heroId) {
  console.error('Usage: node server/scripts/repairPremiumStorybook.mjs <heroId>');
  process.exit(1);
}

const { connectDB, closeDB } = await import('../db.js');
const { promoteStorybookAfterPremiumPayment } = await import('../storybook.js');

await connectDB();
const out = await promoteStorybookAfterPremiumPayment(heroId);
console.log(out ? JSON.stringify(out, null, 2) : 'Hero not found or not paid; no changes.');
await closeDB();
