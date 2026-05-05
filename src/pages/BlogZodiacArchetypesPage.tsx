import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowLeft, Star } from 'lucide-react';
import MetaTags from '../components/ui/MetaTags';
import JsonLd from '../components/seo/JsonLd';
import Button from '../components/ui/Button';
import OptimizedImage from '../components/ui/OptimizedImage';
import {
  LandingStyleHero,
  LandingStyleMain,
  LandingStylePageRoot,
} from '../components/layout/LandingStyleLayout';
import { PRODUCT_NAME, SITE_ORIGIN } from '../constants/brand';
import { BLOG_ZODIAC_ARCHETYPES_DATE } from '../constants/blogPublished';

const formatBlogDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const BlogZodiacArchetypesPage: React.FC = () => {
  const articleUrl = `${SITE_ORIGIN}/blog/zodiac-hero-archetypes`;
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'The Influence of Zodiac Signs on Hero Archetypes',
      datePublished: BLOG_ZODIAC_ARCHETYPES_DATE,
      dateModified: BLOG_ZODIAC_ARCHETYPES_DATE,
      author: { '@type': 'Organization', name: PRODUCT_NAME },
      publisher: {
        '@type': 'Organization',
        name: PRODUCT_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/logo.jpg` },
      },
      mainEntityOfPage: articleUrl,
      image: `${SITE_ORIGIN}/front.png`,
    }),
    [articleUrl]
  );

  return (
    <LandingStylePageRoot>
      <MetaTags
        title="The Influence of Zodiac Signs on Hero Archetypes | Cosmic Heroes"
        description="Explore how zodiac signs shape character archetypes in fantasy storytelling. Learn about zodiac-based character creation for your personalized hero journey."
        image="/front.png"
        canonical={articleUrl}
      />
      <JsonLd id="jsonld-blog-zodiac-archetypes" data={jsonLd} />

      <LandingStyleHero
        eyebrow="Mythical Hero · Blog"
        title="The Influence of Zodiac Signs on Hero Archetypes"
        lead={
          <span className="inline-flex flex-wrap items-center gap-2 font-medium text-stone-300">
            <Calendar size={16} className="shrink-0 text-amber-500/90" />
            <span>Published {formatBlogDate(BLOG_ZODIAC_ARCHETYPES_DATE)}</span>
          </span>
        }
        leadStyle="plain"
      />

      <LandingStyleMain>
        <article className="max-w-4xl mx-auto">
          <div className="mb-8 md:mb-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-200/90 hover:text-amber-100 transition-colors tracking-wide border-b border-transparent hover:border-amber-500/50 pb-0.5"
            >
              <ArrowLeft size={16} />
              Back to blog
            </Link>
          </div>

          <div className="blog-entry-shell mb-12 md:mb-16">
            <div className="blog-entry-cover-wrap">
              <OptimizedImage
                src="/front.png"
                alt="Zodiac Signs and Hero Archetypes"
                className="absolute inset-0 h-full w-full"
                loading="eager"
                width={1200}
                height={600}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            </div>

            <div className="blog-entry-inner">
              <div className="blog-prose">
                <p className="lead">
                  The ancient practice of astrology has long influenced our understanding of personality
                  traits and character archetypes. In the realm of fantasy storytelling and character
                  creation, zodiac signs offer a rich foundation for developing complex, relatable heroes
                  with distinct powers and attributes.
                </p>

                <h2>Zodiac Elements and Hero Powers</h2>
                <p>
                  The twelve zodiac signs are divided into four elemental groups—fire, earth, air, and
                  water—each contributing unique characteristics to a hero&apos;s abilities and temperament
                  in personalized fantasy stories.
                </p>

                <div className="blog-topic-grid grid-cols-1 md:grid-cols-2 md:gap-8">
                  <div className="blog-topic-card">
                    <h3>
                      <Star className="h-5 w-5 shrink-0 text-amber-500/90" aria-hidden />
                      Fire Signs (Aries, Leo, Sagittarius)
                    </h3>
                    <p>
                      Heroes born under fire signs typically embody courage, passion, and transformative
                      energy. Their character arcs often feature bold quests and dramatic personal growth,
                      making them natural protagonists in hero journeys.
                    </p>
                  </div>

                  <div className="blog-topic-card">
                    <h3>
                      <Star className="h-5 w-5 shrink-0 text-amber-500/90" aria-hidden />
                      Earth Signs (Taurus, Virgo, Capricorn)
                    </h3>
                    <p>
                      Earth sign heroes bring stability, practicality, and endurance to fantasy narratives.
                      These characters excel in grounding magical worlds with their reliable nature and
                      methodical approach to challenges.
                    </p>
                  </div>

                  <div className="blog-topic-card">
                    <h3>
                      <Star className="h-5 w-5 shrink-0 text-amber-500/90" aria-hidden />
                      Air Signs (Gemini, Libra, Aquarius)
                    </h3>
                    <p>
                      Intellectual and communicative, air sign heroes often serve as strategists, diplomats,
                      or innovators in personalized stories. Their journey typically involves connecting
                      disparate elements and finding clever solutions.
                    </p>
                  </div>

                  <div className="blog-topic-card">
                    <h3>
                      <Star className="h-5 w-5 shrink-0 text-amber-500/90" aria-hidden />
                      Water Signs (Cancer, Scorpio, Pisces)
                    </h3>
                    <p>
                      Intuitive and emotionally profound, water sign heroes bring depth and empathy to
                      fantasy narratives. Their character development often involves emotional transformation
                      and connecting with mystical or hidden realms.
                    </p>
                  </div>
                </div>

                <h2>Zodiac-Based Character Creation in AI Storytelling</h2>
                <p>
                  Modern AI-driven personalized storytelling systems use zodiac attributes as fundamental
                  building blocks for creating unique character identities. By analyzing the specific traits
                  associated with a user&apos;s birth date, AI can generate heroes that resonate with their
                  cosmic essence.
                </p>

                <p>This zodiac-based character creation process includes:</p>

                <ul>
                  <li>
                    <strong>Physical attributes</strong> that reflect zodiac symbolism and elemental
                    associations
                  </li>
                  <li>
                    <strong>Personality traits</strong> aligned with the strengths and challenges of the sign
                  </li>
                  <li>
                    <strong>Mythological connections</strong> drawing from ancient stories related to each
                    constellation
                  </li>
                  <li>
                    <strong>Character arcs</strong> that mirror the developmental journey associated with each
                    sign
                  </li>
                </ul>

                <h2>Integrating Multiple Zodiac Influences</h2>
                <p>
                  In sophisticated personalized fantasy story systems, AI can incorporate not just the sun
                  sign but also moon and rising signs to create multi-dimensional heroes. This approach
                  allows for nuanced character development that reflects the complexity of real human
                  personalities.
                </p>

                <p>
                  The combination of various zodiac influences creates unique hero archetypes that go beyond
                  simple categorizations. For example, an Aries sun with a Pisces moon might manifest as a
                  warrior with mystic visions, while a Taurus sun with a Gemini rising could appear as a
                  steady provider with quick wit and adaptability.
                </p>

                <h2>The Future of Zodiac-Powered Mythical Identities</h2>
                <p>
                  As AI technology continues to evolve, we&apos;re entering an era of increasingly
                  sophisticated zodiac-based character creation. Future developments in personalized fantasy
                  storytelling will likely include:
                </p>

                <ul>
                  <li>More nuanced integration of planetary aspects and house placements</li>
                  <li>Cultural variations in zodiac interpretation for globally diverse character creation</li>
                  <li>Interactive story paths that adapt to both zodiac influences and user choices</li>
                  <li>Community features allowing for collaborative storytelling between compatible zodiac heroes</li>
                </ul>

                <p>
                  Whether you&apos;re a skeptic or believer in astrological influences, the rich symbolic
                  language of the zodiac provides a framework for compelling heroes in fantasy narratives.
                  AI-driven storytelling can create personalized fantasy stories that feel both fresh and
                  familiar.
                </p>

                <div className="blog-cta-box mt-12 md:mt-14">
                  <h3>Begin your own zodiac hero journey</h3>
                  <p className="mb-6">
                    Discover your personalized fantasy story with a character crafted from your cosmic
                    influences.
                  </p>
                  <Link to="/create">
                    <Button className="border border-amber-700/40 shadow-lg shadow-amber-950/30">
                      Create your zodiac hero
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </LandingStyleMain>
    </LandingStylePageRoot>
  );
};

export default BlogZodiacArchetypesPage;
