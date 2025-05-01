import React from 'react';

interface ZodiacInfoProps {
  westernZodiac: string;
  chineseZodiac: string;
}

const ZodiacInfo: React.FC<ZodiacInfoProps> = ({ westernZodiac, chineseZodiac }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-mystic-800/60 rounded-lg p-4 border border-mystic-700 text-center">
        <h3 className="text-lg font-semibold mb-1">Western Sign</h3>
        <p className="text-cosmic-300 text-xl">{westernZodiac}</p>
      </div>
      
      <div className="bg-mystic-800/60 rounded-lg p-4 border border-mystic-700 text-center">
        <h3 className="text-lg font-semibold mb-1">Chinese Sign</h3>
        <p className="text-cosmic-300 text-xl">{chineseZodiac}</p>
      </div>
    </div>
  );
};

export default ZodiacInfo; 