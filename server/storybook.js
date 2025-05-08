import { v4 as uuidv4 } from 'uuid';
import { storyBookDb, chapterDb, heroDb } from './db.js';
import { generateChapter } from './openai.js';

// Constants for storybook configuration
const DEFAULT_CHAPTERS_TOTAL = 10;
const DEFAULT_UNLOCK_BUNDLE_SIZE = 10;

/**
 * Create a new storybook for a hero
 * @param {string} heroId - The ID of the hero
 * @param {boolean} isPremium - Whether the hero is a premium hero
 * @param {string} userPrompt - The user's original prompt/intent for the hero
 * @returns {object} The created storybook
 */
export const createStoryBook = async (heroId, isPremium = false, userPrompt = '') => {
  // Get the hero data
  const hero = await heroDb.findHeroById(heroId);
  if (!hero) {
    throw new Error('Hero not found');
  }

  // Create the storybook object
  const storyBookId = uuidv4();
  const storyBook = {
    id: storyBookId,
    heroId,
    is_premium: isPremium,
    chapters_total_count: isPremium ? DEFAULT_CHAPTERS_TOTAL : 1,
    chapters_unlocked_count: 1, // Always start with 1 unlocked chapter
    initial_chapter_generated_at: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  };

  // Store the storybook in the database
  await storyBookDb.createStoryBook(storyBook);

  // Generate and save the first chapter
  await generateAndSaveChapter(storyBookId, hero, userPrompt, 1);
  
  // For premium heroes, pre-create placeholder chapters
  if (isPremium) {
    for (let i = 2; i <= DEFAULT_CHAPTERS_TOTAL; i++) {
      await createPlaceholderChapter(storyBookId, i);
    }
  }

  return storyBook;
};

/**
 * Create a placeholder for a future chapter
 * @param {string} storyBookId - The ID of the storybook
 * @param {number} chapterNumber - The chapter number
 */
export const createPlaceholderChapter = async (storyBookId, chapterNumber) => {
  const chapterId = uuidv4();
  const chapter = {
    id: chapterId,
    storyBookId,
    chapter_number: chapterNumber,
    content: '', // Empty content since it's just a placeholder
    is_unlocked: false,
    generated_at: null,
    prompt_used: '',
    summary: '',
    created_at: new Date()
  };
  
  await chapterDb.createChapter(chapter);
  return chapter;
};

/**
 * Generate and save a chapter for a storybook
 * @param {string} storyBookId - The ID of the storybook
 * @param {object} hero - The hero data
 * @param {string} userPrompt - The user's original prompt/intent for the hero
 * @param {number} chapterNumber - The chapter number to generate
 * @returns {object} The generated chapter
 */
export const generateAndSaveChapter = async (storyBookId, hero, userPrompt, chapterNumber) => {
  // Check if there's a previous chapter to get its summary
  let previousChapterSummary = null;
  if (chapterNumber > 1) {
    const previousChapters = await chapterDb.getChaptersByStoryBookId(storyBookId);
    const previousChapter = previousChapters.find(c => c.chapter_number === chapterNumber - 1);
    if (previousChapter) {
      previousChapterSummary = previousChapter.summary;
    }
  }

  // Generate the chapter content
  const { content, summary } = await generateChapter(
    hero.name,
    hero,
    userPrompt,
    chapterNumber,
    previousChapterSummary
  );

  // Create or update the chapter in the database
  const existingChapters = await chapterDb.getChaptersByStoryBookId(storyBookId);
  const existingChapter = existingChapters.find(c => c.chapter_number === chapterNumber);
  
  if (existingChapter) {
    // Update the existing placeholder chapter
    const updatedChapter = {
      content,
      summary,
      is_unlocked: true,
      generated_at: new Date(),
      prompt_used: userPrompt || 'Auto-generated chapter',
      updated_at: new Date()
    };
    
    await chapterDb.updateChapter(existingChapter.id, updatedChapter);
    return { ...existingChapter, ...updatedChapter };
  } else {
    // Create a new chapter
    const chapterId = uuidv4();
    const chapter = {
      id: chapterId,
      storyBookId,
      chapter_number: chapterNumber,
      content,
      summary,
      is_unlocked: true,
      generated_at: new Date(),
      prompt_used: userPrompt || 'Auto-generated chapter',
      created_at: new Date()
    };
    
    await chapterDb.createChapter(chapter);
    return chapter;
  }
};

