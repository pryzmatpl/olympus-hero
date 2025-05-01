import React, { useState } from 'react';

interface HeroPortraitProps {
  images: Array<{ angle: string; url: string }>;
  isPreview?: boolean;
}

const HeroPortrait: React.FC<HeroPortraitProps> = ({ images, isPreview = false }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  
  if (!images || images.length === 0) {
    return (
      <div className="bg-mystic-800/60 rounded-lg aspect-square flex items-center justify-center">
        <p className="text-cosmic-400">No images available</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="bg-mystic-800/60 rounded-lg overflow-hidden">
        <img 
          src={images[selectedImage].url} 
          alt={`Hero portrait - ${images[selectedImage].angle} view`}
          className={`w-full aspect-square object-cover ${isPreview ? 'opacity-80' : ''}`}
        />
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-2 mt-3">
          {images.map((image, index) => (
            <button
              key={index}
              className={`flex-1 p-1 rounded-md ${selectedImage === index ? 'ring-2 ring-cosmic-500' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => setSelectedImage(index)}
            >
              <img 
                src={image.url} 
                alt={`Hero portrait thumbnail - ${image.angle} view`}
                className="w-full aspect-square object-cover rounded"
              />
              <span className="sr-only">{image.angle} view</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroPortrait; 