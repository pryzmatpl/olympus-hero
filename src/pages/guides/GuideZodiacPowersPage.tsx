import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import MetaTags from '../../components/ui/MetaTags';
import JsonLd from '../../components/seo/JsonLd';
import Button from '../../components/ui/Button';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../../constants/brand';

const GuideZodiacPowersPage: React.FC = () => {
  const url = `${SITE_ORIGIN}/guides/zodiac-powers-for-fantasy-heroes`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Zodiac powers for fantasy heroes (fire, earth, air, water) — ${PRODUCT_NAME}`,
    datePublished: '2026-05-04',
    dateModified: '2026-05-04',
    author: { '@type': 'Organization', name: PRODUCT_NAME },
    publisher: {
      '@type': 'Organization',
      name: PRODUCT_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/logo.jpg` },
    },
    mainEntityOfPage: url,
    image: `${SITE_ORIGIN}/logo.jpg`,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-24 pb-16 max-w-3xl"
    >
      <MetaTags
        title={`Zodiac powers for fantasy heroes | ${PRODUCT_NAME}`}
        description={`Map fire, earth, air, and water zodiac energy to concrete powers, flaws, and visuals—then build your AI hero on ${DOMAIN_LABEL}.`}
        image="/logo.jpg"
        canonical={url}
      />
      <JsonLd id="jsonld-guide-zodiac-powers" data={articleLd} />

      <p className="text-cosmic-400 text-sm mb-2 flex items-center gap-2">
        <Sparkles size={14} /> Guides / Organic growth cluster
      </p>
      <h1 className="text-4xl font-display font-bold mb-6">Zodiac powers for fantasy heroes</h1>
      <p className="text-gray-300 text-lg mb-8">
        This page targets people comparing “zodiac personality” content to “fantasy powers.” Use it as a creative lens:
        translate elements into verbs your hero repeatedly does in scenes.
      </p>

      <div className="prose prose-invert prose-lg max-w-none space-y-6">
        <h2>Fire: momentum, heat, transformation</h2>
        <p>
          Give fire heroes actions that escalate: charges, duels, public vows. Weakness: burnout or tunnel vision—great
          for chapter conflict.
        </p>
        <h2>Earth: structure, craft, endurance</h2>
        <p>
          Earth favors preparation scenes: forging, fortifying, bargaining. Weakness: stubbornness or slow adaptation
          when the plot needs a twist.
        </p>
        <h2>Air: information, mobility, rhetoric</h2>
        <p>
          Air maps to schemes, messengers, puzzles, and social manipulation with consenting players in shared stories.
          Weakness: inconsistency under pressure.
        </p>
        <h2>Water: intuition, memory, bonds</h2>
        <p>
          Water powers show up as empathy, dreams, tides, and protective wards tied to relationships. Weakness:
          over-attachment or prophecy loops—use sparingly for tension.
        </p>
        <p>
          When you are ready to materialize this into portraits and prose, jump into the{' '}
          <Link to="/create" className="text-cosmic-400 hover:text-cosmic-300">
            creator
          </Link>{' '}
          on {DOMAIN_LABEL} (account required).
        </p>
      </div>

      <div className="mt-12">
        <Link to="/register" state={{ from: { pathname: '/create' } }}>
          <Button icon={<ArrowRight size={18} />}>Create a free account</Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default GuideZodiacPowersPage;
