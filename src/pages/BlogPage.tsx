import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import MetaTags from '../components/ui/MetaTags';
import Button from '../components/ui/Button';
import OptimizedImage from '../components/ui/OptimizedImage';

const BlogPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-24 pb-16"
    >
      <MetaTags
        title="Cosmic Heroes Blog - Zodiac & AI Fantasy Storytelling Insights"
        description="Explore articles about zodiac influences, AI-generated stories, and personalized fantasy adventures in the Cosmic Heroes blog."
        image="/blog-cover.jpg"
      />

      <section className="py-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-center">
          <span className="bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent">
            Cosmic Blog
          </span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto text-center mb-16">
          Insights and explorations into zodiac-based character creation and AI-driven personalized storytelling
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Article 1 */}
          <motion.article 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-b from-mystic-800 to-mystic-900 rounded-xl overflow-hidden shadow-lg"
          >
            <div className="relative h-60 overflow-hidden">
              <OptimizedImage 
                src="/blog-zodiac-archetypes.jpg" 
                alt="Zodiac Signs and Hero Archetypes"
                className="w-full h-full"
                loading="lazy"
                width={600}
                height={400}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mystic-900 via-transparent to-transparent opacity-80"></div>
            </div>
            <div className="p-8">
              <div className="flex items-center text-cosmic-400 text-sm mb-4">
                <Calendar size={16} className="mr-2" />
                <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <h2 className="text-2xl font-display font-bold mb-4">
                <Link to="/blog/zodiac-hero-archetypes" className="hover:text-cosmic-500 transition-colors">
                  The Influence of Zodiac Signs on Hero Archetypes
                </Link>
              </h2>
              <p className="text-gray-300 mb-6">
                Discover how the twelve zodiac signs shape different hero archetypes in mythology and storytelling. From the courageous Aries warrior to the intuitive Pisces mystic, each sign contributes unique traits to character development in personalized fantasy stories.
              </p>
              <Link to="/blog/zodiac-hero-archetypes">
                <Button 
                  size="sm" 
                  variant="text"
                  icon={<ArrowRight size={16} />} 
                  iconPosition="right"
                >
                  Read Article
                </Button>
              </Link>
            </div>
          </motion.article>

          {/* Article 2 */}
          <motion.article 
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-b from-mystic-800 to-mystic-900 rounded-xl overflow-hidden shadow-lg"
          >
            <div className="relative h-60 overflow-hidden">
              <OptimizedImage 
                src="/blog-ai-storytelling.jpg" 
                alt="AI-Driven Storytelling"
                className="w-full h-full"
                loading="lazy"
                width={600}
                height={400}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mystic-900 via-transparent to-transparent opacity-80"></div>
            </div>
            <div className="p-8">
              <div className="flex items-center text-cosmic-400 text-sm mb-4">
                <Calendar size={16} className="mr-2" />
                <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <h2 className="text-2xl font-display font-bold mb-4">
                <Link to="/blog/ai-mythical-journeys" className="hover:text-cosmic-500 transition-colors">
                  Exploring Mythical Journeys Through AI
                </Link>
              </h2>
              <p className="text-gray-300 mb-6">
                How artificial intelligence is revolutionizing personalized storytelling in fantasy narratives. Learn how our AI technology crafts unique hero journeys by integrating zodiac influences, mythology, and user preferences to create immersive character-driven adventures.
              </p>
              <Link to="/blog/ai-mythical-journeys">
                <Button 
                  size="sm" 
                  variant="text"
                  icon={<ArrowRight size={16} />} 
                  iconPosition="right"
                >
                  Read Article
                </Button>
              </Link>
            </div>
          </motion.article>
        </div>
      </section>
    </motion.div>
  );
};

export default BlogPage; 