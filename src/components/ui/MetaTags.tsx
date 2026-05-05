import React, { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  /** Full URL for og:url; canonical is derived unless `canonical` is set */
  url?: string;
  /** Absolute or path-normalized canonical URL (defaults to `url` without hash) */
  canonical?: string;
  siteName?: string;
  locale?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  /** e.g. @YourBrand */
  twitterSite?: string;
  /** e.g. noindex,follow for low-value authenticated surfaces */
  robots?: string;
}

const DEFAULT_TITLE =
  'Cosmic Heroes — Create Your AI Fantasy Hero in Minutes';
const DEFAULT_DESCRIPTION =
  'Turn your birth date and hero name into AI-generated artwork and a personalized fantasy backstory. Free to start; upgrade for premium.';

function getAbsoluteUrl(relativeOrAbsolute: string): string {
  if (relativeOrAbsolute.startsWith('http')) {
    return relativeOrAbsolute;
  }
  const origin = window.location.origin;
  return relativeOrAbsolute.startsWith('/')
    ? `${origin}${relativeOrAbsolute}`
    : `${origin}/${relativeOrAbsolute}`;
}

function stripHash(href: string): string {
  try {
    const u = new URL(href);
    u.hash = '';
    return u.toString();
  } catch {
    return href;
  }
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = '/logo.jpg',
  type = 'website',
  url = typeof window !== 'undefined' ? window.location.href : '',
  canonical,
  siteName = 'Cosmic Heroes',
  locale = 'en_US',
  twitterCard = 'summary_large_image',
  twitterSite,
  robots,
}) => {
  const resolvedUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const resolvedCanonical = canonical ?? stripHash(resolvedUrl);

  useEffect(() => {
    const originalTitle = document.title;

    const originalMeta: Record<string, string> = {};
    document.querySelectorAll('meta').forEach((el) => {
      const m = el as HTMLMetaElement;
      const prop = m.getAttribute('property');
      const name = m.getAttribute('name');
      const key = prop || name;
      if (!key) return;
      if (
        key.startsWith('og:') ||
        key.startsWith('twitter:') ||
        key === 'description' ||
        key === 'robots'
      ) {
        originalMeta[key] = m.getAttribute('content') || '';
      }
    });

    let robotsEl: HTMLMetaElement | null = document.querySelector('meta[name="robots"]');
    let createdRobots = false;
    const hadRobots = !!robotsEl;
    const originalRobots = robotsEl?.getAttribute('content') ?? '';
    if (robots) {
      if (!robotsEl) {
        robotsEl = document.createElement('meta');
        robotsEl.setAttribute('name', 'robots');
        document.head.appendChild(robotsEl);
        createdRobots = !hadRobots;
      }
      robotsEl.setAttribute('content', robots);
    }

    const existingCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const hadCanonical = !!existingCanonical;
    const originalCanonicalHref = existingCanonical?.getAttribute('href') ?? '';
    let createdCanonical = false;
    let canonicalLink = existingCanonical;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
      createdCanonical = !hadCanonical;
    }
    canonicalLink.setAttribute('href', resolvedCanonical);

    const updateMeta = (key: string, content: string) => {
      let el: HTMLMetaElement | null = document.querySelector(
        `meta[property="${key}"], meta[name="${key}"]`
      );
      if (!el) {
        el = document.createElement('meta');
        if (key.startsWith('og:')) {
          el.setAttribute('property', key);
        } else {
          el.setAttribute('name', key);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    document.title = title;
    updateMeta('description', description);
    updateMeta('og:title', title);
    updateMeta('og:description', description);
    updateMeta('og:image', getAbsoluteUrl(image));
    updateMeta('og:type', type);
    updateMeta('og:url', resolvedUrl);
    updateMeta('og:site_name', siteName);
    updateMeta('og:locale', locale);
    updateMeta('twitter:card', twitterCard);
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', getAbsoluteUrl(image));
    if (twitterSite) {
      updateMeta('twitter:site', twitterSite);
    }

    return () => {
      document.title = originalTitle;

      Object.entries(originalMeta).forEach(([key, value]) => {
        const el = document.querySelector(
          `meta[property="${key}"], meta[name="${key}"]`
        ) as HTMLMetaElement | null;
        if (el) {
          el.setAttribute('content', value);
        }
      });

      if (robotsEl) {
        if (createdRobots) {
          robotsEl.remove();
        } else if (robots) {
          robotsEl.setAttribute('content', originalRobots);
        }
      }

      if (canonicalLink) {
        if (createdCanonical) {
          canonicalLink.remove();
        } else {
          canonicalLink.setAttribute('href', originalCanonicalHref);
        }
      }
    };
  }, [
    title,
    description,
    image,
    type,
    resolvedUrl,
    resolvedCanonical,
    siteName,
    locale,
    twitterCard,
    twitterSite,
    robots,
  ]);

  return null;
};

export default MetaTags;
