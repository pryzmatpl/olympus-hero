import { OpenAI } from 'openai';
import { downloadImage } from './utils.js';

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// Global flag to track OpenAI quota status
let isOpenAIQuotaExceeded = false;
let quotaExceededTimestamp = null;
const QUOTA_EXCEEDED_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Helper function to get random items from an array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Check if an error is an OpenAI quota exceeded error
 * @param {Error} error - The error object to check
 * @returns {boolean} - True if it's a quota exceeded error
 */
export function isOpenAIQuotaError(error) {
  return (
    error?.status === 429 && 
    (error?.code === 'insufficient_quota' || 
     error?.error?.code === 'insufficient_quota' ||
     error?.message?.includes('exceeded your current quota') ||
     error?.error?.message?.includes('exceeded your current quota'))
  );
}

/**
 * Set the OpenAI quota exceeded flag
 * @param {boolean} value - Whether the quota is exceeded
 */
export function setOpenAIQuotaExceeded(value) {
  isOpenAIQuotaExceeded = value;
  quotaExceededTimestamp = value ? Date.now() : null;
  console.log(`OpenAI quota exceeded flag set to: ${value} at ${new Date().toISOString()}`);
}

/**
 * Check if the OpenAI quota is currently exceeded
 * @returns {boolean} - True if the quota is exceeded
 */
export function checkOpenAIQuotaExceeded() {
  // If the flag is set but enough time has passed, reset it
  if (isOpenAIQuotaExceeded && quotaExceededTimestamp) {
    const timeSinceExceeded = Date.now() - quotaExceededTimestamp;
    if (timeSinceExceeded > QUOTA_EXCEEDED_DURATION) {
      setOpenAIQuotaExceeded(false);
      return false;
    }
  }
  
  return isOpenAIQuotaExceeded;
}

/**
 * Generate a chat completion with OpenAI
 * @param {Array} messages - Array of message objects with role and content
 * @returns {Promise<string>} - The generated response text
 */
export async function generateChatCompletionWithOpenAI(messages) {
  // First check if quota is exceeded
  if (checkOpenAIQuotaExceeded()) {
    const error = new Error("OpenAI API quota exceeded. Please try again later or contact support.");
    error.isQuotaExceededError = true;
    error.userFriendlyMessage = "OpenAI API quota exceeded. Please try again later or contact support.";
    error.status = 429;
    error.code = 'insufficient_quota';
    throw error;
  }

  try {
    console.log('Generating chat completion with OpenAI...');
    
    // Get API key from environment variable
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.8,
      max_tokens: 1000
    });
    
    // Extract and return the response text
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat completion:', error);
    
    // Check if this is a quota exceeded error
    if (isOpenAIQuotaError(error)) {
      // Set the global flag when a quota error occurs
      setOpenAIQuotaExceeded(true);
      
      // Enhance the error with a custom property to identify it later
      error.isQuotaExceededError = true;
      error.userFriendlyMessage = "OpenAI API quota exceeded. Please try again later or contact support."
    }
    
    throw error;
  }
}

