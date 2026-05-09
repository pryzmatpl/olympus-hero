import { describe, it, expect } from 'vitest';
import { chapterNumFromId, isChapterId } from '../useHeroNarration';

describe('useHeroNarration ids', () => {
  it('parses chapter numbers from asset ids', () => {
    expect(chapterNumFromId('backstory')).toBeNull();
    expect(chapterNumFromId('chapter-2')).toBe(2);
  });

  it('distinguishes chapter ids', () => {
    expect(isChapterId('backstory')).toBe(false);
    expect(isChapterId('chapter-1')).toBe(true);
  });
});
