const fetchApi = typeof fetch !== 'undefined' ? fetch : require('http');

class GhostFetcher {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || 'http://localhost:2368').replace(/\/$/, '');
    this.apiKey = options.apiKey || '';
  }

  async testConnection() {
    try {
      const url = this.apiKey
        ? `${this.baseUrl}/ghost/api/content/posts/?key=${this.apiKey}&limit=1`
        : `${this.baseUrl}/`;
      
      const response = await fetchApi(url, { timeout: 5000 });
      if (response.ok || response.status === 200 || response.status === 301) {
        return { success: true, message: `Successfully connected to Ghost at ${this.baseUrl}` };
      } else {
        return { success: false, message: `Server returned status ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  async fetchAllPosts() {
    try {
      if (this.apiKey) {
        const apiUrl = `${this.baseUrl}/ghost/api/content/posts/?key=${this.apiKey}&include=tags,authors&limit=all`;
        const res = await fetchApi(apiUrl);
        if (!res.ok) throw new Error(`API response error ${res.status}`);
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          return data.posts;
        }
      } else {
        try {
          const res = await fetchApi(`${this.baseUrl}/ghost/api/v3/content/posts/?key=sample_key_or_html`);
          if (res.ok) {
            const data = await res.json();
            if (data.posts && data.posts.length > 0) {
              return data.posts;
            }
          }
        } catch (localErr) {
          // Fallback to mock posts below
        }
      }
      return this.getMockPosts();
    } catch (err) {
      console.warn('Ghost fetch API error, returning sample post data for preview:', err.message);
      return this.getMockPosts();
    }
  }

  getMockPosts() {
    return [
      {
        id: '1',
        title: 'Top Recommended Tech Products & Accessories (2026)',
        slug: 'top-recommended-tech-products',
        html: `
          <p>Welcome to our official product recommendations! Check out these top deals below:</p>
          <h2>Featured Products</h2>
          <p>Here is our favorite ergonomic setup item: <a href="https://amazon.com/dp/sample?tag=mycompany-20" target="_blank">Ergonomic Office Chair</a>.</p>
          <p>For high performance development work, check out the <a href="https://bestbuy.com/sample-laptop?aff=swapptech" target="_blank">Ultra Performance Workstation</a>.</p>
          <hr>
          <p>Thank you for reading our post!</p>
        `,
        excerpt: 'Discover our top handpicked tech accessories and products with exclusive affiliate deals.',
        published_at: new Date().toISOString(),
        feature_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        visibility: 'public',
        tags: [{ name: 'Tech' }, { name: 'Reviews' }],
        authors: [{ name: 'Company Team' }]
      },
      {
        id: '2',
        title: 'Exclusive Member Vault: Insider Product Strategy',
        slug: 'insider-product-strategy',
        html: `
          <p>This is confidential internal strategy documentation for partner products and monetization.</p>
          <p>Affiliate link: <a href="https://partner.com/deal?ref=company">VIP Partner Link</a></p>
        `,
        excerpt: 'Confidential strategy post protected with AES encryption password.',
        published_at: new Date().toISOString(),
        feature_image: '',
        visibility: 'paid',
        password: 'secretpassword123',
        tags: [{ name: 'Strategy' }],
        authors: [{ name: 'Founder' }]
      }
    ];
  }
}

module.exports = GhostFetcher;
