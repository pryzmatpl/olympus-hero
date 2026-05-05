import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { agentDriveTokenDb } from './db.js';

const SALT_ROUNDS = 10;

/**
 * @param {object} opts
 * @param {string} opts.ownerUserId
 * @param {string} opts.heroId
 * @param {string|null} [opts.roomId]
 * @param {string} [opts.label]
 * @param {number} [opts.expiresInDays] default 30
 * @returns {Promise<{ tokenId: string, plaintextToken: string, expiresAt: Date }>}
 */
export async function issueAgentDriveToken(opts) {
  const id = uuidv4();
  const secret = crypto.randomBytes(32).toString('hex');
  const plaintextToken = `adh_${id}.${secret}`;
  const secretHash = await bcrypt.hash(secret, SALT_ROUNDS);

  const expiresInDays = Number(opts.expiresInDays) > 0 ? Number(opts.expiresInDays) : 30;
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000);

  await agentDriveTokenDb.insertToken({
    id,
    heroId: opts.heroId,
    ownerUserId: opts.ownerUserId,
    roomId: opts.roomId || null,
    label: typeof opts.label === 'string' ? opts.label.slice(0, 120) : '',
    secretHash,
    expiresAt,
    revokedAt: null,
    createdAt: new Date(),
  });

  return { tokenId: id, plaintextToken, expiresAt };
}

/**
 * @param {string} plaintextToken - Format adh_<uuid>.<secret>
 * @returns {Promise<{ tokenRecord: object, heroId: string, ownerUserId: string, roomId: string|null }|null>}
 */
export async function verifyAgentDriveToken(plaintextToken) {
  if (typeof plaintextToken !== 'string' || !plaintextToken.startsWith('adh_')) {
    return null;
  }
  const withoutPrefix = plaintextToken.slice(4);
  const dot = withoutPrefix.indexOf('.');
  if (dot < 1) return null;
  const tokenId = withoutPrefix.slice(0, dot);
  const secret = withoutPrefix.slice(dot + 1);
  if (!tokenId || !secret) return null;

  const record = await agentDriveTokenDb.findByTokenId(tokenId);
  if (!record || record.revokedAt) return null;
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) return null;

  const ok = await bcrypt.compare(secret, record.secretHash);
  if (!ok) return null;

  return {
    tokenRecord: record,
    heroId: record.heroId,
    ownerUserId: record.ownerUserId,
    roomId: record.roomId || null,
  };
}

/**
 * @param {string} tokenId
 * @param {string} ownerUserId
 */
export async function revokeAgentDriveToken(tokenId, ownerUserId) {
  return agentDriveTokenDb.revokeToken(tokenId, ownerUserId);
}

/**
 * List tokens for hero (no secrets).
 * @param {string} heroId
 */
export async function listAgentDriveTokensForHero(heroId) {
  const rows = await agentDriveTokenDb.listByHeroId(heroId);
  return rows.map((r) => ({
    id: r.id,
    heroId: r.heroId,
    roomId: r.roomId,
    label: r.label,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
  }));
}
