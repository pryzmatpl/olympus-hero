/**
 * Simple utility to apply basic formatting to markdown text
 * Converts markdown headers, paragraphs, and line breaks to HTML elements
 * This is a simplified version that handles the most common markdown elements
 * without requiring a full markdown parser
 */
export const formatMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Replace headers (##, ###)
  let formatted = text
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  
  // Replace paragraphs (double line breaks)
  formatted = formatted.replace(/\n\s*\n/g, '</p><p>');
  
  // Wrap in paragraph tags if not already
  if (!formatted.startsWith('<h') && !formatted.startsWith('<p>')) {
    formatted = '<p>' + formatted;
  }
  if (!formatted.endsWith('</p>') && !formatted.endsWith('</h2>') && !formatted.endsWith('</h3>') && !formatted.endsWith('</h4>')) {
    formatted = formatted + '</p>';
  }
  
  // Replace single line breaks with <br> tags
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}; 