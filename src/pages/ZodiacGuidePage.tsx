import React from 'react';
import { motion } from 'framer-motion';

const ZodiacGuidePage: React.FC = () => {
  const zodiacSigns = [
    {
      name: 'Aries',
      dates: 'March 21 - April 19',
      element: 'Fire',
      traits: 'Courageous, determined, confident, enthusiastic, optimistic, honest, passionate',
      description: 'Aries is the first sign of the zodiac, and those born under this sign are known for their bold and ambitious nature. As a fire sign, Aries individuals are energetic and dynamic, often taking initiative and leading the way with their pioneering spirit.'
    },
    {
      name: 'Taurus',
      dates: 'April 20 - May 20',
      element: 'Earth',
      traits: 'Reliable, patient, practical, devoted, responsible, stable',
      description: 'Taurus is represented by the Bull and is known for its reliability and practicality. Those born under this earth sign are grounded individuals who value stability and security. They appreciate beauty and have a strong connection to the physical world and material comforts.'
    },
    {
      name: 'Gemini',
      dates: 'May 21 - June 20',
      element: 'Air',
      traits: 'Gentle, affectionate, curious, adaptable, ability to learn quickly, versatile',
      description: 'Gemini is symbolized by the Twins, representing the dual nature of those born under this sign. As an air sign, Geminis are communicative, intellectual, and always on the move. They are known for their quick wit, adaptability, and social nature.'
    },
    {
      name: 'Cancer',
      dates: 'June 21 - July 22',
      element: 'Water',
      traits: 'Tenacious, highly imaginative, loyal, emotional, sympathetic, persuasive',
      description: 'Cancer is symbolized by the Crab and is deeply connected to home and family. Those born under this water sign are intuitive, emotional, and nurturing. They have a strong protective instinct and value security and comfort in their personal lives.'
    },
    {
      name: 'Leo',
      dates: 'July 23 - August 22',
      element: 'Fire',
      traits: 'Creative, passionate, generous, warm-hearted, cheerful, humorous',
      description: 'Leo is represented by the Lion and is known for its courage and leadership. Those born under this fire sign are natural performers who love being in the spotlight. They are generous, loyal, and have a flair for the dramatic.'
    },
    {
      name: 'Virgo',
      dates: 'August 23 - September 22',
      element: 'Earth',
      traits: 'Loyal, analytical, kind, hardworking, practical, methodical',
      description: 'Virgo is symbolized by the Maiden and is characterized by its attention to detail and practicality. Those born under this earth sign are analytical, organized, and perfectionistic. They have a desire to be of service and are excellent problem solvers.'
    },
    {
      name: 'Libra',
      dates: 'September 23 - October 22',
      element: 'Air',
      traits: 'Cooperative, diplomatic, gracious, fair-minded, social',
      description: 'Libra is represented by the Scales, symbolizing balance and harmony. Those born under this air sign have a strong sense of justice and value peace and fairness. They are social, diplomatic, and appreciate beauty and aesthetics.'
    },
    {
      name: 'Scorpio',
      dates: 'October 23 - November 21',
      element: 'Water',
      traits: 'Resourceful, powerful, brave, passionate, stubborn, mysterious',
      description: 'Scorpio is symbolized by the Scorpion and is known for its intensity and passion. Those born under this water sign are determined, powerful, and often secretive. They have deep emotions and a transformative nature.'
    },
    {
      name: 'Sagittarius',
      dates: 'November 22 - December 21',
      element: 'Fire',
      traits: 'Generous, idealistic, great sense of humor, enthusiastic, freedom-loving',
      description: 'Sagittarius is represented by the Archer and is characterized by its love of adventure and philosophical nature. Those born under this fire sign are optimistic, freedom-loving, and always seeking knowledge and truth.'
    },
    {
      name: 'Capricorn',
      dates: 'December 22 - January 19',
      element: 'Earth',
      traits: 'Responsible, disciplined, self-control, good managers, practical',
      description: 'Capricorn is symbolized by the Sea Goat and is known for its ambition and discipline. Those born under this earth sign are hardworking, responsible, and have a strong drive to succeed. They are practical, patient, and value tradition and structure.'
    },
    {
      name: 'Aquarius',
      dates: 'January 20 - February 18',
      element: 'Air',
      traits: 'Progressive, original, independent, humanitarian, intelligent',
      description: 'Aquarius is represented by the Water Bearer and is characterized by its innovative and forward-thinking nature. Those born under this air sign are intellectual, humanitarian, and often eccentric. They value independence and are natural visionaries.'
    },
    {
      name: 'Pisces',
      dates: 'February 19 - March 20',
      element: 'Water',
      traits: 'Compassionate, artistic, intuitive, gentle, wise, musical',
      description: 'Pisces is symbolized by the Fish and is known for its compassion and intuition. Those born under this water sign are creative, empathetic, and often spiritual. They have a deep connection to the emotional and spiritual realms.'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-16"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent mb-8 text-center"
      >
        Zodiac Guide
      </motion.h1>
      
      <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto mb-16">
        Discover the unique traits and cosmic influences of each zodiac sign. Your birth chart is more than just your sun sign—it's a cosmic blueprint that can guide your heroic journey.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {zodiacSigns.map((sign, index) => (
          <motion.div
            key={sign.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-mystic-800 rounded-lg overflow-hidden border border-mystic-700 hover:border-cosmic-500 transition-colors"
          >
            <div className="p-6">
              <h3 className="text-2xl font-display font-semibold text-white mb-2">{sign.name}</h3>
              <p className="text-cosmic-500 mb-4">{sign.dates}</p>
              <div className="mb-4">
                <span className="text-sm font-medium bg-mystic-700 rounded-full px-3 py-1">
                  Element: {sign.element}
                </span>
              </div>
              <p className="text-gray-300 mb-4">{sign.description}</p>
              <div>
                <h4 className="text-white font-medium mb-2">Key Traits:</h4>
                <p className="text-gray-400">{sign.traits}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-16 bg-mystic-800 border border-mystic-700 rounded-lg p-8">
        <h2 className="text-2xl font-display font-bold text-white mb-4">Understanding Your Cosmic Hero</h2>
        <p className="text-gray-300 mb-4">
          In the Cosmic Heroes universe, your zodiac sign influences the attributes and abilities of your hero. 
          Each sign is associated with unique powers, character traits, and visual aesthetics that make your 
          hero truly one-of-a-kind.
        </p>
        <p className="text-gray-300">
          When creating your hero, consider how your zodiac's element (Fire, Earth, Air, or Water) might 
          manifest in their abilities, and how the core traits of your sign could shape their personality 
          and destiny in the cosmic realm.
        </p>
      </div>
    </motion.div>
  );
};

export default ZodiacGuidePage; 