export async function generateExpandedBackstory(backstory) {
  // OpenAI API endpoint for chat completions
  const apiUrl = 'https://api.openai.com/v1/chat/completions';

  // Get API key from environment variable or configuration
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    throw new Error('OpenAI API key is not configured');
  }

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
export async function generateOpenAIImages(heroName, westernZodiac, chineseZodiac, viewAngle, heroId) {
  console.log(`Generating ${viewAngle} view image for ${heroName} (heroId: ${heroId})...`);

  const prompt = generateImagePrompt(heroName, westernZodiac, chineseZodiac, viewAngle);
  console.log(`Generated prompt for ${viewAngle}: ${prompt.substring(0, 100)}...`);

  try {
    console.log(`Requesting image from OpenAI for ${heroName}, ${viewAngle}`);
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      n: 1,
    });

    console.log(`Received response from OpenAI for ${heroName}, ${viewAngle}`);
    const imageUrl = response.data[0].url;
    console.log(`Image URL for ${heroName} (${viewAngle}): ${imageUrl.substring(0, 50)}...`);
    
    // Download and store the image locally
    let localImagePath;
    try {
      console.log(`Downloading image for ${heroName} (${viewAngle}) to local storage...`);
      localImagePath = await downloadImage(imageUrl, heroId, viewAngle);
      console.log(`Image for ${heroName} (${viewAngle}) saved locally at: ${localImagePath}`);
    } catch (downloadError) {
      console.error(`Error downloading image for ${heroName} (${viewAngle}): ${downloadError.message}`);
      // If download fails, we'll use the original OpenAI URL
      localImagePath = null;
    }

    return {
      angle: viewAngle,
      url: localImagePath || imageUrl, // Use local path if available, otherwise use OpenAI URL
      originalUrl: imageUrl, // Store the original URL as a backup
      prompt: prompt,
    };
  } catch (error) {
    console.error(`Error generating image for ${heroName} (${viewAngle}):`, error);
    console.error(`Failed prompt: ${prompt.substring(0, 100)}...`);
    
    // Create a placeholder path that will be handled by the client
    const placeholderPath = `/storage/images/${heroId}/${viewAngle}.png`;
    
    // Try to create a placeholder file
    try {
      await downloadImage('placeholder', heroId, viewAngle);
      console.log(`Created placeholder image for failed generation: ${placeholderPath}`);
    } catch (placeholderError) {
      console.error(`Error creating placeholder: ${placeholderError.message}`);
    }
    
    // Return an object with the placeholder and error information
    return {
      angle: viewAngle,
      url: placeholderPath,
      error: error.message,
      prompt: prompt,
    };
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

/**
 * Generate a chapter for a hero's storybook
 * @param {string} heroName - The name of the hero
 * @param {object} heroData - Hero data including zodiac info and backstory
 * @param {string} userPrompt - The user's original prompt/intent for the hero
 * @param {number} chapterNumber - The chapter number to generate
 * @param {string|null} previousChapterSummary - Summary of the previous chapter, if any
 * @returns {string} - The generated chapter content
 */
export async function generateChapter(heroName, heroData, userPrompt, chapterNumber, previousChapterSummary = null) {
  console.log(`Generating chapter ${chapterNumber} for ${heroName}...`);
  
  // Create a prompt for the chapter generation
  let chapterPrompt = '';
  
  if (chapterNumber === 1) {
    // First chapter prompt - uses backstory and zodiac info
    chapterPrompt = `
You are writing chapter 1 of an epic fantasy story about a cosmic hero named ${heroName}. 
This is the beginning of their adventure based on the following backstory:

${heroData.backstory}

The hero has the following zodiac traits:
- Western Zodiac: ${heroData.westernZodiac.sign} (${heroData.westernZodiac.element})
- Strengths: ${heroData.westernZodiac.strengths.join(', ')}
- Weaknesses: ${heroData.westernZodiac.weaknesses.join(', ')}
- Chinese Zodiac: ${heroData.chineseZodiac.sign} (${heroData.chineseZodiac.element})
- Traits: ${heroData.chineseZodiac.traits.join(', ')}

Write an engaging first chapter (800-1200 words) that introduces the hero and sets up an overarching cosmic conflict that will span multiple chapters. 
Assure that the chapters follow pretty formatting so that the stories are easy to read.
The chapter should establish their personality, showcase some of their abilities, and end with a compelling hook for chapter 2.
    `;
  } else {
    // Subsequent chapter prompt - uses previous chapter summary for continuity
    chapterPrompt = `
You are writing chapter ${chapterNumber} in an ongoing epic fantasy story about a cosmic hero named ${heroName}.

Hero backstory summary:
${heroData.backstory.substring(0, 300)}...

Previous chapter summary:
${previousChapterSummary || "The hero began their cosmic journey."}

Write an engaging chapter (800-1200 words) that continues the hero's adventure. This chapter should:
1. Build on events from the previous chapter
2. Introduce new challenges or developments
3. Showcase the hero using their abilities
4. End with a compelling hook for the next chapter

Remember that this is chapter ${chapterNumber} out of a planned multi-chapter story arc, so pace the narrative appropriately.
    `;
  }
  
  try {
    // Call OpenAI to generate the chapter
    const response = await generateChatCompletionWithOpenAI([
      { role: 'system', content: chapterPrompt },
      { role: 'user', content: userPrompt || "Tell an epic cosmic adventure story for this hero." }
    ]);
    
    // Extract chapter summary for next chapter generation (approximately 100 words)
    const chapterSummary = await generateChapterSummary(response);
    
    return {
      content: response,
      summary: chapterSummary
    };
  } catch (error) {
    console.error(`Error generating chapter ${chapterNumber} for ${heroName}:`, error);
    throw error;
  }
}

/**
 * Generate a summary of a chapter for use in generating the next chapter
 * @param {string} chapterContent - The full chapter content
 * @returns {string} - A summary of the chapter
 */
async function generateChapterSummary(chapterContent) {
  try {
    const response = await generateChatCompletionWithOpenAI([
      { 
        role: 'system', 
        content: 'Summarize the following chapter in about 100 words, focusing on key plot events and character developments that would be relevant for continuing the story in the next chapter.' 
      },
      { role: 'user', content: chapterContent }
    ]);
    
    return response;
  } catch (error) {
    console.error('Error generating chapter summary:', error);
    return chapterContent.substring(0, 200) + '...'; // Fallback to a simple truncation
  }
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
      colorPalette = 'mystical purples, cosmic blues, and starlight accents, chaotic and vibrant';
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
    Mythical cosmic hero named "${heroName}", with gender traits discerned by name,
    a powerful character with ${westernZodiac.sign} and ${chineseZodiac.sign} zodiac influences.
    ${westernTraits.join(', ')} personality, combined with ${chineseTraits.join(', ')} traits.
    ${viewDescription}.
    Costume featuring ${colorPalette} color scheme with ${animalInfluence}.
    Ethereal cosmic background with zodiac constellations.
    Digital art, highly detailed, professional character design, 4K, cinematic lighting.
  `.trim().replace(/\s+/g, ' ');
  
  return prompt;
}