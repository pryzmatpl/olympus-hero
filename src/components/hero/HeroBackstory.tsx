import React from 'react';

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
  
  // Split the content into sections by H2 headers (## in markdown)
  const sections = backstory.split(/(?=## )/);
  
  // Process each section based on its type
  const processedSections = sections.map((section, index) => {
    // Check if it's the stats section
    if (section.includes('### Stats')) {
      const [title, ...content] = section.split('\n');
      const statsIndex = content.findIndex(line => line.includes('### Stats'));
      
      // Extract the explanation text
      const explanationText = content.slice(0, statsIndex).join('\n');
      
      // Extract the stats
      const statsLines = content.slice(statsIndex + 1).filter(line => line.includes(':'));
      const statsArray = statsLines.map(line => {
        const [stat, value] = line.split(':').map(s => s.trim());
        return { stat, value: parseInt(value) || 0 };
      });
      
      // Create the stats display with progress bars
      return (
        <div key={index} className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">{title.replace('## ', '')}</h2>
          <p className="mb-4">{explanationText}</p>
          
          <h3 className="text-xl font-semibold mb-3">Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {statsArray.map(({ stat, value }, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-cosmic-300">{stat}</span>
                  <span className="text-cosmic-400">{value}</span>
                </div>
                <div className="w-full bg-mystic-900 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full"
                    style={{ 
                      width: `${(value / 20) * 100}%`,
                      backgroundColor: getStatColor(stat)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <p className="mt-4">{content.slice(statsIndex + statsLines.length + 1).join('\n')}</p>
        </div>
      );
    } else {
      // For regular text sections
      const [title, ...content] = section.split('\n');
      return (
        <div key={index} className="mb-6">
          {title.startsWith('## ') ? (
            <h2 className="text-2xl font-semibold mb-3">{title.replace('## ', '')}</h2>
          ) : null}
          {content.map((paragraph, i) => (
            <p key={i} className={paragraph.trim() ? "mb-4" : ""}>{paragraph}</p>
          ))}
        </div>
      );
    }
  });
  
  return (
    <div className="bg-mystic-800/60 rounded-lg p-6 border border-mystic-700">
      <div className="prose prose-invert max-w-none">
        {processedSections}
      </div>
    </div>
  );
};

// Helper function to get color for each stat
const getStatColor = (stat: string): string => {
  const statColors: {[key: string]: string} = {
    Strength: '#e74c3c',      // Red
    Dexterity: '#2ecc71',     // Green
    Constitution: '#e67e22',  // Orange
    Intelligence: '#3498db',  // Blue
    Wisdom: '#9b59b6',        // Purple
    Charisma: '#f1c40f',      // Yellow
    Magic: '#8e44ad',         // Dark Purple
    Luck: '#1abc9c'           // Teal
  };
  
  return statColors[stat] || '#bdc3c7'; // Default gray
};

export default HeroBackstory; 