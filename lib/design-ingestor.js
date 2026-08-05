const CryptoHandler = require('./static-crypto-password');

class DesignIngestor {
  constructor(options = {}) {
    this.customLayoutHtml = options.customLayoutHtml || this.getDefaultLayout();
    this.customIndexLayoutHtml = options.customIndexLayoutHtml || options.customLayoutHtml || this.getDefaultLayout();
    this.customPostLayoutHtml = options.customPostLayoutHtml || options.customLayoutHtml || this.getDefaultLayout();
    this.siteTitle = options.siteTitle || 'Company Blog';
    this.siteUrl = (options.siteUrl || 'https://mycompany.github.io/blog').replace(/\/$/, '');
    this.analyticsScript = options.analyticsScript || '<!-- Cloudflare Web Analytics --><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token": "sample-token"}\'></script>';
    this.enableAffiliateAutoTag = options.enableAffiliateAutoTag !== false;
    this.affiliateDomains = options.affiliateDomains || ['amazon.com', 'amzn.to', 'bestbuy.com', 'shareasale.com', 'partnerstack.com', 'cj.com', 'impact.com'];
    this.giscusRepo = options.giscusRepo || '';
    this.enableFormRedirect = options.enableFormRedirect === true;
    this.formRedirectUrl = options.formRedirectUrl || '';
  }

  getDefaultLayout() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- GHOST_PAGE_TITLE --></title>
  <!-- GHOST_META_TAGS -->
  <style>
    :root {
      --primary-color: #6366f1;
      --bg-color: #0f172a;
      --card-bg: #1e293b;
      --text-color: #f8fafc;
      --text-muted: #94a3b8;
      --border-color: #334155;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    header {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 1rem 2rem;
    }
    .header-container {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .site-brand {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
    }
    nav a {
      color: var(--text-muted);
      text-decoration: none;
      margin-left: 1.5rem;
      transition: color 0.2s;
    }
    nav a:hover { color: #fff; }
    main {
      max-width: 850px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
    }
    .post-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.5rem;
      margin-bottom: 2rem;
    }
    .post-header { margin-bottom: 2rem; }
    .post-header h1 { font-size: 2.25rem; margin-top: 0.5rem; }
    .post-meta { color: var(--text-muted); font-size: 0.9rem; }
    .affiliate-badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid var(--primary-color);
      color: #818cf8;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      margin-bottom: 1rem;
    }
    footer {
      border-top: 1px solid var(--border-color);
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    a { color: #818cf8; }
    a[rel*="sponsored"] { font-weight: 600; text-decoration: underline; }
  </style>
</head>
<body>
  <header>
    <div class="header-container">
      <a href="./index.html" class="site-brand"><!-- GHOST_SITE_TITLE --></a>
      <nav>
        <a href="./index.html">Home</a>
        <a href="./rss.xml" target="_blank">RSS Feed</a>
      </nav>
    </div>
  </header>
  <main>
    <!-- GHOST_CONTENT -->
  </main>
  <footer>
    <p>&copy; 2026 <!-- GHOST_SITE_TITLE -->. Powered by Ghost Static Exporter.</p>
  </footer>
</body>
</html>`;
  }

  processPostToHtml(post, isIndex = false, customLayoutOverride = null) {
    let layoutHtml = isIndex ? this.customIndexLayoutHtml : (customLayoutOverride || this.customPostLayoutHtml);

    // 1. Post Title & Meta Tags
    const postTitle = post.title || 'Untitled Post';
    const metaTagsHtml = isIndex ? `
  <meta name="description" content="${this.escapeHtml(post.excerpt || postTitle)}">
  <meta property="og:title" content="${this.escapeHtml(postTitle)}">
  <meta property="og:description" content="${this.escapeHtml(post.excerpt || '')}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${this.siteUrl}/index.html">
  ${this.analyticsScript || ''}
` : `
  <meta name="description" content="${this.escapeHtml(post.excerpt || postTitle)}">
  <meta property="og:title" content="${this.escapeHtml(postTitle)}">
  <meta property="og:description" content="${this.escapeHtml(post.excerpt || '')}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${this.siteUrl}/${post.slug}.html">
  ${post.feature_image ? `<meta property="og:image" content="${post.feature_image}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  ${this.analyticsScript || ''}
`;

    // Inject Meta Tags into <head>
    if (layoutHtml.includes('<!-- GHOST_META_TAGS -->')) {
      layoutHtml = layoutHtml.replace('<!-- GHOST_META_TAGS -->', metaTagsHtml);
    } else if (layoutHtml.includes('</head>')) {
      layoutHtml = layoutHtml.replace('</head>', `${metaTagsHtml}\n</head>`);
    }

    let finalHtml = layoutHtml;
    finalHtml = finalHtml.replace(/<!-- GHOST_PAGE_TITLE -->/g, this.escapeHtml(postTitle));
    finalHtml = finalHtml.replace(/<!-- GHOST_SITE_TITLE -->/g, this.escapeHtml(this.siteTitle));

    if (isIndex) {
      finalHtml = finalHtml.replace(/<!-- GHOST_CONTENT -->/g, post.html || '');
    } else {
      // 2. Compute Reading Time
      const words = (post.html || '').replace(/<[^>]*>/g, '').split(/\s+/).length;
      const readingTimeMin = Math.max(1, Math.ceil(words / 225));

      // 3. Process Content & Affiliate Links
      let contentHtml = post.html || '';
      
      // Check Password Protection
      if (post.password || post.visibility === 'paid') {
        const crypto = new CryptoHandler();
        contentHtml = crypto.wrapEncryptedPost(contentHtml, post.password || 'secret');
      } else {
        if (this.enableAffiliateAutoTag) {
          contentHtml = this.tagAffiliateLinks(contentHtml);
        }
        if (this.enableFormRedirect && this.formRedirectUrl) {
          contentHtml = this.redirectFormActions(contentHtml);
        }
      }

      const postHeaderHtml = `
        <div class="post-header">
          <span class="affiliate-badge">📢 Sponsored / Affiliate Disclosure Included</span>
          <h1>${this.escapeHtml(postTitle)}</h1>
          <div class="post-meta">
            <span>By ${post.authors ? post.authors.map(a => a.name).join(', ') : 'Team'}</span> • 
            <span>${new Date(post.published_at || Date.now()).toLocaleDateString()}</span> • 
            <span>⏱️ ${readingTimeMin} min read</span>
          </div>
        </div>
      `;

      let commentsHtml = '';
      if (this.giscusRepo) {
        commentsHtml = `
          <div class="giscus-comments" style="margin-top:3rem;">
            <script src="https://giscus.app/client.js"
              data-repo="${this.giscusRepo}"
              data-repo-id="R_kgDOG"
              data-category="Announcements"
              data-mapping="pathname"
              data-strict="0"
              data-reactions-enabled="1"
              data-emit-metadata="0"
              data-input-position="bottom"
              data-theme="dark"
              data-lang="en"
              crossorigin="anonymous"
              async>
            </script>
          </div>
        `;
      }

      const staticSuiteFooter = `
        <footer class="static-suite-footer" style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #334155; font-size: 0.8rem; color: #94a3b8; text-align: center; line-height: 1.6; font-family: system-ui, -apple-system, sans-serif;">
          <div style="margin-bottom: 0.5rem;">
            Generated with help from <a href="https://swapp.solutions" target="_blank" style="color: #818cf8; text-decoration: none; font-weight: 600;">Swapp Technologies LLC</a>
          </div>
          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <a href="https://ghost.org/pricing/" target="_blank" style="color: #6366f1; text-decoration: none;">Donate to Ghost</a>
            <span style="color: #475569;">•</span>
            <a href="https://opencollective.com/electron" target="_blank" style="color: #6366f1; text-decoration: none;">Donate to Electron</a>
            <span style="color: #475569;">•</span>
            <a href="https://www.docker.com/" target="_blank" style="color: #6366f1; text-decoration: none;">Support Docker</a>
            <span style="color: #475569;">•</span>
            <a href="https://github.com/Swapp-Technologies-LLC/staticGhost#readme" target="_blank" style="color: #6366f1; text-decoration: none;">How to Build Your Own (Guide)</a>
          </div>
        </footer>
      `;

      const fullArticleHtml = `
        <article class="post-card">
          ${postHeaderHtml}
          <div class="post-body">
            ${contentHtml}
          </div>
          ${commentsHtml}
          ${staticSuiteFooter}
        </article>
      `;

      finalHtml = finalHtml.replace(/<!-- GHOST_CONTENT -->/g, fullArticleHtml);
    }

    // 4. Sequential Image replacements & Feature Image mapping
    if (!isIndex) {
      finalHtml = finalHtml.replace(/<!-- GHOST_FEATURE_IMAGE -->/g, post.feature_image || '');

      const bodyImages = [];
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(post.html || '')) !== null) {
        bodyImages.push(imgMatch[1]);
      }

      let imageIndex = 0;
      while (finalHtml.includes('<!-- GHOST_PAGE_PHOTO -->')) {
        const replacementUrl = (imageIndex < bodyImages.length) ? bodyImages[imageIndex] : '';
        finalHtml = finalHtml.replace('<!-- GHOST_PAGE_PHOTO -->', replacementUrl);
        imageIndex++;
      }
    }

    return finalHtml;
  }

