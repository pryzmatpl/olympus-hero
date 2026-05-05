import React from 'react';
import { motion } from 'framer-motion';

const pageMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

type LandingStylePageRootProps = {
  children: React.ReactNode;
  className?: string;
};

export const LandingStylePageRoot: React.FC<LandingStylePageRootProps> = ({ children, className }) => (
  <motion.div {...pageMotion} className={`text-stone-200 ${className ?? ''}`.trim()}>
    {children}
  </motion.div>
);

type LandingStyleHeroProps = {
  headingId?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
};

export const LandingStyleHero: React.FC<LandingStyleHeroProps> = ({
  headingId = 'page-hero-heading',
  eyebrow,
  title,
  lead,
  actions,
}) => (
  <section
    aria-labelledby={headingId}
    className="relative overflow-hidden border-b border-stone-800/80 bg-gradient-to-b from-stone-950 via-mystic-950 to-mystic-900"
  >
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,83,9,0.12),transparent)] pointer-events-none" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(88,28,135,0.25),transparent_55%)] pointer-events-none" />
    <div className="container mx-auto px-4 pt-28 pb-12 md:pb-16 relative z-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-10 max-w-6xl mx-auto">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <p className="text-amber-500/95 font-display text-sm md:text-base tracking-[0.2em] uppercase mb-4">
              {eyebrow}
            </p>
          )}
          <h1
            id={headingId}
            className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-stone-100 leading-[1.1] mb-3"
          >
            {title}
          </h1>
          {lead && (
            <p className="text-stone-400 text-base md:text-lg leading-relaxed max-w-2xl border-l-2 border-amber-600/60 pl-4">
              {lead}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 flex flex-wrap gap-3 md:justify-end">{actions}</div>}
      </div>
    </div>
  </section>
);

type LandingStyleMainProps = {
  children: React.ReactNode;
  className?: string;
  tone?: 'mystic' | 'stone';
};

export const LandingStyleMain: React.FC<LandingStyleMainProps> = ({
  children,
  className,
  tone = 'mystic',
}) => {
  const toneClass =
    tone === 'stone' ? 'bg-stone-950 border-t border-stone-800/80' : 'bg-mystic-900/80';
  return (
    <section className={`py-14 md:py-20 ${toneClass} ${className ?? ''}`.trim()}>
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
};
