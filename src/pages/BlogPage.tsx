import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';
import MetaTags from '../components/ui/MetaTags';
import OptimizedImage from '../components/ui/OptimizedImage';
import {
  LandingStyleHero,
  LandingStyleMain,
  LandingStylePageRoot,
} from '../components/layout/LandingStyleLayout';
import { BLOG_AI_MYTHICAL_JOURNEYS_DATE, BLOG_ZODIAC_ARCHETYPES_DATE } from '../constants/blogPublished';

const formatBlogDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const BlogPage: React.FC = () => {
  return (
    <LandingStylePageRoot>
      <MetaTags
        title="Cosmic Heroes Blog - Zodiac & AI Fantasy Storytelling Insights"
        description="Explore articles about zodiac influences, AI-generated stories, and personalized fantasy adventures in the Cosmic Heroes blog."
        image="/blog-cover.png"
      />

      <LandingStyleHero
        eyebrow="Mythical Hero"
        title="Blog"
        lead="Insights into zodiac-based character creation and AI-driven personalized storytelling — the same ideas that power your heroes."
      />

      <LandingStyleMain>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.article
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="group border border-stone-700/90 bg-stone-950/60 overflow-hidden rounded-sm shadow-xl shadow-black/40 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <OptimizedImage
                  src="/front.png"
                  alt="Zodiac Signs and Hero Archetypes"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="lazy"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent" />
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-grow border-t border-stone-800">
                <div className="flex items-center text-amber-500/85 text-xs uppercase tracking-wide mb-3">
                  <Calendar size={14} className="mr-2 opacity-90" />
                  <span>{formatBlogDate(BLOG_ZODIAC_ARCHETYPES_DATE)}</span>
                </div>
                <h2 className="font-display text-xl md:text-2xl text-stone-100 mb-3">
                  <Link
                    to="/blog/zodiac-hero-archetypes"
                    className="hover:text-amber-200/95 transition-colors"
                  >
                    The Influence of Zodiac Signs on Hero Archetypes
                  </Link>
                </h2>
                <p className="text-stone-400 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                  Discover how the twelve zodiac signs shape different hero archetypes in mythology and
                  storytelling. From the courageous Aries warrior to the intuitive Pisces mystic, each sign
                  contributes unique traits to character development in personalized fantasy stories.
                </p>
                <Link
                  to="/blog/zodiac-hero-archetypes"
                  className="inline-flex items-center gap-2 text-amber-200/90 hover:text-amber-100 text-sm font-medium tracking-wide border-b border-transparent hover:border-amber-500/50 transition-colors pb-0.5 w-fit"
                >
                  Read article
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.article>

            <motion.article
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, duration: 0.45 }}
              className="group border border-stone-700/90 bg-stone-950/60 overflow-hidden rounded-sm shadow-xl shadow-black/40 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <OptimizedImage
                  src="/action.png"
                  alt="AI-Driven Storytelling"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  loading="lazy"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/25 to-transparent" />
              </div>
              <div className="p-6 md:p-8 flex flex-col flex-grow border-t border-stone-800">
                <div className="flex items-center text-amber-500/85 text-xs uppercase tracking-wide mb-3">
                  <Calendar size={14} className="mr-2 opacity-90" />
                  <span>{formatBlogDate(BLOG_AI_MYTHICAL_JOURNEYS_DATE)}</span>
                </div>
                <h2 className="font-display text-xl md:text-2xl text-stone-100 mb-3">
                  <Link
                    to="/blog/ai-mythical-journeys"
                    className="hover:text-amber-200/95 transition-colors"
                  >
                    Exploring Mythical Journeys Through AI
                  </Link>
                </h2>
                <p className="text-stone-400 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                  How artificial intelligence is revolutionizing personalized storytelling in fantasy
                  narratives. Learn how our AI technology crafts unique hero journeys by integrating zodiac
                  influences, mythology, and user preferences to create immersive character-driven adventures.
                </p>
                <Link
                  to="/blog/ai-mythical-journeys"
                  className="inline-flex items-center gap-2 text-amber-200/90 hover:text-amber-100 text-sm font-medium tracking-wide border-b border-transparent hover:border-amber-500/50 transition-colors pb-0.5 w-fit"
                >
                  Read article
                  <ArrowRight size={16} />
                </Link>
              </div>
            </motion.article>
          </div>
        </div>
      </LandingStyleMain>
    </LandingStylePageRoot>
  );
};

export default BlogPage;
