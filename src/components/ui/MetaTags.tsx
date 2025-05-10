import React, { useEffect } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
}

const MetaTags: React.FC<MetaTagsProps> = ({ 
  title = 'Cosmic Heroes - Your Zodiac-Powered Mythical Identity',
  description = 'Discover your cosmic alter-ego through the ancient wisdom of zodiac signs. Create a mythical hero powered by your celestial birth chart and embark on legendary adventures across the stars.',
  image = '/logo.jpg',
  type = 'website',
  url = window.location.href
}) => {
  useEffect(() => {
    // Save original meta tags to restore them when component unmounts
    const originalTitle = document.title;
    const originalMetaTags: Record<string, string> = {};
    const metaElements = document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
    
    metaElements.forEach(el => {
      const meta = el as HTMLMetaElement;
      const key = meta.getAttribute('property') || meta.getAttribute('name') || '';
      originalMetaTags[key] = meta.getAttribute('content') || '';
    });

    // Set page title
    document.title = title;

    // Update Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', getAbsoluteUrl(image));
    updateMetaTag('og:type', type);
    updateMetaTag('og:url', url);

    // Update Twitter Card meta tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', getAbsoluteUrl(image));

    // Cleanup function to restore original meta tags when component unmounts
    return () => {
      document.title = originalTitle;
      
      Object.entries(originalMetaTags).forEach(([key, value]) => {
        updateMetaTag(key, value);
      });
    };
  }, [title, description, image, type, url]);

  // Helper function to update meta tag
  const updateMetaTag = (key: string, content: string) => {
    let element: HTMLMetaElement | null = document.querySelector(`meta[property="${key}"], meta[name="${key}"]`);
    
    if (!element) {
      element = document.createElement('meta');
      if (key.startsWith('og:')) {
        element.setAttribute('property', key);
      } else {
        element.setAttribute('name', key);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  // Helper function to convert relative URLs to absolute
  const getAbsoluteUrl = (relativeUrl: string): string => {
    if (relativeUrl.startsWith('http')) {
      return relativeUrl;
    }
    
    // Use the current origin (protocol + domain)
    const origin = window.location.origin;
    
    // Handle URLs with or without leading slash
    return relativeUrl.startsWith('/') 
      ? `${origin}${relativeUrl}` 
      : `${origin}/${relativeUrl}`;
  };

  // This component doesn't render anything visible
  return null;
};

export default MetaTags; 