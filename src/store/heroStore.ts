import { create } from 'zustand';
import { ZodiacInfo } from '../hooks/useZodiac';

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
  resetHero: () => set({
    heroId: null,
    heroName: '',
    birthdate: null,
    zodiacInfo: null,
    images: [],
    backstory: '',
    status: 'idle',
    paymentStatus: 'unpaid',
    nftId: null
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