import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import MetaTags from '../../components/ui/MetaTags';
import JsonLd from '../../components/seo/JsonLd';
import Button from '../../components/ui/Button';
import { DOMAIN_LABEL, PRODUCT_NAME, SITE_ORIGIN } from '../../constants/brand';

const GuideFantasyHeroBirthdatePage: React.FC = () => {
  const url = `${SITE_ORIGIN}/guides/fantasy-hero-from-birth-date`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Create a fantasy hero from your birth date (practical guide) — ${PRODUCT_NAME}`,
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
        title={`Create a fantasy hero from your birth date | ${PRODUCT_NAME}`}
        description={`Step-by-step intent guide: turn a birth date into zodiac-flavored traits, then generate AI portraits and backstory on ${DOMAIN_LABEL}.`}
        image="/logo.jpg"
        canonical={url}
      />
      <JsonLd id="jsonld-guide-birthdate" data={articleLd} />

      <p className="text-cosmic-400 text-sm mb-2 flex items-center gap-2">
        <Calendar size={14} /> Guides / Organic growth cluster
      </p>
      <h1 className="text-4xl font-display font-bold mb-6">Create a fantasy hero from your birth date</h1>
      <p className="text-gray-300 text-lg mb-8">
        People search this when they want a character that feels personal—not random. {PRODUCT_NAME} uses your birth
        date to derive Western and Chinese zodiac influences, then lets you name the hero and generate AI portraits
        plus a serialized-friendly backstory.
      </p>

      <div className="prose prose-invert prose-lg max-w-none space-y-6">
        <h2>What “birth date → hero” really means</h2>
        <p>
          Astrology here is a creative constraint: it narrows the possibility space so the AI does not default to the
          same five fantasy tropes. You do not need to be an astrologer—think of it as flavor knobs (elements, tempo,
          strengths) that shape prompts and traits.
        </p>

        <h2>A simple workflow that matches intent</h2>
        <ol>
          <li>
            <strong>Pick the emotional core:</strong> what should the hero feel like in one sentence (protective,
            chaotic, stoic, romantic)?
          </li>
          <li>
            <strong>Use the birth date as inspiration:</strong> let the signs suggest strengths and weaknesses rather
            than dictating biography facts.
          </li>
          <li>
            <strong>Name for story rhythm:</strong> short names read well in chapter titles; longer names can signal
            nobility or antiquity.
          </li>
          <li>
            <strong>Generate, then iterate:</strong> if images are right but lore is thin, regenerate from the hero
            page when available—treat it like a draft, not a verdict.
          </li>
        </ol>

        <h2>Internal links you will actually use</h2>
        <p>
          Pair this guide with the{' '}
          <Link to="/zodiac-guide" className="text-cosmic-400 hover:text-cosmic-300">
            zodiac guide
          </Link>{' '}
          for sign-by-sign language, and the{' '}
          <Link to="/blog/zodiac-hero-archetypes" className="text-cosmic-400 hover:text-cosmic-300">
            archetypes article
          </Link>{' '}
          if you want party-friendly framing for tabletop or co-writing.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link to="/register" state={{ from: { pathname: '/create' } }}>
          <Button icon={<ArrowRight size={18} />}>Start on {DOMAIN_LABEL}</Button>
        </Link>
        <Link to="/faqs">
          <Button variant="outline">Read FAQs</Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default GuideFantasyHeroBirthdatePage;
