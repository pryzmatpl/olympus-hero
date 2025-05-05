import { OpenAI } from 'openai';

const openai = new OpenAI({api_key: process.env.OPENAI_API_KEY});

// Helper function to get random items from an array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export async function generateExpandedBackstory(backstory) {
  // OpenAI API endpoint for chat completions
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  // Get API key from environment variable or configuration
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error('OpenAI API key is not configured');
  }s

  // Prepare the request payload
  const payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a creative writing assistant that specializes in fantasy character backstories. Expand on the provided backstory with more details, including childhood, notable achievements, relationships, and personal struggles. Keep the tone consistent with the original backstory."
      },
      {
        role: "user",
        content: `Please expand this character backstory with more details: ${backstory}`
      }
    ],
    temperature: 0.8,
    max_tokens: 1000
  };

  try {
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify(payload)
    });

    // Handle unsuccessful responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API request failed with status ${response.status}: ${JSON.stringify(errorData)}`);
    }

    // Parse the successful response
    const result = await response.json();

    // Verify that we have a valid response with choices
    if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI API');
    }

    // Extract the expanded backstory from the response
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Generate image prompts based on hero details and view angle
export async function generateOpenAIImages(heroName, westernZodiac, chineseZodiac, viewAngle) {
  console.log(`Generating ${viewAngle} view image for ${heroName}...`);

  const prompt = generateImagePrompt(heroName, westernZodiac, chineseZodiac, viewAngle);

  try {
    const response = await openai.createImage({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
      n: 1,
    });

    const imageUrl = response.data.data[0].url;

    return {
      angle: viewAngle,
      url: imageUrl,
      prompt: prompt,
    };
  } catch (error) {
    console.error(`Error generating image for ${heroName}:`, error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Generate character stats based on zodiac traits
function generateCharacterStats(westernZodiac, chineseZodiac) {
  // Base stats influenced by zodiac signs
  const baseStats = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    magic: 10,
    luck: 10
  };
  
  // Adjust stats based on western zodiac element
  switch (westernZodiac.element) {
    case 'Fire':
      baseStats.strength += 3;
      baseStats.charisma += 2;
      baseStats.magic += 1;
      break;
    case 'Earth':
      baseStats.constitution += 3;
      baseStats.strength += 1;
      baseStats.wisdom += 2;
      break;
    case 'Air':
      baseStats.intelligence += 3;
      baseStats.dexterity += 2;
      baseStats.charisma += 1;
      break;
    case 'Water':
      baseStats.wisdom += 3;
      baseStats.magic += 2;
      baseStats.intelligence += 1;
      break;
  }
  
  // Adjust stats based on chinese zodiac
  switch (chineseZodiac.sign) {
    case 'Rat':
      baseStats.intelligence += 2;
      baseStats.dexterity += 1;
      break;
    case 'Ox':
      baseStats.strength += 2;
      baseStats.constitution += 1;
      break;
    case 'Tiger':
      baseStats.strength += 1;
      baseStats.dexterity += 2;
      break;
    case 'Rabbit':
      baseStats.dexterity += 2;
      baseStats.luck += 1;
      break;
    case 'Dragon':
      baseStats.magic += 2;
      baseStats.charisma += 1;
      break;
    case 'Snake':
      baseStats.wisdom += 2;
      baseStats.intelligence += 1;
      break;
    case 'Horse':
      baseStats.dexterity += 2;
      baseStats.strength += 1;
      break;
    case 'Goat':
      baseStats.charisma += 2;
      baseStats.wisdom += 1;
      break;
    case 'Monkey':
      baseStats.dexterity += 2;
      baseStats.intelligence += 1;
      break;
    case 'Rooster':
      baseStats.charisma += 2;
      baseStats.intelligence += 1;
      break;
    case 'Dog':
      baseStats.constitution += 2;
      baseStats.wisdom += 1;
      break;
    case 'Pig':
      baseStats.luck += 2;
      baseStats.constitution += 1;
      break;
  }
  
  // Add small random variation
  Object.keys(baseStats).forEach(stat => {
    const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    baseStats[stat] += variation;
  });
  
  // Find highest and lowest stats for narrative
  let highestStat = { name: '', value: 0 };
  let lowestStat = { name: '', value: 100 };
  
  Object.entries(baseStats).forEach(([name, value]) => {
    if (value > highestStat.value) {
      highestStat = { name, value };
    }
    if (value < lowestStat.value) {
      lowestStat = { name, value };
    }
  });
  
  return {
    stats: baseStats,
    highestStat,
    lowestStat
  };
}

// Generate a hero backstory based on zodiac info
export async function generateBackstory(heroName, westernZodiac, chineseZodiac) {
  // In a real implementation, this would call the OpenAI API
  console.log(`Generating backstory for ${heroName}...`);
  
  // Get some random traits to incorporate
  const westernTraits = getRandomItems(westernZodiac.traits, 2);
  const chineseTraits = getRandomItems(chineseZodiac.traits, 2);
  
  // Generate character stats
  const characterStats = generateCharacterStats(westernZodiac, chineseZodiac);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Format stats for display
  const statsDisplay = Object.entries(characterStats.stats)
    .map(([stat, value]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)}: ${value}`)
    .join('\n');
  
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

## Character Attributes

${heroName} possesses exceptional ${characterStats.highestStat.name}, reflecting their zodiac influences. However, their ${characterStats.lowestStat.name} requires more development on their heroic journey.

### Stats
${statsDisplay}

These abilities shape ${heroName}'s approach to challenges, with their ${westernZodiac.element}-influenced powers manifesting most strongly through their ${characterStats.highestStat.name}.
  `;
  
  return await generateExpandedBackstory(backstory);
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