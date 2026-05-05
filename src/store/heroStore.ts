import { create } from 'zustand';
import { ZodiacInfo } from '../hooks/useZodiac';
import api from '../utils/api';

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
  loadStoryFromAPI: (storyData: Record<string, unknown>) => void;
  fetchStorybook: (heroId: string) => Promise<void>;
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
  loadStoryFromAPI: (storyData) =>
    set({
      storyBook: {
        id: String(storyData.id ?? ''),
        heroId: String(storyData.heroId ?? ''),
        is_premium: Boolean(storyData.isPremium),
        chapters_total_count: Number(storyData.chaptersTotalCount ?? 0),
        chapters_unlocked_count: Number(storyData.chaptersUnlockedCount ?? 0),
        initial_chapter_generated_at: String(storyData.initialChapterGeneratedAt ?? ''),
        created_at: String(storyData.createdAt ?? ''),
        updated_at: String(storyData.updatedAt ?? ''),
      },
    }),
  fetchStorybook: async (heroId) => {
    if (!heroId || heroId.startsWith('preview-')) return;
    
    try {
      console.log(`StoryStore: Fetching storybook for hero ${heroId}`);
      const response = await api.get(`/api/heroes/${heroId}/storybook`);
      
      // Set storyBook in the StoryStore
      set(() => ({
        storyBook: response.data.storyBook || null,
      }));
      
      // Update the chapters in the HeroStore using setTimeout to avoid circular dependency
      if (response.data.chapters) {
        try {
          setTimeout(() => {
            console.log(`StoryStore: Updating chapters in HeroStore for hero ${heroId}`);
            useHeroStore.setState({
              chapters: response.data.chapters,
              storyBook: response.data.storyBook
            });
          }, 0);
        } catch (updateError) {
          console.error('Error updating hero store with chapters:', updateError);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching storybook for hero ${heroId}:`, error);
      // Don't set an error state, just quietly fail as this is an enhancement
      return null;
    }
  }
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
  level: number;
  xp: number;
  xpToNextLevel: number;
  avatarVersion: number;
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
  setLevel: (n: number) => void;
  setXp: (n: number) => void;
  setXpToNextLevel: (n: number) => void;
  setAvatarVersion: (n: number) => void;
  setStoryBook: (storyBook: StoryBook | null) => void;
  setChapters: (chapters: Chapter[]) => void;
  setIsLoadingChapters: (isLoading: boolean) => void;
  resetHero: () => void;
  loadHeroFromAPI: (heroData: Record<string, unknown>) => void;
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
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  avatarVersion: 1,
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
  setLevel: (level) => set({ level }),
  setXp: (xp) => set({ xp }),
  setXpToNextLevel: (xpToNextLevel) => set({ xpToNextLevel }),
  setAvatarVersion: (avatarVersion) => set({ avatarVersion }),
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
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    avatarVersion: 1,
    storyBook: null,
    chapters: [],
    isLoadingChapters: false
  }),
  loadHeroFromAPI: (heroData: Record<string, unknown>) => {
    const rawStatus = heroData.status as string | undefined;
    const mappedStatus: HeroState['status'] =
      rawStatus === 'error'
        ? 'error'
        : rawStatus === 'processing' || rawStatus === 'pending'
          ? 'generating'
          : 'complete';
    const western = heroData.westernZodiac as ZodiacInfo['western'] | undefined;
    const chinese = heroData.chineseZodiac as ZodiacInfo['chinese'] | undefined;
    const rawImages = heroData.images;
    const imagesArr = Array.isArray(rawImages) ? rawImages : [];
    return set({
      heroId: typeof heroData.id === 'string' ? heroData.id : null,
      heroName: typeof heroData.name === 'string' ? heroData.name : '',
      birthdate: heroData.birthdate ? new Date(String(heroData.birthdate)) : null,
      zodiacInfo:
        western && chinese
          ? {
              western,
              chinese,
            }
          : null,
      images:
        imagesArr.length > 0
          ? imagesArr.map((img) => {
              const im = img as { angle?: string; url: string; prompt?: string };
              return {
                angle: im.angle || 'front',
                url: im.url,
                prompt: im.prompt || '',
              };
            })
          : [],
      backstory: typeof heroData.backstory === 'string' ? heroData.backstory : '',
      status: mappedStatus,
      paymentStatus:
        heroData.paymentStatus === 'paid' ||
        heroData.paymentStatus === 'unpaid' ||
        heroData.paymentStatus === 'processing'
          ? heroData.paymentStatus
          : 'unpaid',
      nftId: typeof heroData.nftId === 'string' ? heroData.nftId : null,
      level: typeof heroData.level === 'number' ? heroData.level : 1,
      xp: typeof heroData.xp === 'number' ? heroData.xp : 0,
      xpToNextLevel: typeof heroData.xpToNextLevel === 'number' ? heroData.xpToNextLevel : 100,
      avatarVersion: typeof heroData.avatarVersion === 'number' ? heroData.avatarVersion : 1,
    });
  }
}));