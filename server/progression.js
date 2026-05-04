import { v4 as uuidv4 } from 'uuid';
import { heroDb, storyBookDb, progressEventDb } from './db.js';
import { generateOpenAIImages, checkOpenAIQuotaExceeded } from './openai.js';

const DEFAULT_XP_TO_LEVEL = (level) => 100 + (level - 1) * 25;

/** Level milestones that trigger avatar regeneration */
export const AVATAR_MILESTONE_LEVELS = [5, 10, 15, 20, 25, 30];

/**
 * Ensure progression fields exist on hero document (mutates in-memory object).
 * @param {object} hero
 */
export function ensureHeroProgressionFields(hero) {
  if (hero.level == null) hero.level = 1;
  if (hero.xp == null) hero.xp = 0;
  if (hero.xpToNextLevel == null) hero.xpToNextLevel = DEFAULT_XP_TO_LEVEL(hero.level);
  if (hero.avatarVersion == null) hero.avatarVersion = 1;
  if (!Array.isArray(hero.avatarHistory)) hero.avatarHistory = [];
}

/**
 * @param {object} sb
 */
function ensureStoryBookLegendary(sb) {
  if (sb.legendaryRank == null) sb.legendaryRank = sb.chapters_unlocked_count ?? 1;
}

/**
 * Single source of truth for hero XP/level and Epic Legendary Book chapter growth.
 * @param {string} heroId
 * @param {'skirmish_win'|'scripted_beat'|'xp_grant'|'narrator_beat'} eventType
 * @param {{ xp?: number, source?: string, roomId?: string }} [payload]
 * @returns {Promise<{ hero: object, storyBook: object|null, levelUps: number[], avatarRegenerated: boolean, progressEventId: string }>}
 */
export async function applyProgressEvent(heroId, eventType, payload = {}) {
  const xpGain = Math.max(0, Math.min(Number(payload.xp) || 0, 5000));
  const baseXp =
    eventType === 'skirmish_win'
      ? 40
      : eventType === 'scripted_beat'
        ? 35
        : eventType === 'narrator_beat'
          ? 15
          : eventType === 'xp_grant'
            ? xpGain
            : 10;

  const xpAdd = eventType === 'xp_grant' ? xpGain : baseXp;

  const hero = await heroDb.findHeroById(heroId);
  if (!hero) {
    throw new Error('Hero not found');
  }

  ensureHeroProgressionFields(hero);

  let storyBook = await storyBookDb.findStoryBookByHeroId(heroId);
  if (storyBook) {
    ensureStoryBookLegendary(storyBook);
  }

  let xp = hero.xp + xpAdd;
  let level = hero.level;
  let xpToNext = hero.xpToNextLevel || DEFAULT_XP_TO_LEVEL(level);
  const levelUps = [];
  let chaptersToAdd = 0;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    levelUps.push(level);
    chaptersToAdd += 1;
    xpToNext = DEFAULT_XP_TO_LEVEL(level);
  }

  const progressEventId = uuidv4();
  const createdAt = new Date();

  let updatedHero = { ...hero, xp, level, xpToNextLevel: xpToNext };
  let updatedStoryBook = storyBook;
  let avatarRegenerated = false;

  if (storyBook && chaptersToAdd > 0) {
    const maxTotal = storyBook.chapters_total_count || 10;
    let unlocked = storyBook.chapters_unlocked_count || 1;
    unlocked = Math.min(maxTotal, unlocked + chaptersToAdd);
    const legendaryRank = Math.max(storyBook.legendaryRank || 1, unlocked);

    updatedStoryBook = await storyBookDb.updateStoryBook(storyBook.id, {
      chapters_unlocked_count: unlocked,
      legendaryRank,
      updated_at: new Date(),
    });
  }

  await heroDb.updateHero(heroId, {
    xp: updatedHero.xp,
    level: updatedHero.level,
    xpToNextLevel: updatedHero.xpToNextLevel,
  });

  const milestoneHit =
    levelUps.length > 0 && levelUps.some((lv) => AVATAR_MILESTONE_LEVELS.includes(lv));

  if (milestoneHit && !checkOpenAIQuotaExceeded()) {
    try {
      const h = await heroDb.findHeroById(heroId);
      if (h && h.images?.length) {
        const viewAngles = ['front', 'profile', 'action'];
        const imagePromises = viewAngles.map((angle) =>
          generateOpenAIImages(h.name, h.westernZodiac, h.chineseZodiac, angle, heroId)
        );
        const images = await Promise.all(imagePromises);
        const nextVersion = (h.avatarVersion || 1) + 1;
        const history = Array.isArray(h.avatarHistory) ? [...h.avatarHistory] : [];
        history.push({
          version: h.avatarVersion || 1,
          images: h.images,
          at: new Date().toISOString(),
        });
        await heroDb.updateHero(heroId, {
          images,
          avatarVersion: nextVersion,
          avatarHistory: history.slice(-10),
        });
        avatarRegenerated = true;
        updatedHero = { ...(await heroDb.findHeroById(heroId)) };
      }
    } catch (e) {
      console.error('Avatar regeneration skipped:', e?.message || e);
    }
  }

  await progressEventDb.insert({
    id: progressEventId,
    heroId,
    eventType,
    xpAdded: xpAdd,
    levelUps,
    chaptersAdded: chaptersToAdd,
    source: payload.source || '',
    roomId: payload.roomId || null,
    createdAt,
    avatarRegenerated,
  });

  const finalHero = await heroDb.findHeroById(heroId);

  return {
    hero: finalHero,
    storyBook: updatedStoryBook || (await storyBookDb.findStoryBookByHeroId(heroId)),
    levelUps,
    avatarRegenerated,
    progressEventId,
  };
}
