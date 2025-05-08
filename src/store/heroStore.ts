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