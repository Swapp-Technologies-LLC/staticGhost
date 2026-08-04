
window.SEARCH_INDEX = [
  {
    "id": "top-recommended-tech-products",
    "title": "Top Recommended Tech Products & Accessories (2026)",
    "url": "./top-recommended-tech-products.html",
    "excerpt": "Discover our top handpicked tech accessories and products with exclusive affiliate deals.",
    "tags": "Tech, Reviews"
  },
  {
    "id": "insider-product-strategy",
    "title": "Exclusive Member Vault: Insider Product Strategy",
    "url": "./insider-product-strategy.html",
    "excerpt": "Confidential strategy post protected with AES encryption password.",
    "tags": "Strategy"
  }
];

function performSearch(query) {
  if (!query || query.trim() === '') return [];
  const q = query.toLowerCase();
  return window.SEARCH_INDEX.filter(item => 
    item.title.toLowerCase().includes(q) || 
    item.excerpt.toLowerCase().includes(q) ||
    item.tags.toLowerCase().includes(q)
  );
}
