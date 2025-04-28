import { ZodiacInfo } from '../hooks/useZodiac';

interface PromptParams {
  heroName: string;
  zodiacInfo: ZodiacInfo;
  viewAngle: 'front' | 'profile' | 'action';
}

// Helper function to get random items from an array
const getRandomItems = (array: string[], count: number): string[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateHeroPrompt = ({ heroName, zodiacInfo, viewAngle }: PromptParams): string => {
  // Extract zodiac elements
  const { western, chinese } = zodiacInfo;
  
  // Get random traits to incorporate
  const westernTraits = getRandomItems(western.traits, 2);
  const chineseTraits = getRandomItems(chinese.traits, 2);
  
  // Base color palette influenced by western element
  let colorPalette = '';
  switch (western.element) {
    case 'Fire':
      colorPalette = 'vibrant reds, oranges, and golds';
      break;
    case 'Earth':
      colorPalette = 'rich browns, deep greens, and amber accents';
      break;
    case 'Air':
      colorPalette = 'silver, pale blues, and light purples';
      break;
    case 'Water':
      colorPalette = 'deep blues, teals, and flowing purples';
      break;
    default:
      colorPalette = 'mystical purples, cosmic blues, and starlight accents';
  }
  
  // Generate view-specific descriptions
  let viewDescription = '';
  switch (viewAngle) {
    case 'front':
      viewDescription = 'full frontal view, dramatic lighting, heroic pose, looking directly at viewer';
      break;
    case 'profile':
      viewDescription = 'side profile view, atmospheric lighting, contemplative pose, looking toward horizon';
      break;
    case 'action':
      viewDescription = 'dynamic action pose, powers on display, dramatic angle, intense movement';
      break;
  }
  
  // Chinese zodiac animal influence
  const animalInfluence = `subtle ${chinese.sign.toLowerCase()} motifs, ${chinese.element} influences`;
  
  // Build the prompt
  const prompt = `
    Mythical cosmic hero named "${heroName}", 
    a powerful character with ${western.sign} and ${chinese.sign} zodiac influences.
    ${westernTraits.join(', ')} personality, combined with ${chineseTraits.join(', ')} traits.
    ${viewDescription}.
    Costume featuring ${colorPalette} color scheme with ${animalInfluence}.
    Ethereal cosmic background with zodiac constellations.
    Digital art, highly detailed, professional character design, 4K, cinematic lighting.
  `.trim().replace(/\s+/g, ' ');
  
  return prompt;
};

export const generateHeroBackstory = (heroName: string, zodiacInfo: ZodiacInfo): string => {
  const { western, chinese } = zodiacInfo;
  
  // Template for the backstory
  const backstory = `
    ## The Legend of ${heroName}

    Born under the mystical convergence of the ${western.sign} and ${chinese.sign} zodiac signs, ${heroName} emerged 
    as a guardian between realms. Their powers are deeply influenced by the element of ${western.element} from their 
    Western zodiac, granting them ${western.strengths.join(', ')}.

    From their Chinese zodiac heritage as a ${chinese.sign}, they inherited the qualities of being ${chinese.traits.slice(0, 3).join(', ')},
    which shaped their approach to using their cosmic abilities.

    ${heroName}'s greatest strengths lie in their ${western.strengths[0]} and ${chinese.traits[0]}, though they sometimes 
    struggle with ${western.weaknesses[0]}. Their cosmic mission is to maintain balance between the twelve zodiac realms, 
    serving as both protector and mediator.

    The constellation of ${western.sign} shines brightly whenever ${heroName} uses their full power, creating a spectacular 
    display of cosmic energy that few adversaries can withstand.
  `;
  
  return backstory;
};