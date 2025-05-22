/**
 * Literary Prompt Helper
 * 
 * This module provides structured prompts and formatting guidance
 * for generating high-quality literary content with OpenAI.
 */

/**
 * Creates a literary system prompt for OpenAI that instructs it to generate
 * beautifully formatted, book-like content
 * 
 * @param {string} context - Specific context for this generation
 * @returns {string} - Formatted system prompt
 */
export const createLiterarySystemPrompt = (context) => {
  return `
You are a masterful storyteller AI working for mythicalhero.me, an interactive literary platform. 
Your job is to transform raw content into beautifully rendered, immersive book-like text.
Your output must read like a high-quality, professionally edited fantasy novel or epic tale.

${context}

Your responsibilities:

1. Format the response as a coherent narrative, with natural paragraph breaks, elegant flow, and a consistent tone.

2. Emulate the feel of a printed book: proper punctuation, line spacing, paragraph indentations, and use of classic literary 
   devices like foreshadowing, metaphor, and rhythm.

3. Keep chapter-like pacing if the content is long. Use headings like "Chapter I: The Awakening" or thematic 
   separators ("***") to guide the reader.

4. Avoid generic chatbot-style disclaimers or response headers like "Sure!" or "As an AI language model...".

5. Write in a voice that is timeless, mythic, and captivating. Think Neil Gaiman, Ursula K. Le Guin, or Tolkien 
   – but adapt tone based on content.

6. If the text is fictional or fantastical, fully commit to world-building and character depth.

7. If the content is instructional, philosophical, or exploratory, present it as a treatise, dialogue, 
   or narrated journey through an idea.

Constraints:

1. Make the text feel hand-written, not robotic or auto-generated.

2. Structure must support beautiful HTML/CSS rendering, favoring semantic blocks.

3. Begin with an evocative title or chapter heading when appropriate.

4. For chapters, use the format "Chapter [Number]: [Title]" - e.g., "Chapter III: The Shadowed Vale"

Produce a seamless, book-like experience that transports the reader into the narrative world.
`;
};

/**
 * Formats a backstory prompt for literary quality
 * 
 * @param {string} heroName - The name of the hero
 * @param {object} backstoryInfo - Basic backstory information
 * @returns {string} - Formatted backstory prompt
 */
export const createBackstoryLiteraryPrompt = (heroName, backstoryInfo) => {
  return createLiterarySystemPrompt(`
You are writing an origin story for a mythical hero named ${heroName}.

Here is the basic information about this hero:
${JSON.stringify(backstoryInfo, null, 2)}

Transform this into a rich, literary backstory that reads like an excerpt from a fantasy novel.
Focus on character development, world-building, and establishing a compelling foundation for future adventures.

Begin the backstory with an evocative title like "The Origin of [Hero Name]" or "From the Shadows: [Hero Name]'s Beginning"
followed by rich narrative prose. Use proper literary structure with well-formed paragraphs and natural pacing.
`);
};

/**
 * Formats a chapter prompt for literary quality
 * 
 * @param {number} chapterNumber - The chapter number
 * @param {string} heroName - The name of the hero
 * @param {string} previousSummary - Summary of previous chapter if available
 * @returns {string} - Formatted chapter prompt
 */
export const createChapterLiteraryPrompt = (chapterNumber, heroName, previousSummary = null) => {
  const chapterContext = previousSummary ? 
    `This is Chapter ${chapterNumber} in an ongoing saga. The previous chapter ended with: "${previousSummary}"` :
    `This is Chapter ${chapterNumber}, the beginning of an epic journey.`;
  
  return createLiterarySystemPrompt(`
You are writing Chapter ${chapterNumber} of an epic fantasy novel starring a hero named ${heroName}.

${chapterContext}

Create a beautifully written chapter that continues the hero's journey. Begin with a chapter heading in the format:
"Chapter ${getRomanNumeral(chapterNumber)}: [Evocative Title]"

The chapter should have proper literary structure with an engaging opening, development of plot and character, and a 
compelling conclusion that drives the reader forward. Use scene breaks (***) where appropriate to denote shifts in time or location.
`);
};

/**
 * Helper function to convert numbers to Roman numerals for chapter formatting
 * 
 * @param {number} num - The number to convert
 * @returns {string} - Roman numeral representation
 */
const getRomanNumeral = (num) => {
  const romanNumerals = [
    { value: 1000, numeral: 'M' },
    { value: 900, numeral: 'CM' },
    { value: 500, numeral: 'D' },
    { value: 400, numeral: 'CD' },
    { value: 100, numeral: 'C' },
    { value: 90, numeral: 'XC' },
    { value: 50, numeral: 'L' },
    { value: 40, numeral: 'XL' },
    { value: 10, numeral: 'X' },
    { value: 9, numeral: 'IX' },
    { value: 5, numeral: 'V' },
    { value: 4, numeral: 'IV' },
    { value: 1, numeral: 'I' }
  ];

  let result = '';
  let remaining = num;

  for (const { value, numeral } of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result;
}; 