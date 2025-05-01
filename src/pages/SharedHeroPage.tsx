import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import PageTitle from '../components/ui/PageTitle';
import HeroPortrait from '../components/hero/HeroPortrait';
import HeroBackstory from '../components/hero/HeroBackstory';
import ZodiacInfo from '../components/hero/ZodiacInfo';
import { Sparkles } from 'lucide-react';

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const SharedHeroPage = () => {
  const { shareId } = useParams();
  const [hero, setHero] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSharedHero = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/share/${shareId}`);
        setHero(response.data.hero);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load the shared hero');
        console.error('Error fetching shared hero:', err);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedHero();
    }
  }, [shareId]);

  if (loading) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Sparkles className="h-16 w-16 animate-pulse text-cosmic-400" />
          <h2 className="text-2xl mt-4">Loading shared hero...</h2>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="container mx-auto px-4 py-8"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
            <p className="mb-6">{error}</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-mystic-700 hover:bg-mystic-600 rounded-lg transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!hero) {
    return null;
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="flex flex-col items-center">
        <div className="bg-cosmic-900/30 rounded-lg border border-cosmic-700 p-2 inline-block mb-2">
          <span className="text-cosmic-400 text-sm">Shared Hero</span>
        </div>
        <PageTitle>{hero.name}</PageTitle>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <HeroPortrait images={hero.images} isPreview={false} />
          <div className="mt-6">
            <ZodiacInfo
              westernZodiac={hero.westernZodiac}
              chineseZodiac={hero.chineseZodiac}
            />
          </div>
        </div>

        <div>
          <HeroBackstory backstory={hero.backstory} />
          
          <div className="mt-8 text-center">
            <p className="text-cosmic-400 mb-4">Impressed by this mythical hero?</p>
            <Link
              to="/create"
              className="inline-block px-6 py-3 bg-cosmic-700 hover:bg-cosmic-600 text-white rounded-lg transition-colors"
            >
              Create Your Own Hero
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SharedHeroPage; 