import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Calendar,
  User,
  Palette,
  Zap,
  Share2,
  Check,
  HelpCircle,
} from 'lucide-react';
import Button from '../components/ui/Button';
import MetaTags from '../components/ui/MetaTags';
import { AuthContext } from '../App';
import { DEFAULT_META_DESCRIPTION, DEFAULT_META_TITLE } from '../constants/brand';
import { track } from '../utils/analytics';

const CREATE_PATH = '/create';

/** Featured heroes — companion-style presentation (structured like classic RPG marketing pages). */
const FEATURED_LEGENDS = [
  {
    name: 'Blazorus',
    epithet: 'Elemental commander',
    image: '/front.png',
    origin: 'Aries fire-sign',
    aspect: 'Bold, commanding presence',
    calling: 'Leader & tactician',
  },
  {
    name: 'Energus',
    epithet: 'Battle ascendant',
    image: '/action.png',
    origin: 'Capricorn resolve',
    aspect: 'Grounded, relentless',
    calling: 'Front-line champion',
  },
  {
    name: 'Manakuanea',
    epithet: 'Path of the rooster',
    image: '/profile2.png',
    origin: 'Chinese zodiac — Rooster',
    aspect: 'Proud, precise, vivid',
    calling: 'Face of your legend',
  },
] as const;

