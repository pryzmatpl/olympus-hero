import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Format markdown string to safe HTML
 * @param text Markdown text to format
 * @returns Sanitized HTML string
 */
export const formatMarkdown = (text: string): string => {
  if (!text) return '';
  
  try {
    // Convert markdown to HTML
    const rawHtml = marked.parse(text);
    
    // Sanitize the HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 
        'blockquote', 'code', 'pre', 'strong', 'em', 'del', 'br', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'class'
      ]
    });
    
    return cleanHtml;
  } catch (error) {
    console.error('Error formatting markdown:', error);
    return `<p>${text}</p>`;
  }
}; 