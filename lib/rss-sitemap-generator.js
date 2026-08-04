class RssSitemapGenerator {
  constructor(siteTitle, siteUrl) {
    this.siteTitle = siteTitle || 'Company Blog';
    this.siteUrl = (siteUrl || 'https://mycompany.github.io/blog').replace(/\/$/, '');
  }

  generateRss(posts) {
    const itemsXml = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${this.siteUrl}/${post.slug}.html</link>
      <guid isPermaLink="true">${this.siteUrl}/${post.slug}.html</guid>
      <pubDate>${new Date(post.published_at || Date.now()).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
    </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${this.siteTitle}]]></title>
    <link>${this.siteUrl}/</link>
    <description><![CDATA[Latest posts from ${this.siteTitle}]]></description>
    <atom:link href="${this.siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${itemsXml}
  </channel>
</rss>`;
  }

  generateSitemap(posts) {
    const urlsXml = posts.map(post => `
  <url>
    <loc>${this.siteUrl}/${post.slug}.html</loc>
    <lastmod>${new Date(post.published_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urlsXml}
</urlset>`;
  }
}

module.exports = RssSitemapGenerator;