const HomePage: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);

  const primaryTo = isAuthenticated ? CREATE_PATH : '/register';
  const primaryState = isAuthenticated ? undefined : { from: { pathname: CREATE_PATH } };

  const metaTitle = DEFAULT_META_TITLE;
  const metaDescription = DEFAULT_META_DESCRIPTION;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-stone-200"
    >
      <MetaTags
        title={metaTitle}
        description={metaDescription}
        image="/logo.jpg"
      />

      {/* Hero — cinematic split, dark RPG-site rhythm (inspired by premium fantasy game marketing). */}
      <section
        aria-labelledby="hero-heading"
        className="relative min-h-[88vh] flex items-stretch overflow-hidden border-b border-stone-800/80 bg-gradient-to-b from-stone-950 via-mystic-950 to-mystic-900"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(180,83,9,0.12),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_60%,rgba(88,28,135,0.25),transparent_55%)] pointer-events-none" />

        <div className="container mx-auto px-4 pt-28 pb-16 md:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
          <div className="text-left max-w-xl lg:pr-4">
            <p className="text-amber-500/95 font-display text-sm md:text-base tracking-[0.2em] uppercase mb-4">
              Mythical Hero
            </p>
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-stone-100 leading-[1.1] mb-2"
            >
              Commence with glory.
            </motion.h1>
            <p className="font-display text-xl md:text-2xl text-amber-100/90 mb-6">
              Forge your AI fantasy hero — art, lore, and identity in one flow.
            </p>
            <p className="text-stone-400 text-base md:text-lg leading-relaxed mb-8 border-l-2 border-amber-600/60 pl-4">
              Gather your birth sign and a name that fits your tale. Mythical Hero weaves them into
              portraits you can share and a backstory worth reading — no illustration or prose skills
              required. Your party of one is ready when you are.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-6">
              <Link
                to={primaryTo}
                state={primaryState}
                onClick={() => track('cta_create_click', { placement: 'hero_primary' })}
              >
                <Button
                  size="lg"
                  icon={<ArrowRight size={20} />}
                  iconPosition="right"
                  className="border border-amber-700/40 shadow-lg shadow-amber-950/30"
                >
                  {isAuthenticated ? 'Enter the forge' : 'Begin free'}
                </Button>
              </Link>
              <a
                href="#legends"
                className="inline-flex items-center justify-center text-amber-200/90 hover:text-amber-100 text-sm font-medium tracking-wide border-b border-transparent hover:border-amber-500/50 transition-colors pb-0.5"
                onClick={() => track('cta_create_click', { placement: 'hero_secondary_legends' })}
              >
                View featured legends
              </a>
            </div>

            <p className="text-stone-500 text-sm">
              <span className="text-stone-600 uppercase tracking-wider text-xs">Available now</span>
              {' · '}
              Guided creation · High-resolution visuals · Share-ready output
            </p>

            {!isAuthenticated && (
              <p className="mt-6 text-sm text-stone-500">
                Already sworn in?{' '}
                <Link
                  to="/login"
                  state={{ from: { pathname: CREATE_PATH } }}
                  className="text-amber-400/90 hover:text-amber-300 underline-offset-2 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>

          <div className="relative lg:min-h-[420px]">
            <div className="absolute -inset-3 bg-gradient-to-tr from-amber-900/20 via-transparent to-mystic-800/30 rounded-sm blur-2xl" />
            <div className="relative border border-stone-700/80 bg-stone-950/50 shadow-2xl shadow-black/50 overflow-hidden rounded-sm">
              <img
                src="/front2.png"
                alt="Mythical Hero — cinematic fantasy character artwork"
                className="w-full h-[min(70vh,520px)] lg:h-[min(78vh,600px)] object-cover object-top"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-left">
                <p className="text-amber-500/90 text-xs uppercase tracking-[0.25em] mb-1">
                  Forge preview
                </p>
                <p className="font-display text-lg md:text-xl text-stone-100">
                  One flow from birth date to legend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative band — long-form story hook (high-signal RPG-site pattern). */}
      <section
        className="py-16 md:py-24 bg-stone-950 border-b border-stone-800/80"
        aria-labelledby="tale-heading"
      >
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 id="tale-heading" className="sr-only">
            The tale of Mythical Hero
          </h2>
          <p className="font-display text-2xl md:text-3xl text-stone-200 leading-snug mb-8">
            A name. A sign. A spark.
          </p>
          <p className="text-stone-400 text-base md:text-lg leading-relaxed">
            Mythical Hero is for anyone who wants a character that feels lived-in — not a blank
            sheet. Your Western and Chinese zodiac nudge tone, look, and fate; AI fills in the rest
            with portraits and prose you can iterate, keep private, or cast into the world. Step in
            when the story calls.
          </p>
        </div>
      </section>

      {/* Featured legends — companion cards with stat-style metadata. */}
      <section id="legends" className="py-20 scroll-mt-24 bg-mystic-900/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-amber-500/90 text-xs uppercase tracking-[0.3em] mb-3">
              Mythical Hero
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-stone-100 mb-4">
              Legends in the making
            </h2>
            <p className="text-stone-400">
              Same pipeline as your hero — portrait, flavor, and identity you can trace back to
              astrology-inspired roots.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {FEATURED_LEGENDS.map((legend, index) => (
              <motion.article
                key={legend.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group border border-stone-700/90 bg-stone-950/60 overflow-hidden rounded-sm shadow-xl shadow-black/40 flex flex-col"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={legend.image}
                    alt={`${legend.name} — ${legend.epithet}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                </div>
                <div className="p-6 flex flex-col flex-grow border-t border-stone-800">
                  <p className="text-amber-500/85 text-xs uppercase tracking-wider mb-1">
                    {legend.epithet}
                  </p>
                  <h3 className="font-display text-xl text-stone-100 mb-4">{legend.name}</h3>
                  <dl className="space-y-3 text-sm text-stone-400 flex-grow">
                    <div>
                      <dt className="text-stone-500 text-xs uppercase tracking-wide">Origin</dt>
                      <dd>{legend.origin}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 text-xs uppercase tracking-wide">Aspect</dt>
                      <dd>{legend.aspect}</dd>
                    </div>
                    <div>
                      <dt className="text-stone-500 text-xs uppercase tracking-wide">Calling</dt>
                      <dd>{legend.calling}</dd>
                    </div>
                  </dl>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-stone-950 border-t border-stone-800/80" aria-labelledby="how-heading">
        <div className="text-center mb-14">
          <h2 id="how-heading" className="font-display font-bold text-3xl md:text-4xl text-stone-100 mb-4">
            The path
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Three steps. Minutes, not months.
          </p>
        </div>
        <ol className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl list-none">
          {[
            {
              step: 'I',
              title: 'Your birth date',
              text: 'Western and Chinese zodiac shape tone, powers, and visuals.',
              icon: <Calendar className="h-8 w-8 text-amber-500/90" />,
            },
            {
              step: 'II',
              title: 'Name your hero',
              text: 'The name anchors voice, stakes, and how the story lands.',
              icon: <User className="h-8 w-8 text-amber-500/90" />,
            },
            {
              step: 'III',
              title: 'Generate',
              text: 'Portraits and backstory to read, refine, and share.',
              icon: <Sparkles className="h-8 w-8 text-amber-500/90" />,
            },
          ].map((item, index) => (
            <motion.li
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.35 }}
              className="border border-stone-800 bg-stone-900/50 p-8 text-center rounded-sm"
            >
              <div className="font-display text-amber-600/90 text-xl mb-4">{item.step}</div>
              <div className="flex justify-center mb-4 opacity-90">{item.icon}</div>
              <h3 className="text-lg font-semibold text-stone-100 mb-2">{item.title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{item.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Why Mythical Hero */}
      <section className="py-20 bg-mystic-900/40" aria-labelledby="why-heading">
        <div className="text-center mb-14">
          <h2 id="why-heading" className="font-display font-bold text-3xl md:text-4xl text-stone-100 mb-4">
            Why Mythical Hero
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Built for a definitive character sheet — not another generic fantasy portrait.
          </p>
        </div>
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          {[
            {
              icon: <Palette className="h-10 w-10 text-amber-500/85" />,
              title: 'Distinct identity',
              description:
                'Zodiac-informed prompts steer the AI away from tired tropes and toward a coherent hero.',
            },
            {
              icon: <Zap className="h-10 w-10 text-amber-500/85" />,
              title: 'Momentum',
              description: 'From signup to generated art and story without a slog through settings.',
            },
            {
              icon: <Share2 className="h-10 w-10 text-amber-500/85" />,
              title: 'Made to share',
              description: 'Output sized for social, tables, and collaborative fiction.',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className="border border-stone-800/90 bg-stone-950/40 p-8 rounded-sm"
            >
              <div className="mb-5 opacity-90">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-stone-100 mb-2">{feature.title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="py-20 bg-stone-950 border-t border-stone-800/80" aria-labelledby="pricing-heading">
        <div className="text-center mb-12">
          <h2 id="pricing-heading" className="font-display font-bold text-3xl md:text-4xl text-stone-100 mb-4">
            Free to begin, premium when you commit
          </h2>
          <p className="text-stone-400 max-w-2xl mx-auto">
            Explore first. Upgrade when your legend deserves the full treatment.
          </p>
        </div>
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-stone-700 bg-stone-900/60 rounded-sm p-8"
          >
            <h3 className="text-xl font-semibold text-stone-100 mb-4">Included free</h3>
            <ul className="space-y-3 text-stone-400 text-sm">
              {[
                'Guided creation with zodiac-based flavor',
                'AI images and backstory (within product limits)',
                'One active unpaid hero until you upgrade',
                'Heroes saved on your account when you register',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="h-5 w-5 text-amber-500/80 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="border border-amber-900/50 bg-gradient-to-br from-amber-950/30 to-stone-900 rounded-sm p-8"
          >
            <h3 className="text-xl font-semibold text-stone-100 mb-2">Premium</h3>
            <p className="text-amber-200/70 text-sm mb-4">
              Unlock when you are ready — checkout lives in the app.
            </p>
            <ul className="space-y-3 text-stone-400 text-sm">
              {[
                'Premium status and features on your hero',
                'Optional chapter unlocks for extended story',
                'Supports ongoing AI and platform work',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="h-5 w-5 text-amber-400/90 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-stone-950" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-10">
            <HelpCircle className="h-7 w-7 text-amber-500/80" />
            <h2 id="faq-heading" className="font-display font-bold text-2xl md:text-3xl text-stone-100">
              Questions
            </h2>
          </div>
          <dl className="space-y-8">
            {[
              {
                q: 'Do I need to know astrology?',
                a: 'No. Your birth date only nudges flavor — you do not need to read charts.',
              },
              {
                q: 'What do I get after sign-up?',
                a: 'You can run the creator, generate artwork and backstory, and keep heroes on your account within our limits.',
              },
              {
                q: 'Is payment required to try?',
                a: 'You can start free. Premium and optional chapters are there when you choose.',
              },
            ].map((item) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <dt className="font-semibold text-stone-200 mb-1">{item.q}</dt>
                <dd className="text-stone-400 text-sm leading-relaxed pl-0">{item.a}</dd>
              </motion.div>
            ))}
          </dl>
          <p className="text-center mt-12">
            <Link
              to="/faqs"
              className="text-amber-400/90 hover:text-amber-300 font-medium text-sm"
            >
              All FAQs →
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 pb-28 bg-gradient-to-b from-mystic-950 to-stone-950" aria-labelledby="final-cta-heading">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="container mx-auto px-4 max-w-3xl text-center border border-stone-700/80 bg-stone-900/40 backdrop-blur-sm rounded-sm p-10 md:p-14"
        >
          <h2 id="final-cta-heading" className="font-display font-bold text-3xl md:text-4xl text-stone-100 mb-4">
            The table is set
          </h2>
          <p className="text-stone-400 mb-8 max-w-xl mx-auto">
            Step into Mythical Hero and return with a character worthy of the tale you want to tell.
          </p>
          <Link
            to={primaryTo}
            state={primaryState}
            onClick={() => track('cta_create_click', { placement: 'footer_cta' })}
          >
            <Button size="lg" variant="secondary" icon={<Sparkles size={18} />}>
              {isAuthenticated ? 'Open the forge' : 'Begin free'}
            </Button>
          </Link>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default HomePage;
