import React, { useState, useEffect } from 'react';

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
 * OptimizedImage component for better image loading performance
 * - Uses native lazy loading
 * - Provides placeholder during loading
 * - Supports WebP format if browser supports it
 * - Adds appropriate width/height to prevent layout shifts
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  placeholderColor = '#121225'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState(false);

  // Check WebP support on mount
  useEffect(() => {
    const checkWebPSupport = async () => {
      if (!self.createImageBitmap) return false;
      
      const webpData = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
      const blob = await fetch(webpData).then(r => r.blob());
      
      try {
        return await createImageBitmap(blob).then(() => true, () => false);
      } catch (e) {
        return false;
      }
    };

    checkWebPSupport().then(setSupportsWebP);
  }, []);

  // Determine final src based on WebP support
  const finalSrc = (() => {
    if (!supportsWebP) return src;
    
    // If we have a WebP version available
    if (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png')) {
      const webpSrc = src.substring(0, src.lastIndexOf('.')) + '.webp';
      // Here we'd need to check if the WebP file exists
      // For simplicity, we'll assume all images have WebP versions
      return webpSrc;
    }
    
    return src;
  })();

  // Style for the placeholder
  const placeholderStyle = {
    backgroundColor: placeholderColor,
    transition: 'opacity 0.3s ease',
    opacity: isLoaded ? 0 : 1,
  };

  // Sanitize alt text for better accessibility
  const sanitizedAlt = alt || 'Image';

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* Placeholder */}
      <div 
        className="absolute inset-0 z-0" 
        style={placeholderStyle}
        aria-hidden="true"
      />
      
      {/* Actual image */}
      <img
        src={finalSrc}
        alt={sanitizedAlt}
        width={width}
        height={height}
        loading={loading}
        className={`relative z-10 w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
};

export default OptimizedImage; 