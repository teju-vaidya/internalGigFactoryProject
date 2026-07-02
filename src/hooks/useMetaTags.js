import { useEffect } from 'react';

/**
 * Hook to dynamically update document metadata and structured JSON-LD data.
 * Useful for SEO and GEO (Generative Engine Optimization / LLM crawler indexing).
 * 
 * @param {Object} seoConfig Configuration options
 * @param {string} seoConfig.title Document title
 * @param {string} seoConfig.description Page description
 * @param {string} seoConfig.keywords Page keywords comma-separated
 * @param {string} seoConfig.ogTitle Open Graph title (defaults to title)
 * @param {string} seoConfig.ogDescription Open Graph description (defaults to description)
 * @param {string} seoConfig.ogImage Open Graph preview image
 * @param {string} seoConfig.ogUrl Open Graph canonical URL
 * @param {string} seoConfig.canonicalUrl Canonical link tag URL
 * @param {string} seoConfig.robots Indexation rules (e.g., 'noindex, follow')
 * @param {Object} seoConfig.jsonLd Structured schema object to serialize as application/ld+json
 */
export function useMetaTags({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  canonicalUrl,
  robots,
  jsonLd,
} = {}) {
  useEffect(() => {
    // 1. Title
    if (title) {
      document.title = title.includes('GigFactory') ? title : `${title} | GigFactory`;
    }

    // Helper to create or update meta tags
    const updateMeta = (name, value, property = false) => {
      if (value === undefined || value === null) return;
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // 2. Standard Metadata
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('robots', robots || 'index, follow');

    // 3. Open Graph Metadata
    updateMeta('og:title', ogTitle || title, true);
    updateMeta('og:description', ogDescription || description, true);
    updateMeta('og:image', ogImage || '/favicon.png', true);
    updateMeta('og:url', ogUrl || window.location.href, true);
    updateMeta('og:type', 'website', true);

    // 4. Twitter Card Metadata
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', ogTitle || title);
    updateMeta('twitter:description', ogDescription || description);
    updateMeta('twitter:image', ogImage || '/favicon.png');

    // 5. Canonical Link
    const canonUrl = canonicalUrl || ogUrl || window.location.href;
    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', canonUrl);

    // 6. JSON-LD Structured Data
    let scriptEl = document.getElementById('json-ld-schema');
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'json-ld-schema';
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else {
      if (scriptEl) {
        scriptEl.remove();
      }
    }

    return () => {
      // Clean up dynamic schema element on component unmount
      const el = document.getElementById('json-ld-schema');
      if (el) el.remove();
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, canonicalUrl, robots, jsonLd]);
}