  tagAffiliateLinks(htmlContent) {
    if (!htmlContent) return '';
    return htmlContent.replace(/<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi, (match, attributes, url) => {
      const isAffiliate = this.affiliateDomains.some(domain => url.toLowerCase().includes(domain.toLowerCase()));
      if (isAffiliate) {
        let tag = match;
        if (!/rel=/i.test(tag)) {
          tag = tag.replace(/<a\s+/i, '<a rel="sponsored nofollow noopener" ');
        } else {
          tag = tag.replace(/rel=["']([^"']*)["']/i, 'rel="sponsored nofollow noopener"');
        }
        if (!/target=/i.test(tag)) {
          tag = tag.replace(/<a\s+/i, '<a target="_blank" ');
        }
        return tag;
      }
      return match;
    });
  }

  redirectFormActions(htmlContent) {
    if (!htmlContent) return '';
    return htmlContent.replace(/<form(\s+[^>]*)?>/gi, (match, attributes) => {
      let tag = match;
      if (!attributes) {
        return `<form action="${this.formRedirectUrl}" method="POST">`;
      }
      if (!/action=/i.test(attributes)) {
        tag = tag.replace(/<form/i, `<form action="${this.formRedirectUrl}" method="POST" `);
      } else {
        tag = tag.replace(/action=["']([^"']*)["']/i, `action="${this.formRedirectUrl}"`);
      }
      // Ensure method="POST" is set
      if (!/method=/i.test(attributes)) {
        tag = tag.replace(/<form/i, '<form method="POST" ');
      }
      return tag;
    });
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

module.exports = DesignIngestor;
