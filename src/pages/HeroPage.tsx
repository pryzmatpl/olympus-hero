import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Share2, ShoppingCart, BadgeCheck, CreditCard, Lock, Users } from 'lucide-react';
import Button from '../components/ui/Button';
import { useHeroStore } from '../store/heroStore';
import HeroPortrait from '../components/hero/HeroPortrait';
import HeroBackstory from '../components/hero/HeroBackstory';
import HeroChapters from '../components/hero/HeroChapters';
import ZodiacInfo from '../components/hero/ZodiacInfo';
import MetaTags from '../components/ui/MetaTags';
import api from '../utils/api';
import { formatMarkdown } from '../utils/markdownHelper';
import { useNotification } from '../context/NotificationContext';

const HeroPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  
  // Get hero data from the store
  const { 
    heroId,
    heroName, 
    zodiacInfo, 
    images, 
    backstory, 
    status,
    paymentStatus,
    loadHeroFromAPI,
    setStatus,
    setStoryBook,
    setChapters,
    setIsLoadingChapters,
    isLoadingChapters
  } = useHeroStore();
  
  // Check for payment success and chapter purchase
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get('payment');
    const paymentType = searchParams.get('type');
    
    if (paymentStatus === 'success') {
      if (paymentType === 'chapters') {
        // Show specific message for chapter purchase
        showNotification(
          'success',
          'Chapters Purchase Successful',
          'Your chapters will become available soon. The cosmic energies are aligning to craft your continued journey.',
          true,
          6000
        );
      } else {
        // General success message for other purchases
        showNotification(
          'success',
          'Purchase Successful',
          'Your purchase was completed successfully!',
          true,
          4000
        );
      }
      
      // Clean up the URL to prevent showing notification on refresh
      const newUrl = location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location, showNotification]);
  
  useEffect(() => {
    const fetchHero = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch hero data from API
        const response = await api.get(`/api/heroes/${id?.replace('preview-', '')}`);
        
        // Update store with all hero data at once - passing the hero data directly
        loadHeroFromAPI(response.data);
        
      } catch (error) {
        console.error('Error fetching hero:', error);
        setError('Failed to load hero data. Please try again.');
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHero();
  }, [id, loadHeroFromAPI, setStatus]);
  
  // Fetch storybook and chapters data
  useEffect(() => {
    const fetchStoryBook = async () => {
      if (!heroId || id?.startsWith('preview-')) return;
      
      try {
        setIsLoadingChapters(true);
        
        const response = await api.get(`/api/heroes/${heroId}/storybook`);
        
        setStoryBook(response.data.storyBook);
        setChapters(response.data.chapters);
      } catch (error) {
        console.error('Error fetching storybook:', error);
        // Don't set an error state, just quietly fail as this is an enhancement
      } finally {
        setIsLoadingChapters(false);
      }
    };
    
    fetchStoryBook();
  }, [heroId, id, setStoryBook, setChapters, setIsLoadingChapters]);
  
  const isPreview = id?.startsWith('preview-');
  const isLoading = loading || status === 'generating';
  const isPaid = paymentStatus === 'paid';
  
  // Derive hero traits from zodiac info
  const heroTraits = zodiacInfo ? [
    ...zodiacInfo.western.traits,
    ...zodiacInfo.chinese.traits
  ] : [];
  
  // Prepare images for display
  const displayImages = images && images.length > 0 
    ? images.map(img => ({ url: img.url }))
    : [];

  // Handle share and download clicks
  const handleShareClick = () => {
    if (isPaid) {
      // TODO: Implement actual sharing functionality
      alert('Sharing functionality would open here');
    } else {
      navigate(`/checkout/${id}`);
    }
  };
  
  const handleDownloadClick = () => {
    if (isPaid) {
      const storedToken = localStorage.getItem('authToken');
      // Start download of hero assets
      api.get(`/api/heroes/${id}/download`, {
        headers: { Authorization: `Bearer ${storedToken}` },
        responseType: 'blob',
      }).then((response)=>{
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hero_${id}_assets.zip`; // Set the default file name
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }).catch((error) => {
            console.error('Download failed:', error);
            // Handle errors (e.g., show a notification to the user)
            if (error.response?.status === 403) {
              alert('You do not have permission to download this hero or payment is required.');
            } else if (error.response?.status === 404) {
              alert('Hero not found.');
            } else {
              alert('Failed to download the file. Please try again later.');
            }
          });
    } else {
      navigate(`/checkout/${id}`);
    }
  };

  const handleJoinClick = () => {
    if (isPaid) {
      navigate(`/shared-story`);
    } else {
      navigate(`/checkout/${id}`);
    }
  };
  
  // Handle refreshing chapters after unlock
  const handleChaptersUnlocked = () => {
    // No specific action needed as the component will re-render with updated data
  };
  
  // Ensure backstory is a string
  const safeBackstory = typeof backstory === 'string' ? backstory : '';
  
  // Format backstory preview for unpaid users
  const backstoryPreview = safeBackstory && safeBackstory.length > 300
    ? safeBackstory.substring(0, 300) + '...'
    : safeBackstory;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center"
      >
        <div className="text-center max-w-md w-full bg-mystic-900/80 border border-cosmic-600/30 p-6 rounded-xl shadow-lg">
          {/* Cosmic animation container */}
          <div className="relative h-32 mb-6">
            {/* Central sun/star */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-yellow-300 rounded-full animate-pulse shadow-glow"></div>
            
            {/* Orbiting planets */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-dashed border-cosmic-500/30 animate-spin" style={{ animationDuration: '8s' }}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-cosmic-500 rounded-full"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-dashed border-cosmic-400/20 animate-spin" style={{ animationDuration: '15s' }}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-purple-500 rounded-full"></div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-dashed border-cosmic-300/10 animate-spin" style={{ animationDuration: '20s' }}>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full"></div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-cosmic-300 mb-3">Aligning the Planets</h2>
          
          {/* Rotating cosmic messages */}
          <div className="h-12 mb-4 flex items-center justify-center">
            <motion.p 
              key={Math.random()} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-gray-300"
            >
              {[
                "Harmonizing celestial energies...",
                "Consulting with cosmic entities...",
                "Decoding astrological patterns...",
                "Channeling zodiac influences...",
                "Weaving your cosmic destiny...",
                "Calculating stellar alignments..."
              ][Math.floor(Date.now() / 3000) % 6]}
            </motion.p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-mystic-800 rounded-full h-2 mb-4">
            <div className="bg-gradient-to-r from-cosmic-700 via-cosmic-500 to-cosmic-400 h-2 rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-gray-400 text-sm">
            Your unique cosmic hero is being crafted from the stars.
            <br />This usually takes around 30 seconds.
          </p>
        </div>
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="bg-red-900/30 p-6 rounded-xl border border-red-800 mb-4">
            <h2 className="text-2xl font-semibold text-red-200 mb-2">Error Loading Hero</h2>
            <p className="text-red-300">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }
  
  // Display data if we have a hero name (minimal validation that data is loaded)
  if (!heroName) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Loading hero data...</h2>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-32 pb-20"
    >
      {/* Add dynamic meta tags for hero page */}
      {!isLoading && !error && heroName && (
        <MetaTags
          title={`${heroName} | Cosmic Heroes`}
          description={`Discover the cosmic journey of ${heroName}, a mythical hero with ${zodiacInfo?.western.sign} and ${zodiacInfo?.chinese.sign} zodiac influences.`}
          image={images && images.length > 0 ? images[0].url : '/logo.jpg'}
          type="profile"
        />
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {heroName}
            </h1>
            <p className="text-gray-300 flex flex-wrap items-center gap-2">
              <span className="bg-mystic-700 px-2 py-1 rounded text-xs">
                {zodiacInfo?.western.sign} ({zodiacInfo?.western.element})
              </span>
              <span className="bg-mystic-700 px-2 py-1 rounded text-xs">
                {zodiacInfo?.chinese.sign} ({zodiacInfo?.chinese.element})
              </span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              icon={<Share2 size={16} />}
              onClick={handleShareClick}
            >
              {!isPaid && "Unlock to "} Share
            </Button>
            
            {isPreview ? (
              <Link to={`/checkout/${id}`}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  icon={<ShoppingCart size={16} />}
                >
                  Purchase Full Version
                </Button>
              </Link>
            ) : (
              <>
                <Button 
                  variant="secondary" 
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadClick}
                >
                  {!isPaid && "Unlock to "} Download Assets
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  icon={<Users size={16} />}
                  onClick={handleJoinClick}
                >
                  {!isPaid && "Unlock to "} Join Shared Story
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Hero Images */}
          <div className="lg:col-span-2">
            <div className="relative rounded-xl overflow-hidden bg-mystic-900/60 mb-4">
              {/* Main Image */}
              <div className="aspect-square md:aspect-[4/3] relative">
                {displayImages.length > 0 ? (
                  <img 
                    src={displayImages[activeImage]?.url} 
                    alt={`${heroName} illustration`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-mystic-900">
                    <p className="text-gray-400">Image is being generated...</p>
                  </div>
                )}
                
                {/* Watermark for Preview or Unpaid */}
                {(isPreview || !isPaid) && displayImages.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-mystic-900/70 text-white px-4 py-2 rounded-full transform -rotate-45 text-xl font-semibold">
                      {isPreview ? 'PREVIEW' : 'UNLOCK FULL QUALITY'}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image number indicator */}
              {displayImages.length > 0 && (
                <div className="absolute top-4 right-4 bg-mystic-900/80 px-3 py-1 rounded-full text-xs">
                  {activeImage + 1} / {displayImages.length}
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {displayImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {displayImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => isPaid ? setActiveImage(index) : setActiveImage(0)}
                    className={`
                      aspect-square rounded-lg overflow-hidden border-2 transition-all relative
                      ${activeImage === index 
                        ? 'border-cosmic-500 shadow-cosmic' 
                        : 'border-mystic-700 opacity-70 hover:opacity-100'}
                    `}
                  >
                    <img 
                      src={image.url} 
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-full h-full object-cover ${index > 0 && !isPaid ? 'blur-sm' : ''}`}
                    />
                    
                    {/* Lock icon for thumbnails after the first one if not paid */}
                    {index > 0 && !isPaid && (
                      <div className="absolute inset-0 flex items-center justify-center bg-mystic-900/50">
                        <Lock size={20} className="text-cosmic-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {/* CTA for unpaid users */}
            {!isPaid && (
              <div className="mt-6 bg-mystic-800/80 border border-cosmic-600/30 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-cosmic-600/20 p-3 rounded-full">
                    <CreditCard className="h-6 w-6 text-cosmic-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Unlock Full Quality Images</h3>
                    <p className="text-gray-400 text-sm">Get high-resolution images and access to all views</p>
                  </div>
                  <div className="ml-auto">
                    <Link to={`/checkout/${id}`}>
                      <Button size="sm">Unlock Now</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Hero Chapters (only shown on desktop view) */}
            <div className="hidden lg:block pt-6">
              {!isPreview && heroId && (
                <HeroChapters 
                  heroId={heroId} 
                  onUnlockBundle={handleChaptersUnlocked} 
                />
              )}
            </div>
          </div>
          
          {/* Right: Hero Info */}
          <div className="lg:col-span-1">
            <div className="bg-mystic-800 rounded-xl p-6 mb-6 shadow-mystic">
              <h2 className="text-xl font-display font-semibold mb-4">Hero Traits</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {heroTraits.map((trait, index) => (
                  <li key={index} className="flex items-center gap-2 list-none">
                    <BadgeCheck size={18} className="text-cosmic-500 flex-shrink-0" />
                    <span className="capitalize">{trait}</span>
                  </li>
                ))}
              </div>
              
              {/* Western Zodiac Strengths & Weaknesses */}
              {zodiacInfo?.western?.strengths && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Strengths:</h3>
                  <div className="flex flex-wrap gap-2">
                    {zodiacInfo.western.strengths.map((strength, idx) => (
                      <span key={idx} className="bg-cosmic-500/20 text-cosmic-200 px-2 py-1 rounded-full text-xs capitalize">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {zodiacInfo?.western?.weaknesses && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Weaknesses:</h3>
                  <div className="flex flex-wrap gap-2">
                    {zodiacInfo.western.weaknesses.map((weakness, idx) => (
                      <span key={idx} className="bg-mystic-700 text-mystic-200 px-2 py-1 rounded-full text-xs capitalize">
                        {weakness}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Chinese Zodiac Compatibility */}
              {zodiacInfo?.chinese?.compatibility && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Compatible With:</h3>
                  <p className="text-cosmic-300">{zodiacInfo.chinese.compatibility.join(", ")}</p>
                </div>
              )}
              
              {/* Purchase CTA if not paid */}
              {!isPaid && (
                <div className="mt-6 pt-6 border-t border-mystic-700">
                  <div className="flex items-center justify-between">
                    <span className="text-cosmic-300 font-medium">Premium Access</span>
                    <Link to={`/checkout/${id}`}>
                      <Button icon={<ShoppingCart className="h-4 w-4" />}>
                        Unlock
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-mystic-800 rounded-xl p-6 shadow-mystic">
              <h2 className="text-xl font-display font-semibold mb-4">Backstory</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                {!safeBackstory ? (
                  <p className="text-cosmic-400">Backstory is being generated...</p>
                ) : !isPaid && safeBackstory.length > 300 ? (
                  <>
                    <div 
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: formatMarkdown(backstoryPreview) }}
                    />
                    <div className="relative pt-10 mt-4">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-mystic-800 flex items-end justify-center pb-4">
                        <Link to={`/checkout/${id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            icon={<Lock size={16} />}
                          >
                            Unlock Full Backstory
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(safeBackstory) }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hero Chapters (mobile/tablet view) */}
        <div className="lg:hidden mt-8">
          {!isPreview && heroId && (
            <HeroChapters 
              heroId={heroId} 
              onUnlockBundle={handleChaptersUnlocked} 
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HeroPage;