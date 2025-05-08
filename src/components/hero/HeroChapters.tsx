import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Book, Lock, Clock, CreditCard } from 'lucide-react';
import Button from '../ui/Button';
import { useHeroStore, useStoryStore } from '../../store/heroStore';
import { formatMarkdown } from '../../utils/markdownHelper';
import api from '../../utils/api';

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

  const {
    chapters_unlocked_count,
    setChaptersUnlockedCount,
    is_premium,
    setIsPremium,
  } = useStoryStore()


  const navigate = useNavigate();
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);
  
  // Determine if the hero is premium and paid for
  const isPaid = paymentStatus === 'paid';
  const isPremium = storyBook?.is_premium || false;
  
  // Get the current chapter
  const currentChapter = chapters.find(c => c.chapter_number === activeChapter);
  
  // Calculate time until next chapter unlock (for premium heroes)
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
  
  // Handle unlocking 3 more chapters
  const handleUnlockBundle = async () => {
    if (!storyBook || isUnlocking) return;
    
    if (!isPremium) {
      // Redirect to checkout page if not paid
      navigate(`/checkout/${heroId}?type=chapter_unlock&amount=499`);
      return;
    }
    
    setIsUnlocking(true);
    
    try {
      // Call API to unlock chapters
      const response = await api.post(`/api/storybook/${storyBook.id}`, { count: 3 });
      
      // Update store with new data
      setStoryBook(response.data.storyBook);
      setChapters(response.data.chapters);
      
      // Callback to parent component
      onUnlockBundle();
    } catch (error) {
      console.error('Error unlocking chapters:', error);
    } finally {
      setIsUnlocking(false);
    }
  };
  
  // If no chapters or loading, show skeleton loader
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
          <div className="space-y-2">
            <div className="h-4 bg-mystic-700 rounded w-3/4"></div>
            <div className="h-4 bg-mystic-700 rounded"></div>
            <div className="h-4 bg-mystic-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-mystic-800 rounded-xl p-6 shadow-mystic mt-6">
      <h2 className="text-xl font-display font-semibold mb-4 flex items-center">
        <Book className="mr-2 text-cosmic-500" size={20} />
        Chapters
        <span className="ml-2 text-sm text-gray-400">
          {storyBook?.chapters_unlocked_count || 0} of {storyBook?.chapters_total_count || 0}
        </span>
        {isPremium && (
          <span className="ml-2 text-xs bg-cosmic-500/20 text-cosmic-200 px-2 py-1 rounded-full">
            Premium Story
          </span>
        )}
      </h2>
      
      {/* Chapter tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-mystic-700 pb-4">
        {[...Array(storyBook?.chapters_total_count || 1)].map((_, idx) => {
          const chapterNum = idx + 1;
          const isUnlocked = chapterNum <= (storyBook?.chapters_unlocked_count || 1);
          
          return (
            <button
              key={`chapter-${chapterNum}`}
              onClick={() => isUnlocked && setActiveChapter(chapterNum)}
              className={`
                relative rounded-md px-3 py-1.5 text-sm transition-all
                ${activeChapter === chapterNum 
                  ? 'bg-cosmic-500 text-white font-medium' 
                  : isUnlocked 
                    ? 'bg-mystic-700 text-gray-200 hover:bg-mystic-600' 
                    : 'bg-mystic-700/50 text-gray-400 cursor-not-allowed'}
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
      
      {/* Chapter content */}
      {currentChapter ? (
        <div>
          <motion.div
            key={`chapter-content-${currentChapter.chapter_number}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="prose prose-invert prose-sm max-w-none"
          >
            <h3 className="text-lg font-semibold mb-4">
              Chapter {currentChapter.chapter_number}
            </h3>
            <div 
              className="markdown-content"
              dangerouslySetInnerHTML={{ 
                __html: formatMarkdown(currentChapter.content || 'Chapter content is being generated...') 
              }}
            />
          </motion.div>
        </div>
      ) : (
        <div className="text-center py-8 text-mystic-300">
          <p>No chapter content available</p>
        </div>
      )}
      
      {/* CTA for premium users with locked chapters */}
      {isPremium && storyBook && storyBook.chapters_unlocked_count < storyBook.chapters_total_count && (
        <div className="mt-6 bg-mystic-900/60 border border-cosmic-600/30 p-4 rounded-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* For paid users - Next unlock info */}
            {isPaid && (
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-cosmic-600/20 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-cosmic-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Next Chapter Unlocks Soon</h3>
                  {timeUntilNextUnlock ? (
                    <p className="text-gray-400 text-sm">
                      Next chapter unlocks in {timeUntilNextUnlock.hours}h {timeUntilNextUnlock.minutes}m. Premium chapters are released daily.
                    </p>
                  ) : (
                    <p className="text-gray-400 text-sm">New chapters are unlocked daily for premium users</p>
                  )}
                </div>
                <div className="ml-auto">
                  <Button 
                    onClick={handleUnlockBundle}
                    isLoading={isUnlocking}
                  >
                    Unlock 3 More Chapters – $14.99
                  </Button>
                </div>
              </div>
            )}
            
            {/* For unpaid users - Payment CTA */}
            {!isPaid && (
              <div className="flex items-center gap-4 flex-1">
                <div className="bg-cosmic-600/20 p-3 rounded-full">
                  <CreditCard className="h-6 w-6 text-cosmic-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Unlock Full Story</h3>
                  <p className="text-gray-400 text-sm">Gain access to all premium chapters</p>
                </div>
                <div className="ml-auto">
                  <Button onClick={() => navigate(`/checkout/${heroId}?type=chapter_unlock&amount=499`)}>
                    Unlock Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* CTA for non-premium, paid users to unlock chapters */}
      {!isPremium && isPaid && (
        <div className="mt-6 bg-mystic-900/60 border border-cosmic-600/30 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="bg-cosmic-600/20 p-3 rounded-full">
              <Book className="h-6 w-6 text-cosmic-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Unlock More Chapters</h3>
              <p className="text-gray-400 text-sm">Continue your hero's journey with 3 more chapters now and daily chapter releases. </p>
            </div>
            <div className="ml-auto">
              <Button 
                onClick={handleUnlockBundle}
                isLoading={isUnlocking}
              >
                Unlock 3 More Chapters – $14.99
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroChapters; 