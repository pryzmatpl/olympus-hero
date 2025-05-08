import { create } from 'zustand';
import { ZodiacInfo } from '../hooks/useZodiac';

interface Chapter {
  id: string;
  storyBookId: string;
  chapter_number: number;
  content: string;
  is_unlocked: boolean;
  generated_at: string | null;
  created_at: string;
  summary?: string;
}

interface StoryBook {
  id: string;
  heroId: string;
  is_premium: boolean;
  chapters_total_count: number;
  chapters_unlocked_count: number;
  initial_chapter_generated_at: string;
  created_at: string;
  updated_at: string;
}

interface StoryState {
  storyBook: StoryBook | null;
  setStoryBook: (storyBook: StoryBook | null) => void;
  setId: (id: string) => void;
  setHeroId: (heroId: string) => void;
  setIsPremium: (isPremium: boolean) => void;
  setChaptersTotalCount: (count: number) => void;
  setChaptersUnlockedCount: (count: number) => void;
  setInitialChapterGeneratedAt: (date: string) => void;
  setCreatedAt: (date: string) => void;
  setUpdatedAt: (date: string) => void;
  resetStory: () => void;
  loadStoryFromAPI: (storyData: any) => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  storyBook: null,

  // Actions
  setStoryBook: (storyBook) => set({ storyBook }),
  setId: (id) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, id } : null,
  })),
  setHeroId: (heroId) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, heroId } : null,
  })),
  setIsPremium: (is_premium) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, is_premium } : null,
  })),
  setChaptersTotalCount: (chapters_total_count) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, chapters_total_count } : null,
  })),
  setChaptersUnlockedCount: (chapters_unlocked_count) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, chapters_unlocked_count } : null,
  })),
  setInitialChapterGeneratedAt: (initial_chapter_generated_at) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, initial_chapter_generated_at } : null,
  })),
  setCreatedAt: (created_at) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, created_at } : null,
  })),
  setUpdatedAt: (updated_at) => set((state) => ({
    storyBook: state.storyBook ? { ...state.storyBook, updated_at } : null,
  })),
  resetStory: () => set({
    storyBook: null,
  }),
  loadStoryFromAPI: (storyData) => set({
    storyBook: {
      id: storyData.id || '',
      heroId: storyData.heroId || '',
      is_premium: storyData.isPremium || false,
      chapters_total_count: storyData.chaptersTotalCount || 0,
      chapters_unlocked_count: storyData.chaptersUnlockedCount || 0,
      initial_chapter_generated_at: storyData.initialChapterGeneratedAt || '',
      created_at: storyData.createdAt || '',
      updated_at: storyData.updatedAt || '',
    },
  }),
}));

interface HeroState {
  heroId: string | null;
  heroName: string;
  birthdate: Date | null;
  zodiacInfo: ZodiacInfo | null;
  images: Array<{
    angle: string;
    url: string;
    prompt: string;
  }>;
  backstory: string;
  status: 'idle' | 'generating' | 'complete' | 'error';
  paymentStatus: 'unpaid' | 'processing' | 'paid';
  nftId: string | null;
  storyBook: StoryBook | null;
  chapters: Chapter[];
  isLoadingChapters: boolean;
  
  // Actions
  setHeroId: (id: string | null) => void;
  setHeroName: (name: string) => void;
  setBirthdate: (date: Date | null) => void;
  setZodiacInfo: (info: ZodiacInfo | null) => void;
  setImages: (images: Array<{ angle: string; url: string; prompt: string }>) => void;
  setBackstory: (backstory: string) => void;
  setStatus: (status: 'idle' | 'generating' | 'complete' | 'error') => void;
  setPaymentStatus: (status: 'unpaid' | 'processing' | 'paid') => void;
  setNftId: (id: string | null) => void;
  setStoryBook: (storyBook: StoryBook | null) => void;
  setChapters: (chapters: Chapter[]) => void;
  setIsLoadingChapters: (isLoading: boolean) => void;
  resetHero: () => void;
  loadHeroFromAPI: (heroData: any) => void;
}

export const useHeroStore = create<HeroState>((set) => ({
  heroId: null,
  heroName: '',
  birthdate: null,
  zodiacInfo: null,
  images: [],
  backstory: '',
  status: 'idle',
  paymentStatus: 'unpaid',
  nftId: null,
  storyBook: null,
  chapters: [],
  isLoadingChapters: false,
  
  // Actions
  setHeroId: (id) => set({ heroId: id }),
  setHeroName: (name) => set({ heroName: name }),
  setBirthdate: (date) => set({ birthdate: date }),
  setZodiacInfo: (info) => set({ zodiacInfo: info }),
  setImages: (images) => set({ images }),
  setBackstory: (backstory) => set({ backstory }),
  setStatus: (status) => set({ status }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  setNftId: (id) => set({ nftId: id }),
  setStoryBook: (storyBook) => set({ storyBook }),
  setChapters: (chapters) => set({ chapters }),
  setIsLoadingChapters: (isLoading) => set({ isLoadingChapters: isLoading }),
  resetHero: () => set({
    heroId: null,
    heroName: '',
    birthdate: null,
    zodiacInfo: null,
    images: [],
    backstory: '',
    status: 'idle',
    paymentStatus: 'unpaid',
    nftId: null,
    storyBook: null,
    chapters: [],
    isLoadingChapters: false
  }),
  loadHeroFromAPI: (heroData) => set({
    heroId: heroData.id || null,
    heroName: heroData.name || '',
    birthdate: heroData.birthdate ? new Date(heroData.birthdate) : null,
    zodiacInfo: heroData.westernZodiac && heroData.chineseZodiac 
      ? {
          western: heroData.westernZodiac,
          chinese: heroData.chineseZodiac
        }
      : null,
    images: heroData.images && heroData.images.length > 0 
      ? heroData.images.map((img: any) => ({
          angle: img.angle || 'front',
          url: img.url,
          prompt: img.prompt || ''
        }))
      : [],
    backstory: heroData.backstory || '',
    status: 'complete',
    paymentStatus: heroData.paymentStatus || 'unpaid',
    nftId: heroData.nftId || null
  })
}));