// Mock implementation of OpenAI API calls
// In a production environment, this would use the actual OpenAI API

// Helper function to get random items from an array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate image prompts based on hero details and view angle
export async function generateOpenAIImages(heroName, westernZodiac, chineseZodiac, viewAngle) {
  // In a real implementation, this would call the OpenAI API
  console.log(`Generating ${viewAngle} view image for ${heroName}...`);
  
  // Generate a mock image URL
  // In a real application, this would be the URL returned by OpenAI
  
  // These are placeholder image URLs from Pexels
  const placeholderImageUrls = {
    front: 'https://images.pexels.com/photos/1554646/pexels-photo-1554646.jpeg',
    profile: 'https://images.pexels.com/photos/3493777/pexels-photo-3493777.jpeg',
    action: 'https://images.pexels.com/photos/4900927/pexels-photo-4900927.jpeg'
  };
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    angle: viewAngle,
    imageUrl: placeholderImageUrls[viewAngle],
    prompt: generateImagePrompt(heroName, westernZodiac, chineseZodiac, viewAngle)
  };
}

// Generate a hero backstory based on zodiac info
export async function generateBackstory(heroName, westernZodiac, chineseZodiac) {
  // In a real implementation, this would call the OpenAI API
  console.log(`Generating backstory for ${heroName}...`);
  
  // Get some random traits to incorporate
  const westernTraits = getRandomItems(westernZodiac.traits, 2);
  const chineseTraits = getRandomItems(chineseZodiac.traits, 2);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Template for the backstory
  const backstory = `
## The Legend of ${heroName}

Born under the mystical convergence of the ${westernZodiac.sign} and ${chineseZodiac.sign} zodiac signs, ${heroName} emerged 
as a guardian between realms. Their powers are deeply influenced by the element of ${westernZodiac.element} from their 
Western zodiac, granting them ${westernZodiac.strengths.join(', ')}.

From their Chinese zodiac heritage as a ${chineseZodiac.sign}, they inherited the qualities of being ${chineseTraits.join(', ')},
which shaped their approach to using their cosmic abilities.

${heroName}'s greatest strengths lie in their ${westernZodiac.strengths[0]} and ${chineseTraits[0]}, though they sometimes 
struggle with ${westernZodiac.weaknesses[0]}. Their cosmic mission is to maintain balance between the twelve zodiac realms, 
serving as both protector and mediator.

The constellation of ${westernZodiac.sign} shines brightly whenever ${heroName} uses their full power, creating a spectacular 
display of cosmic energy that few adversaries can withstand.
  `;
  
  return backstory;
}

// Helper function to generate a detailed image prompt
function generateImagePrompt(heroName, westernZodiac, chineseZodiac, viewAngle) {
  // Get random traits to incorporate
  const westernTraits = getRandomItems(westernZodiac.traits, 2);
  const chineseTraits = getRandomItems(chineseZodiac.traits, 2);
  
  // Base color palette influenced by western element
  let colorPalette = '';
  switch (westernZodiac.element) {
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
  const animalInfluence = `subtle ${chineseZodiac.sign.toLowerCase()} motifs, ${chineseZodiac.element} influences`;
  
  // Build the prompt
  const prompt = `
    Mythical cosmic hero named "${heroName}", 
    a powerful character with ${westernZodiac.sign} and ${chineseZodiac.sign} zodiac influences.
    ${westernTraits.join(', ')} personality, combined with ${chineseTraits.join(', ')} traits.
    ${viewDescription}.
    Costume featuring ${colorPalette} color scheme with ${animalInfluence}.
    Ethereal cosmic background with zodiac constellations.
    Digital art, highly detailed, professional character design, 4K, cinematic lighting.
  `.trim().replace(/\s+/g, ' ');
  
  return prompt;
}