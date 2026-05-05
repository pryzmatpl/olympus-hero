import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, Lock, Clock, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import { useHeroStore } from '../../store/heroStore';
import { formatLiteraryChapter } from '../../utils/literaryFormatter';
import api from '../../utils/api';

const CHAPTER_BUNDLE_PRICE_LABEL = '$1.99';

interface HeroChaptersProps {
  heroId: string;
  onUnlockBundle: () => void;
}

const HeroChapters: React.FC<HeroChaptersProps> = ({ heroId, onUnlockBundle }) => {
  const { 
    storyBook, 
    chapters, 
    paymentStatus,
    isLoadingChapters,
    setChapters,
    setStoryBook 
  } = useHeroStore();

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
      <div className="rounded-sm border border-stone-700/85 bg-stone-950/50 p-6">
        <h2 className="text-xl font-display font-semibold mb-6 flex items-center text-stone-200">
          <Book className="mr-2 text-amber-500/85" size={20} />
          Chapters
          <span className="ml-2 text-sm">
            <div className="h-4 w-16 bg-stone-700 rounded-sm animate-pulse" />
          </span>
        </h2>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-stone-800 rounded-sm" />
          <div className="h-40 bg-stone-800/90 rounded-sm" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      {/* Epic Legendary Book Header */}
      <div className="text-center mb-6 pb-5 border-b border-stone-700/60">
        <p className="font-display text-[0.65rem] sm:text-xs uppercase tracking-[0.35em] text-amber-500/90 mb-2">
          Illuminated tome
        </p>
        <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-100">
          Epic legendary book
        </h3>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          Chapters rendered as illuminated manuscript spreads — parchment, initials, rubricated lines.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-700/70 pb-4">
        {[...Array(storyBook?.chapters_total_count || 1)].map((_, idx) => {
          const chapterNum = idx + 1;
          const isUnlocked = chapterNum <= (storyBook?.chapters_unlocked_count || 1);
          
          return (
            <button
              key={`chapter-${chapterNum}`}
              type="button"
              onClick={() => isUnlocked && setActiveChapter(chapterNum)}
              className={`
                relative rounded-sm px-3 py-1.5 text-sm transition-all font-medium
                ${activeChapter === chapterNum 
                  ? 'bg-amber-500/95 text-stone-950 shadow-md shadow-black/40 ring-2 ring-amber-400/50' 
                  : isUnlocked 
                    ? 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-600' 
                    : 'bg-stone-950/70 text-stone-600 cursor-not-allowed border border-stone-800'}
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
              
              <div className="scene-break-ornate" aria-hidden>
                <span className="scene-break-mark">☙ ❧ ☙</span>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-stone-500 rounded-sm border border-stone-800 bg-stone-950/40">
          <p>No chapter content available</p>
        </div>
      )}
      
      {/* CTA for premium users */}
      {isPremium && storyBook && storyBook.chapters_unlocked_count < storyBook.chapters_total_count && (
        <div className="mt-6 rounded-sm border border-stone-700/85 bg-stone-950/50 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {isPaid && (
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 rounded-full border border-amber-900/40 bg-amber-950/30">
                  <Clock className="h-6 w-6 text-amber-500/85" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-stone-100 mb-1">Next chapter unlocks soon</h3>
                  {timeUntilNextUnlock ? (
                    <p className="text-stone-500 text-sm">
                      Next chapter unlocks in {timeUntilNextUnlock.hours}h {timeUntilNextUnlock.minutes}m.
                    </p>
                  ) : (
                    <p className="text-stone-500 text-sm">New chapters unlock daily for premium users</p>
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
                <div className="p-3 rounded-full border border-amber-900/40 bg-amber-950/30">
                  <CreditCard className="h-6 w-6 text-amber-500/85" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-stone-100 mb-1">Unlock full story</h3>
                  <p className="text-stone-500 text-sm">
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
