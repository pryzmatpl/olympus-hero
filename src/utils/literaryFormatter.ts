/**
 * Literary Formatter
 * 
 * This utility transforms raw AI-generated text into beautifully formatted,
 * book-like narratives for display on mythicalhero.me
 */

import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Format text into a literary, book-like narrative with proper structure
 * @param text Raw text from AI generation
 * @returns Formatted HTML with proper literary styling
 */
export const formatLiteraryText = (text: string): string => {
  if (!text) return '';
  
  try {
    // Pre-process the text to add literary formatting
    let processedText = enhanceTextStructure(text);
    
    // Convert to HTML using marked
    const rawHtml = marked.parse(processedText);
    
    // Sanitize the HTML
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 
        'blockquote', 'code', 'pre', 'strong', 'em', 'del', 'br', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'section'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'class'
      ]
    });
    
    // Add book-like wrappers and structure
    return addLiteraryStructure(cleanHtml);
  } catch (error) {
    console.error('Error formatting literary text:', error);
    return `<p>${text}</p>`;
  }
};

/**
 * Enhance the text structure before markdown conversion
 * @param text Raw AI-generated text
 * @returns Enhanced text with proper structure
 */
const enhanceTextStructure = (text: string): string => {
  // Remove AI-generation artifacts
  let enhancedText = text
    .replace(/^(As an AI language model|I'd be happy to|Sure!|Here's|Let me).*?\n/i, '')
    .replace(/^Rendered for MythicalHero\.me\s*/i, '');
  
  // Make sure chapter headings are properly formatted
  enhancedText = enhancedText.replace(
    /^(Chapter \w+:?.*)$/im,
    '## $1'
  );
  
  // Ensure scene breaks use consistent formatting
  enhancedText = enhancedText
    .replace(/^\s*\*\*\*\s*$/gm, '\n\n---\n\n')
    .replace(/^\s*[~\-]{3,}\s*$/gm, '\n\n---\n\n');
  
  // Add proper emphasis for important phrases
  enhancedText = enhancedText
    .replace(/\b([A-Z]{2,})\b/g, '**$1**'); // Capitalize important words
  
  return enhancedText;
};

/**
 * Add literary structure to HTML content
 * @param html Clean HTML content
 * @returns HTML with literary structure
 */
const addLiteraryStructure = (html: string): string => {
  // Wrap chapters in section tags if they're not already
  let structuredHtml = html.replace(
    /<h2>(Chapter .+?)<\/h2>/g,
    '<section class="chapter"><h2>$1</h2>'
  );
  
  // Close any open sections at the end
  if (structuredHtml.includes('<section class="chapter">') && 
      !structuredHtml.includes('</section>')) {
    structuredHtml += '</section>';
  }
  
  // Add semantic classes for literary styling
  structuredHtml = structuredHtml
    .replace(/<p>/g, '<p class="literary-paragraph">')
    .replace(/<hr>/g, '<hr class="scene-break">');
  
  return structuredHtml;
};

/**
 * Format a backstory with literary styling
 * @param text Raw backstory text
 * @returns Formatted HTML with literary styling
 */
export const formatLiteraryBackstory = (text: string): string => {
  if (!text) return '';
  
  // Add a title if none exists
  let processedText = text;
  if (!text.trim().startsWith('#')) {
    processedText = `## Origin Story\n\n${text}`;
  }
  
  return formatLiteraryText(processedText);
};

/**
 * Format a chapter with literary styling
 * @param text Raw chapter text
 * @param chapterNumber The chapter number
 * @returns Formatted HTML with literary styling
 */
export const formatLiteraryChapter = (text: string, chapterNumber: number): string => {
  if (!text) return '';
  
  // If no chapter title is found, add a generic one
  let processedText = text;
  if (!text.trim().match(/^#+\s*Chapter/i)) {
    processedText = `## Chapter ${chapterNumber}: The Journey Continues\n\n${text}`;
  }
  
  return formatLiteraryText(processedText);
};

/**
 * Format shared story content for better readability
 * @param text Raw shared story text
 * @returns Formatted HTML with literary styling
 */
export const formatLiterarySharedStory = (text: string): string => {
  if (!text) return '';
  
  // Add a thematic wrapper to distinguish narrator content
  let processedText = text;
  
  // Process scene breaks and dialogue more carefully
  processedText = processedText
    // Format dialogue more distinctly
    .replace(/^"(.+?)"$/gm, '> "$1"')
    // Ensure proper paragraph breaks
    .replace(/\n{3,}/g, '\n\n');
  
  return formatLiteraryText(processedText);
}; 