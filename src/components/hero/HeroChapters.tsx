import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, Lock, Clock, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import { useHeroStore, useStoryStore } from '../../store/heroStore';
import { formatLiteraryChapter } from '../../utils/literaryFormatter';
import api from '../../utils/api';
import { getChapterFrameVariant } from '../../utils/growthExperiments';

const CHAPTER_BUNDLE_PRICE_LABEL = '$1.99';

interface HeroChaptersProps {
  heroId: string;
  onUnlockBundle: () => void;
}

const HeroChapters: React.FC<HeroChaptersProps> = ({ heroId, onUnlockBundle }) => {
  const chapterFrame = getChapterFrameVariant();
  const { 
    storyBook, 
    chapters, 
    paymentStatus,
    isLoadingChapters,
    setChapters,
    setStoryBook 
  } = useHeroStore();

  const {
    chapters_unlocked_count,
    setChaptersUnlockedCount,
    is_premium,
    setIsPremium,
  } = useStoryStore()

  const navigate = useNavigate();
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  
  const isPaid = paymentStatus === 'paid';
  const isPremium = storyBook?.is_premium || false;
  
  const currentChapter = chapters.find(c => c.chapter_number === activeChapter);
  
  const calculateTimeUntilNextUnlock = () => {
    if (!storyBook?.initial_chapter_generated_at) return null;
    
    const initialDate = new Date(storyBook.initial_chapter_generated_at);
    const nextUnlockDate = new Date(initialDate);
    nextUnlockDate.setDate(nextUnlockDate.getDate() + storyBook.chapters_unlocked_count);
    
    const now = new Date();
    const diffInHours = Math.max(0, (nextUnlockDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    return {
      hours: Math.floor(diffInHours),
      minutes: Math.floor((diffInHours % 1) * 60)
    };
  };
  
  const timeUntilNextUnlock = calculateTimeUntilNextUnlock();
  
  const handleUnlockBundle = async () => {
    if (!storyBook || isUnlocking) return;
    
    if (!isPremium) {
      navigate(`/checkout/${heroId}?type=chapters`);
      return;
    }
    
    setIsUnlocking(true);
    
    try {
      const response = await api.post(`/api/storybook/${storyBook.id}`, { count: 3 });
      setStoryBook(response.data.storyBook);
      setChapters(response.data.chapters);
      onUnlockBundle();
    } catch (error) {
      console.error('Error unlocking chapters:', error);
    } finally {
      setIsUnlocking(false);
    }
  };
  
  // Helper to add drop cap to first paragraph
  const addDropCap = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const firstP = doc.querySelector('p');
    if (firstP) {
      const text = firstP.textContent || '';
      if (text.length > 0) {
        const firstLetter = text[0];
        const rest = text.slice(1);
        firstP.innerHTML = `<span class="drop-cap">${firstLetter}</span>${rest}`;
      }
    }
    return doc.body.innerHTML;
  };

  // Format chapter content with ornate styling
  const formatOrnateChapter = (content: string, chapterNumber: number): string => {
    const baseHtml = formatLiteraryChapter(content, chapterNumber);
    return addDropCap(baseHtml);
  };
  
  if (isLoadingChapters || chapters.length === 0) {
    return (
      <div className="bg-mystic-800 rounded-xl p-6 shadow-mystic">
        <h2 className="text-xl font-display font-semibold mb-6 flex items-center">
          <Book className="mr-2 text-cosmic-500" size={20} />
          Chapters
          <span className="ml-2 text-sm">
            <div className="h-4 w-16 bg-mystic-700 rounded animate-pulse"></div>
          </span>
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-mystic-700 rounded-md"></div>
          <div className="h-40 bg-mystic-700 rounded-md"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      {/* Epic Legendary Book Header */}
      <div className="text-center mb-6 pb-5 border-b border-mystic-600/40">
        <p className="font-display text-[0.65rem] sm:text-xs uppercase tracking-[0.35em] text-cosmic-400/90 mb-2">
          Mythic Tome
        </p>
        <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 drop-shadow-[0_1px_12px_rgba(250,204,21,0.15)]">
          Epic Legendary Book
        </h3>
        <p className="mt-2 text-sm text-gray-400 font-sans max-w-md mx-auto">
          Your hero&apos;s serialized saga — one chapter at a time.
        </p>
      </div>

      {/* Chapter tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-mystic-700 pb-4">
        {[...Array(storyBook?.chapters_total_count || 1)].map((_, idx) => {
          const chapterNum = idx + 1;
          const isUnlocked = chapterNum <= (storyBook?.chapters_unlocked_count || 1);
          
          return (
            <button
              key={`chapter-${chapterNum}`}
              type="button"
              onClick={() => isUnlocked && setActiveChapter(chapterNum)}
              className={`
                relative rounded-md px-3 py-1.5 text-sm transition-all font-medium
                ${activeChapter === chapterNum 
                  ? 'bg-cosmic-500 text-mystic-900 shadow-[0_0_0_1px_rgba(58,16,120,0.25)] ring-2 ring-cosmic-400/80' 
                  : isUnlocked 
                    ? 'bg-mystic-700 text-gray-100 hover:bg-mystic-600 hover:text-white border border-mystic-600' 
                    : 'bg-mystic-900/60 text-gray-500 cursor-not-allowed border border-mystic-700'}
              `}
              disabled={!isUnlocked}
            >
              {isUnlocked ? (
                `Chapter ${chapterNum}`
              ) : (
                <>
                  <Lock size={12} className="inline mr-1" />
                  <span>{chapterNum}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      
      {/* ORNATE CHAPTER CONTENT */}
      {currentChapter ? (
        <div className="chapter-tome-ornate">
          <div className="chapter-ornate-inner">
            <motion.div
              key={`chapter-content-${currentChapter.chapter_number}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Chapter Title with Ornament */}
              <div className="chapter-title-ornament">
                <span>❧</span>
              </div>
              <h2 className="chapter-title">
                Chapter {currentChapter.chapter_number}
              </h2>
              
              {/* Chapter Prose */}
              <div 
                className="chapter-prose"
                dangerouslySetInnerHTML={{ 
                  __html: formatOrnateChapter(
                    currentChapter.content || 'Chapter content is being generated...', 
                    currentChapter.chapter_number
                  ) 
                }}
              />
              
              {/* Scene break at end */}
              <div className="scene-break-ornate"></div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-mystic-300">
          <p>No chapter content available</p>
        </div>
      )}
      
      {/* CTA for premium users */}
      {isPremium && storyBook && storyBook.chapters_unlocked_count < storyBook.chapters_total_count && (
        <div className="mt-6 bg-mystic-900/60 border border-cosmic-600/30 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {isPaid && (
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-cosmic-600/20 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-cosmic-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Next Chapter Unlocks Soon</h3>
                  {timeUntilNextUnlock ? (
                    <p className="text-gray-400 text-sm">
                      Next chapter unlocks in {timeUntilNextUnlock.hours}h {timeUntilNextUnlock.minutes}m.
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">New chapters unlock daily for premium users</p>
                  )}
                </div>
                <div className="ml-auto">
                  <Button 
                    onClick={handleUnlockBundle}
                    isLoading={isUnlocking}
                  >
                    Unlock 3 More – {CHAPTER_BUNDLE_PRICE_LABEL}
                  </Button>
                </div>
              </div>
            )}
            
            {!isPaid && (
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-cosmic-600/20 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-cosmic-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Unlock Full Story</h3>
                  <p className="text-gray-400 text-sm">
                    Unlock all chapters to continue the saga.
                  </p>
                </div>
                <div className="ml-auto">
                  <Button onClick={() => navigate(`/checkout/${heroId}?type=chapters`)}>
                    Unlock – {CHAPTER_BUNDLE_PRICE_LABEL}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroChapters;
