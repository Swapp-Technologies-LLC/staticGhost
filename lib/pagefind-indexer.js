const fs = require('fs');
const path = require('path');

class PagefindIndexer {
  static createSearchIndex(outputDir, posts) {
    const searchDir = path.join(outputDir, 'search');
    if (!fs.existsSync(searchDir)) {
      fs.mkdirSync(searchDir, { recursive: true });
    }

    const indexData = posts.map(p => ({
      id: p.slug,
      title: p.title,
      url: `./${p.slug}.html`,
      excerpt: p.excerpt || p.title,
      tags: p.tags ? p.tags.map(t => t.name).join(', ') : ''
    }));

    const searchIndexJs = `
window.SEARCH_INDEX = ${JSON.stringify(indexData, null, 2)};

function performSearch(query) {
  if (!query || query.trim() === '') return [];
  const q = query.toLowerCase();
  return window.SEARCH_INDEX.filter(item => 
    item.title.toLowerCase().includes(q) || 
    item.excerpt.toLowerCase().includes(q) ||
    item.tags.toLowerCase().includes(q)
  );
}
`;

    fs.writeFileSync(path.join(searchDir, 'search-index.js'), searchIndexJs, 'utf8');
    return true;
  }
}

module.exports = PagefindIndexer;
