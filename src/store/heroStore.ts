import { create } from 'zustand';
import { ZodiacInfo } from '../hooks/useZodiac';

interface HeroState {
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
  
  // Actions
  setHeroName: (name: string) => void;
  setBirthdate: (date: Date | null) => void;
  setZodiacInfo: (info: ZodiacInfo | null) => void;
  setImages: (images: Array<{ angle: string; url: string; prompt: string }>) => void;
  setBackstory: (backstory: string) => void;
  setStatus: (status: 'idle' | 'generating' | 'complete' | 'error') => void;
  setPaymentStatus: (status: 'unpaid' | 'processing' | 'paid') => void;
  resetHero: () => void;
}

export const useHeroStore = create<HeroState>((set) => ({
  heroName: '',
  birthdate: null,
  zodiacInfo: null,
  images: [],
  backstory: '',
  status: 'idle',
  paymentStatus: 'unpaid',
  
  // Actions
  setHeroName: (name) => set({ heroName: name }),
  setBirthdate: (date) => set({ birthdate: date }),
  setZodiacInfo: (info) => set({ zodiacInfo: info }),
  setImages: (images) => set({ images }),
  setBackstory: (backstory) => set({ backstory }),
  setStatus: (status) => set({ status }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  resetHero: () => set({
    heroName: '',
    birthdate: null,
    zodiacInfo: null,
    images: [],
    backstory: '',
    status: 'idle',
    paymentStatus: 'unpaid'
  })
}));