import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Star,
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

const CREATE_PATH = '/create';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);

  const primaryTo = isAuthenticated ? CREATE_PATH : '/register';
  const primaryState = isAuthenticated ? undefined : { from: { pathname: CREATE_PATH } };

  const metaTitle =
    'Cosmic Heroes — Create Your AI Fantasy Hero in Minutes';
  const metaDescription =
    'Turn your birth date and hero name into AI-generated artwork and a personalized fantasy backstory. Free to start; upgrade for premium.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 pt-24 pb-16"
    >
      <MetaTags
        title={metaTitle}
        description={metaDescription}
        image="/logo.jpg"
      />

      {/* Hero */}
      <section
        aria-labelledby="hero-heading"
        className="min-h-[80vh] flex flex-col items-center justify-center text-center relative"
      >
        <div className="absolute inset-0 bg-cosmic-radial -z-10" />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6"
        >
          <Sparkles className="h-12 w-12 text-cosmic-500 inline-block animate-pulse-slow" />
        </motion.div>

        <motion.h1
          id="hero-heading"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight"
        >
          Your fantasy hero,{' '}
          <br className="md:hidden" />
          <span className="bg-gradient-to-r from-white to-cosmic-500 bg-clip-text text-transparent">
            story and art — in minutes
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mb-6"
        >
          Add your birth date and a name. Cosmic Heroes builds a unique character with
          AI images and a backstory you can share — no drawing or writing skills
          required.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-2 mb-8 text-sm text-gray-400"
        >
          <span className="px-3 py-1 rounded-full bg-mystic-800/80 border border-mystic-600">
            ~2 min to start
          </span>
          <span className="px-3 py-1 rounded-full bg-mystic-800/80 border border-mystic-600">
            No design skills
          </span>
          <span className="px-3 py-1 rounded-full bg-mystic-800/80 border border-mystic-600">
            Free to try
          </span>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to={primaryTo} state={primaryState}>
            <Button
              size="lg"
              icon={<ArrowRight size={20} />}
              iconPosition="right"
              className="group"
            >
              <span className="group-hover:mr-1 transition-all">
                {isAuthenticated ? 'Create my hero' : 'Create my hero free'}
              </span>
            </Button>
          </Link>
          <a
            href="#example-heroes"
            className="inline-flex items-center justify-center rounded-full font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mystic-500 border-2 border-mystic-600 text-white hover:bg-mystic-800 text-base px-6 py-3"
          >
            See example heroes
          </a>
        </motion.div>

        {!isAuthenticated && (
          <p className="mt-4 text-sm text-gray-500">
            Already have an account?{' '}
            <Link
              to="/login"
              state={{ from: { pathname: CREATE_PATH } }}
              className="text-cosmic-400 hover:text-cosmic-300"
            >
              Sign in
            </Link>{' '}
            to go straight to creation.
          </p>
        )}

        <div
          id="example-heroes"
          className="mt-16 flex flex-wrap justify-center gap-8 scroll-mt-28"
        >
          {[
            {
              name: 'Blazorus',
              id: 1,
              url: '/hero-showcase/aries.webp',
              caption: 'Sample AI portrait + identity',
            },
            {
              name: 'Energus',
              id: 2,
              url: '/hero-showcase/capricorn.webp',
              caption: 'Zodiac-inspired look',
            },
            {
              name: 'Manakuanea',
              id: 3,
              url: '/hero-showcase/rooster.webp',
              caption: 'Shareable hero card',
            },
          ].map((elem) => (
            <motion.div
              key={elem.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 1 + elem.id * 0.2,
                duration: 0.8,
                y: {
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 4 + elem.id * 0.5,
                  ease: 'easeInOut',
                },
              }}
              className="relative w-64 h-64 md:w-72 md:h-72 rounded-lg overflow-hidden shadow-cosmic"
            >
              <img
                src={elem.url}
                alt={`Example fantasy hero portrait: ${elem.name}`}
                className="w-full h-full object-cover"
                loading="lazy"
                fetchPriority={elem.id === 1 ? 'high' : 'auto'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-mystic-900 via-transparent to-transparent" />
              <div className="absolute bottom-0 w-full p-4 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-cosmic-500 shrink-0" />
                  <span className="text-sm font-medium">{elem.name}</span>
                </div>
                <span className="text-xs text-gray-400">{elem.caption}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20" aria-labelledby="how-heading">
        <div className="text-center mb-16">
          <h2 id="how-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
            How it works
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Three quick steps from idea to your own mythical hero.
          </p>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto list-none">
          {[
            {
              step: '1',
              title: 'Your birth date',
              text: 'Western and Chinese zodiac influence powers, tone, and visuals.',
              icon: <Calendar className="h-8 w-8 text-cosmic-500" />,
            },
            {
              step: '2',
              title: 'Name your hero',
              text: 'Pick a name that feels right — it anchors your story.',
              icon: <User className="h-8 w-8 text-cosmic-500" />,
            },
            {
              step: '3',
              title: 'Generate',
              text: 'Get multiple AI portraits and a personalized backstory to read and share.',
              icon: <Sparkles className="h-8 w-8 text-cosmic-500" />,
            },
          ].map((item, index) => (
            <motion.li
              key={item.step}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="bg-gradient-to-b from-mystic-800 to-mystic-900 p-8 rounded-xl shadow-mystic text-center"
            >
              <div className="text-cosmic-500 font-display text-2xl font-bold mb-4">{item.step}</div>
              <div className="flex justify-center mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-300 text-sm">{item.text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Differentiators */}
      <section className="py-20" aria-labelledby="why-heading">
        <div className="text-center mb-16">
          <h2 id="why-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
            Why Cosmic Heroes
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Built for anyone who wants a memorable character — not a blank canvas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Palette className="h-10 w-10 text-cosmic-500" />,
              title: 'Yours, not generic',
              description:
                'Astrology-inspired traits help the AI avoid cookie-cutter fantasy tropes.',
            },
            {
              icon: <Zap className="h-10 w-10 text-cosmic-500" />,
              title: 'Fast to delight',
              description:
                'Go from signup to generated images and story without a learning curve.',
            },
            {
              icon: <Share2 className="h-10 w-10 text-cosmic-500" />,
              title: 'Made to share',
              description:
                'Show off your hero and story — perfect for social or collaborative tales.',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="bg-gradient-to-b from-mystic-800 to-mystic-900 p-8 rounded-xl shadow-mystic"
            >
              <div className="bg-mystic-700/50 p-3 rounded-full w-fit mb-6">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="py-20" aria-labelledby="pricing-heading">
        <div className="text-center mb-12">
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-display font-bold mb-4">
            Free to start, premium when you love it
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Create and explore first. Upgrade unlocks the full premium experience on your hero.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-mystic-800/80 border border-mystic-600 rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold mb-4">Included free</h3>
            <ul className="space-y-3 text-gray-300">
              {[
                'Guided hero creation with zodiac-based flavor',
                'AI-generated images and backstory (per product limits)',
                'Your heroes saved when you register',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="h-5 w-5 text-cosmic-500 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-cosmic-900/40 to-mystic-900 border border-cosmic-700/50 rounded-2xl p-8"
          >
            <h3 className="text-xl font-semibold mb-2">Premium upgrade</h3>
            <p className="text-cosmic-300 text-sm mb-4">
              Unlock premium on a hero when you are ready (secure checkout in-app).
            </p>
            <ul className="space-y-3 text-gray-300">
              {[
                'Premium hero status and features tied to your account',
                'Optional chapter unlocks for extended story content',
                'Support ongoing AI and platform improvements',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="h-5 w-5 text-cosmic-400 shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FAQ slice */}
      <section className="py-16" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 justify-center mb-8">
            <HelpCircle className="h-8 w-8 text-cosmic-500" />
            <h2 id="faq-heading" className="text-2xl md:text-3xl font-display font-bold text-center">
              Quick answers
            </h2>
          </div>
          <dl className="space-y-6">
            {[
              {
                q: 'Do I need to know astrology?',
                a: 'No. Your birth date is used to inspire your hero — you do not need to study charts.',
              },
              {
                q: 'What do I get after I sign up?',
                a: 'You can run the creator flow, generate AI artwork and a backstory, and keep heroes on your account subject to our limits.',
              },
              {
                q: 'Is payment required to try?',
                a: 'You can start free. Premium and optional chapter unlocks are available when you choose to upgrade in the app.',
              },
            ].map((item) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <dt className="font-semibold text-white mb-1">{item.q}</dt>
                <dd className="text-gray-300 text-sm pl-0">{item.a}</dd>
              </motion.div>
            ))}
          </dl>
          <p className="text-center mt-10">
            <Link to="/faqs" className="text-cosmic-400 hover:text-cosmic-300 font-medium">
              Read all FAQs →
            </Link>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20" aria-labelledby="final-cta-heading">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-mystic-gradient p-10 md:p-16 rounded-2xl text-center"
        >
          <h2 id="final-cta-heading" className="text-3xl md:text-4xl font-display font-bold mb-6">
            Ready for your hero?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Join in minutes. Your next fantasy identity is one short flow away.
          </p>
          <Link to={primaryTo} state={primaryState}>
            <Button size="lg" variant="secondary" icon={<Sparkles size={18} />}>
              {isAuthenticated ? 'Open creator' : 'Create my hero free'}
            </Button>
          </Link>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default HomePage;
