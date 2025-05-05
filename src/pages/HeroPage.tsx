import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Share2, ShoppingCart, BadgeCheck, CreditCard } from 'lucide-react';
import Button from '../components/ui/Button';
import { useHeroStore } from '../store/heroStore';
import HeroPortrait from '../components/hero/HeroPortrait';
import HeroBackstory from '../components/hero/HeroBackstory';
import ZodiacInfo from '../components/hero/ZodiacInfo';
import ReactMarkdown from 'react-markdown';

// Import placeholder images for demo (fallback)
const PLACEHOLDER_IMAGES = [
  'https://images.pexels.com/photos/1554646/pexels-photo-1554646.jpeg',
  'https://images.pexels.com/photos/3493777/pexels-photo-3493777.jpeg',
  'https://images.pexels.com/photos/4900927/pexels-photo-4900927.jpeg'
];

// Fallback placeholder hero
const PLACEHOLDER_HERO = {
  name: 'Celestia Drakonos',
  zodiacWestern: 'Leo',
  zodiacChinese: 'Dragon',
  elementWestern: 'Fire',
  elementChinese: 'Yang Earth',
  traits: ['courageous', 'creative', 'confident', 'ambitious'],
  backstory: `
## The Legend of Celestia Drakonos

Born under the mystical convergence of the Leo and Dragon zodiac signs, Celestia Drakonos emerged 
as a guardian between realms. Their powers are deeply influenced by the element of Fire from their 
Western zodiac, granting them leadership, courage, and passion.

From their Chinese zodiac heritage as a Dragon, they inherited the qualities of being confident, intelligent, and ambitious,
which shaped their approach to using their cosmic abilities.

Celestia Drakonos's greatest strengths lie in their leadership and confidence, though they sometimes 
struggle with arrogance. Their cosmic mission is to maintain balance between the twelve zodiac realms, 
serving as both protector and mediator.

The constellation of Leo shines brightly whenever Celestia Drakonos uses their full power, creating a spectacular 
display of cosmic energy that few adversaries can withstand.
  `
};

const HeroPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState<number>(0);
  
  // Get hero data from the store
  const { 
    heroName, 
    zodiacInfo, 
    images, 
    backstory, 
    status 
  } = useHeroStore();
  
  const isPreview = id?.startsWith('preview-');
  const isLoading = status === 'generating';
  
  // Derive hero traits from zodiac info
  const heroTraits = zodiacInfo ? [
    ...zodiacInfo.western.traits.slice(0, 2),
    ...zodiacInfo.chinese.traits.slice(0, 2)
  ] : PLACEHOLDER_HERO.traits;
  
  // Use hero data from store or fallback to placeholder
  const displayName = heroName || PLACEHOLDER_HERO.name;
  const displayWesternSign = zodiacInfo?.western.sign || PLACEHOLDER_HERO.zodiacWestern;
  const displayChineseSign = zodiacInfo?.chinese.sign || PLACEHOLDER_HERO.zodiacChinese;
  const displayWesternElement = zodiacInfo?.western.element || PLACEHOLDER_HERO.elementWestern;
  const displayChineseElement = zodiacInfo?.chinese.element || PLACEHOLDER_HERO.elementChinese;
  const displayBackstory = backstory || PLACEHOLDER_HERO.backstory;
  
  // Prepare images for display
  const displayImages = images.length > 0 
    ? images.map(img => ({ url: img.url })) 
    : PLACEHOLDER_IMAGES.map(url => ({ url }));
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 pt-32 pb-20 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cosmic-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Generating your cosmic hero...</h2>
          <p className="text-gray-400 mt-2">This may take a moment as we align the stars.</p>
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
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {displayName}
            </h1>
            <p className="text-gray-300 flex flex-wrap items-center gap-2">
              <span className="bg-mystic-700 px-2 py-1 rounded text-xs">
                {displayWesternSign} ({displayWesternElement})
              </span>
              <span className="bg-mystic-700 px-2 py-1 rounded text-xs">
                {displayChineseSign} ({displayChineseElement})
              </span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              icon={<Share2 size={16} />}
            >
              Share
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
              <Button 
                variant="secondary" 
                size="sm"
                icon={<Download size={16} />}
              >
                Download Assets
              </Button>
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
                <img 
                  src={displayImages[activeImage].url} 
                  alt={`${displayName} illustration`}
                  className="w-full h-full object-cover"
                />
                
                {/* Watermark for Preview */}
                {isPreview && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-mystic-900/70 text-white px-4 py-2 rounded-full transform -rotate-45 text-xl font-semibold">
                      PREVIEW
                    </div>
                  </div>
                )}
              </div>
              
              {/* Image number indicator */}
              <div className="absolute top-4 right-4 bg-mystic-900/80 px-3 py-1 rounded-full text-xs">
                {activeImage + 1} / {displayImages.length}
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-4">
              {displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`
                    aspect-square rounded-lg overflow-hidden border-2 transition-all
                    ${activeImage === index 
                      ? 'border-cosmic-500 shadow-cosmic' 
                      : 'border-mystic-700 opacity-70 hover:opacity-100'}
                  `}
                >
                  <img 
                    src={image.url} 
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          
          {/* Right: Hero Info */}
          <div className="lg:col-span-1">
            <div className="bg-mystic-800 rounded-xl p-6 mb-6 shadow-mystic">
              <h2 className="text-xl font-display font-semibold mb-4">Hero Traits</h2>
              <ul className="space-y-3">
                {heroTraits.map((trait, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <BadgeCheck size={18} className="text-cosmic-500" />
                    <span className="capitalize">{trait}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {isPreview && (
              <div className="bg-mystic-gradient rounded-xl p-6 mb-6 shadow-mystic">
                <h2 className="text-xl font-display font-semibold mb-4 flex items-center gap-2">
                  <CreditCard size={20} className="text-cosmic-500" />
                  Unlock Full Resolution
                </h2>
                <p className="text-gray-300 mb-4">
                  Get access to high-resolution images without watermarks, plus the ability to download and share your unique hero.
                </p>
                <Link to={`/checkout/${id}`}>
                  <Button 
                    variant="secondary" 
                    fullWidth 
                    icon={<ShoppingCart size={18} />}
                  >
                    Purchase for $9.99
                  </Button>
                </Link>
              </div>
            )}
            
            <div className="bg-mystic-800 rounded-xl p-6 shadow-mystic">
              <h2 className="text-xl font-display font-semibold mb-4">Backstory</h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{displayBackstory}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroPage;