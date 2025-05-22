import React from 'react';
import { formatMarkdown } from '../../utils/markdownHelper';
import { formatLiteraryBackstory } from '../../utils/literaryFormatter';

interface HeroBackstoryProps {
  backstory: string;
}

const HeroBackstory: React.FC<HeroBackstoryProps> = ({ backstory }) => {
  if (!backstory) {
    return (
      <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
        <h2 className="text-2xl font-semibold mb-4">Backstory</h2>
        <p className="text-cosmic-400">No backstory available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
      <div className="prose prose-invert max-w-none">
        <div 
          className="literary-content backstory-content"
          dangerouslySetInnerHTML={{ __html: formatLiteraryBackstory(backstory) }}
        />
      </div>
    </div>
  );
};

export default HeroBackstory; 