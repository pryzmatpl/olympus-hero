import React, { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  placeholderColor?: string;
}

/**
 * Responsive cover image helper: placeholder until load, then fades in.
 * Uses the supplied URL as-is so deployed assets match the repo (no assumed .webp sibling).
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  placeholderColor = '#121225',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const placeholderStyle = {
    backgroundColor: placeholderColor,
    transition: 'opacity 0.3s ease',
    opacity: isLoaded ? 0 : 1,
  };

  const sanitizedAlt = alt || 'Image';

  const showImage = () => setIsLoaded(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 z-0" style={placeholderStyle} aria-hidden="true" />

      <img
        src={src}
        alt={sanitizedAlt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        className={`relative z-10 h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={showImage}
        onError={showImage}
      />
    </div>
  );
};

export default OptimizedImage;
