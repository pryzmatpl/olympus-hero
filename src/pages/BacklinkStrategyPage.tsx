import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle, Users, BookOpen } from 'lucide-react';
import MetaTags from '../components/ui/MetaTags';
import Button from '../components/ui/Button';

const BacklinkStrategyPage: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-24 pb-16"
    >
      <MetaTags
        title="Backlink Strategy | Cosmic Heroes"
        description="Our strategy for building quality backlinks through guest posting, influencer collaborations, and content partnerships in fantasy and astrology niches."
        image="/logo.jpg"
      />

      <section className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/">
            <Button 
              size="sm" 
              variant="text"
              icon={<ArrowLeft size={16} />} 
              iconPosition="left"
            >
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-b from-mystic-800 to-mystic-900 rounded-xl overflow-hidden shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Cosmic Heroes Backlink Strategy
          </h1>
          
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="lead text-xl">
              Our comprehensive approach to building quality backlinks focuses on establishing Cosmic Heroes as an authority in the intersection of astrology, fantasy storytelling, and AI-driven personalization.
            </p>
            
            <h2 className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-cosmic-500" />
              Guest Posting Opportunities
            </h2>
            <p>
              We're actively seeking guest posting opportunities on high-quality websites within the following niches:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">Astrology & Zodiac Platforms</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Popular astrology blogs and magazines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Zodiac-focused educational websites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Spiritual and metaphysical communities</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">Fantasy & Storytelling Sites</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Fantasy fiction communities and forums</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Creative writing platforms and blogs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Mythology and folklore educational resources</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">AI & Technology Blogs</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>AI innovation and application websites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Tech startup and product review platforms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Creative technology and digital art communities</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">Personal Development Resources</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Self-discovery and exploration platforms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Personality type and archetype educational sites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                    <span>Mindfulness and creative expression blogs</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <h2 className="flex items-center gap-2">
              <Users className="h-6 w-6 text-cosmic-500" />
              Influencer Collaboration Strategy
            </h2>
            <p>
              We're developing partnerships with influencers in relevant niches to expand our reach and build authoritative backlinks:
            </p>
            
            <div className="space-y-6 my-8">
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">Astrology & Spiritual Influencers</h3>
                <p>
                  Collaborating with respected astrologers, tarot readers, and spiritual guides to showcase how Cosmic Heroes can be used as a tool for self-discovery and exploring archetypal energies.
                </p>
              </div>
              
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">Fantasy & Creative Writing Content Creators</h3>
                <p>
                  Partnering with storytellers, authors, and creative writing educators to highlight how our AI-driven personalized fantasy stories can inspire creativity and character development.
                </p>
              </div>
              
              <div className="bg-mystic-700/30 p-6 rounded-lg">
                <h3 className="text-cosmic-500 mb-3">Tech Reviewers & AI Enthusiasts</h3>
                <p>
                  Engaging with technology reviewers and AI commentators to demonstrate the innovative aspects of our zodiac-based character creation system and personalized storytelling algorithms.
                </p>
              </div>
            </div>
            
            <h2 className="flex items-center gap-2">
              <ExternalLink className="h-6 w-6 text-cosmic-500" />
              Content Types for Link Building
            </h2>
            <p>
              Our approach includes creating diverse, valuable content designed to earn natural backlinks:
            </p>
            
            <ul className="space-y-4 my-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cosmic-500">Zodiac Character Guides</strong>
                  <p className="mt-1">Comprehensive resources exploring how different zodiac signs manifest in character archetypes, personality traits, and storytelling elements.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cosmic-500">AI Storytelling Whitepapers</strong>
                  <p className="mt-1">In-depth technical and philosophical explorations of how AI is transforming narrative creation, personalized experiences, and creative expression.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cosmic-500">Interactive Zodiac Infographics</strong>
                  <p className="mt-1">Shareable, visually engaging content that illustrates relationships between zodiac elements, hero archetypes, and storytelling patterns.</p>
                </div>
              </li>
              
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cosmic-500">Case Studies & Success Stories</strong>
                  <p className="mt-1">Documented examples of how users have connected with their zodiac-based characters and experienced personal insights through their AI-generated hero journeys.</p>
                </div>
              </li>
            </ul>
            
            <div className="mt-12 p-6 bg-cosmic-900/30 rounded-lg border border-cosmic-700">
              <h3 className="text-cosmic-500 mb-3">Interested in Collaborating?</h3>
              <p className="mb-4">
                If you run a website, blog, or social media presence in a relevant niche and are interested in partnership opportunities, we'd love to hear from you.
              </p>
              <Link to="/support">
                <Button>Contact Our Partnership Team</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default BacklinkStrategyPage; 