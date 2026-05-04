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
export const formatLiteraryText = (
  text: string,
  options?: { chapter?: boolean }
): string => {
  if (!text) return '';
  
  try {
    let processedText = enhanceTextStructure(text, options);
    
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
const enhanceTextStructure = (
  text: string,
  options?: { chapter?: boolean }
): string => {
  let enhancedText = text
    .replace(/^(As an AI language model|I'd be happy to|Sure!|Here's|Let me).*?\n/i, '')
    .replace(/^Rendered for MythicalHero\.me\s*/i, '');

  enhancedText = enhancedText.replace(
    /^(Chapter \w+:?.*)$/im,
    '## $1'
  );

  enhancedText = enhancedText
    .replace(/^\s*\*\*\*\s*$/gm, '\n\n---\n\n')
    .replace(/^\s*[~\-]{3,}\s*$/gm, '\n\n---\n\n');

  // Chapter prose: avoid bolding every ALL-CAPS token — hurts book-like typography
  if (!options?.chapter) {
    enhancedText = enhancedText.replace(/\b([A-Z]{2,})\b/g, '**$1**');
  }

  return enhancedText;
};

/** Split very long blocks (single paragraph walls) into readable book paragraphs */
function splitDenseProseIntoParagraphs(markdown: string): string {
  return markdown
    .split(/\n\n+/)
    .map((para) => {
      const p = para.trim();
      if (!p || p.startsWith('#') || p.startsWith('>') || /^[-*]\s/.test(p)) {
        return para;
      }
      if (p.length < 480) {
        return para;
      }
      const oneLine = p.replace(/\s+/g, ' ');
      const sentences = oneLine
        .split(/(?<=[.!?]"?)\s+(?=[A-Z"'(])/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length <= 4) {
        return para;
      }
      const chunks: string[] = [];
      const chunkSize = 4;
      for (let i = 0; i < sentences.length; i += chunkSize) {
        chunks.push(sentences.slice(i, i + chunkSize).join(' '));
      }
      return chunks.join('\n\n');
    })
    .join('\n\n');
}

/** Remove duplicate fallback title when the model already supplied a chapter heading */
function dedupeLegacyChapterTitles(text: string, chapterNumber: number): string {
  let trimmed = text.trim();

  const plainDouble = new RegExp(
    `^Chapter\\s*${chapterNumber}:\\s*The Journey Continues\\s*\\n+(?=Chapter\\s+[IVXLCDM])`,
    'i'
  );
  if (plainDouble.test(trimmed)) {
    trimmed = trimmed.replace(plainDouble, '').trim();
  }

  const genericMd = new RegExp(
    `^##\\s*Chapter\\s*${chapterNumber}:\\s*The Journey Continues\\s*\\n+`,
    'i'
  );
  if (!genericMd.test(trimmed)) {
    return trimmed;
  }
  const without = trimmed.replace(genericMd, '').trim();
  const nextFirst = without.split('\n').find((l) => l.trim())?.trim() ?? '';
  if (/^Chapter\s+[IVXLCDM]+/i.test(nextFirst) || /^Chapter\s*\d+/i.test(nextFirst)) {
    return without;
  }
  return trimmed;
}

/**
 * Add literary structure to HTML content
 * @param html Clean HTML content
 * @returns HTML with literary structure
 */
const addLiteraryStructure = (html: string): string => {
  // Wrap chapter headings (handles marked-generated attributes on h2)
  let structuredHtml = html.replace(
    /<h2([^>]*)>([\s\S]*?Chapter[\s\S]*?)<\/h2>/gi,
    '<section class="chapter"><h2$1>$2</h2>'
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
  
  return formatLiteraryText(processedText, {});
};

/**
 * Format a chapter with literary styling
 * @param text Raw chapter text
 * @param chapterNumber The chapter number
 * @returns Formatted HTML with literary styling
 */
export const formatLiteraryChapter = (text: string, chapterNumber: number): string => {
  if (!text) return '';

  let processedText = dedupeLegacyChapterTitles(text, chapterNumber);

  const hasMdHeading = /^#+\s*Chapter/i.test(processedText);
  const firstLine =
    processedText.split('\n').find((l) => l.trim())?.trim() ?? '';

  if (!hasMdHeading) {
    if (/^Chapter\s+[IVXLCDM\d]/i.test(firstLine)) {
      const rest = processedText
        .slice(processedText.indexOf(firstLine) + firstLine.length)
        .trim();
      processedText = `## ${firstLine}\n\n${rest}`;
    } else {
      processedText = `## Chapter ${chapterNumber}: The Journey Continues\n\n${processedText}`;
    }
  }

  processedText = splitDenseProseIntoParagraphs(processedText);

  return formatLiteraryText(processedText, { chapter: true });
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
  
  return formatLiteraryText(processedText, {});
}; 