/**
 * Get all chapters for a storybook
 * @param {string} storyBookId - The ID of the storybook
 * @param {boolean} includeContent - Whether to include chapter content
 * @returns {array} Array of chapters
 */
export const getStoryBookChapters = async (storyBookId, includeContent = true) => {
  const chapters = await chapterDb.getChaptersByStoryBookId(storyBookId);
  
  if (!includeContent) {
    // Remove content from locked chapters to reduce payload size
    return chapters.map(chapter => ({
      ...chapter,
      content: chapter.is_unlocked ? chapter.content : ''
    }));
  }
  
  return chapters;
};

/**
 * Check if a hero has a storybook, create one if not
 * @param {string} heroId - The ID of the hero
 * @param {boolean} isPremium - Whether the hero is a premium hero
 * @param {string} userPrompt - The user's original prompt/intent for the hero
 * @returns {object} The storybook
 */
export const getOrCreateStoryBook = async (heroId, isPremium = false, userPrompt = '') => {
  // Check if a storybook already exists for this hero
  const existingStoryBook = await storyBookDb.findStoryBookByHeroId(heroId);
  
  if (existingStoryBook) {
    return existingStoryBook;
  }
  
  // Create a new storybook
  return createStoryBook(heroId, isPremium, userPrompt);
};

/**
 * Unlock a batch of chapters for a storybook
 * @param {string} storyBookId - The ID of the storybook
 * @param {number} chaptersToUnlock - Number of chapters to unlock
 * @returns {object} Updated storybook
 */
export const unlockChapters = async (storyBookId, chaptersToUnlock = DEFAULT_UNLOCK_BUNDLE_SIZE) => {
  // Get the storybook
  const storyBook = await storyBookDb.findStoryBookById(storyBookId);
  if (!storyBook) {
    throw new Error('Storybook not found');
  }
  
  // Calculate which chapters to unlock
  const currentUnlocked = storyBook.chapters_unlocked_count;
  const newUnlockedCount = Math.min(currentUnlocked + chaptersToUnlock, storyBook.chapters_total_count);
  
  if (currentUnlocked >= newUnlockedCount) {
    // No new chapters to unlock
    return storyBook;
  }
  
  // Get the hero data for chapter generation
  const hero = await heroDb.findHeroById(storyBook.heroId);
  if (!hero) {
    throw new Error('Hero not found');
  }
  
  // Generate and unlock chapters
  const chapterNumbersToUnlock = [];
  for (let i = currentUnlocked + 1; i <= newUnlockedCount; i++) {
    chapterNumbersToUnlock.push(i);
    
    // Generate content for the chapter if it's a placeholder
    await generateAndSaveChapter(storyBookId, hero, '', i);
  }
  
  // Mark the chapters as unlocked
  await chapterDb.unlockChapters(storyBookId, chapterNumbersToUnlock);
  
  // Update the storybook with the new unlocked count
  const updatedStoryBook = await storyBookDb.updateStoryBook(storyBookId, {
    chapters_unlocked_count: newUnlockedCount,
    updated_at: new Date()
  });
  
  return updatedStoryBook;
};

/**
 * Check for and unlock any daily chapters
 * @param {string} storyBookId - The ID of the storybook
 * @returns {object} Updated storybook or null if no chapters were unlocked
 */
export const checkAndUnlockDailyChapters = async (storyBookId) => {
  // Get the storybook
  const storyBook = await storyBookDb.findStoryBookById(storyBookId);
  if (!storyBook) {
    throw new Error('Storybook not found');
  }
  
  // Only premium storybooks get daily unlocks
  if (!storyBook.is_premium) {
    return null;
  }
  
  // Check if all chapters are already unlocked
  if (storyBook.chapters_unlocked_count >= storyBook.chapters_total_count) {
    return null;
  }
  
  // Calculate how many days have passed since the initial chapter was generated
  const initialDate = new Date(storyBook.initial_chapter_generated_at);
  const currentDate = new Date();
  const daysDifference = Math.floor((currentDate - initialDate) / (1000 * 60 * 60 * 24));
  
  // Calculate how many chapters should be unlocked by now (1 per day)
  const expectedUnlocked = Math.min(daysDifference + 1, storyBook.chapters_total_count);
  
  if (expectedUnlocked > storyBook.chapters_unlocked_count) {
    // Unlock only the difference
    const chaptersToUnlock = expectedUnlocked - storyBook.chapters_unlocked_count;
    return unlockChapters(storyBookId, chaptersToUnlock);
  }
  
  return null;
}; 