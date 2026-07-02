/**
 * Strips HTML tags and decodes common HTML entities (e.g. &nbsp;)
 * to provide a clean plain-text preview of rich text content.
 * 
 * @param {string} html Raw HTML content
 * @returns {string} Clean plain text
 */
export function stripHtml(html) {
  if (!html) return '';
  
  // 1. Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');
  
  // 2. Decode common HTML entities
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&ndash;': '–',
    '&mdash;': '—'
  };
  
  text = text.replace(/&[a-z0-9#]+;/gi, (match) => {
    const lower = match.toLowerCase();
    return entities[lower] || match;
  });
  
  return text.trim();
}
