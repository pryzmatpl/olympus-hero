import React, { useEffect } from 'react';

interface JsonLdProps {
  id: string;
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Injects JSON-LD into document head; removes script on unmount.
 */
const JsonLd: React.FC<JsonLdProps> = ({ id, data }) => {
  const serialized = JSON.stringify(data);
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = serialized;
    document.head.appendChild(script);
    return () => {
      const existing = document.getElementById(id);
      if (existing?.parentNode) {
        existing.parentNode.removeChild(existing);
      }
    };
  }, [id, serialized]);

  return null;
};

export default JsonLd;
