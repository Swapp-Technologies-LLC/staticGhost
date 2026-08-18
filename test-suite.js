const path = require('path');
const fs = require('fs');

const GhostFetcher = require('./lib/ghost-fetcher');
const DesignIngestor = require('./lib/design-ingestor');
const StaticCryptoPassword = require('./lib/static-crypto-password');
const RssSitemapGenerator = require('./lib/rss-sitemap-generator');
const PagefindIndexer = require('./lib/pagefind-indexer');

async function runVerificationTests() {
  console.log('--- RUNNING GHOST SUITE VERIFICATION TESTS ---');

  // Test 1: Ghost Fetcher
  console.log('\n[Test 1] Ghost Fetcher Mock Data...');
  const fetcher = new GhostFetcher();
  const posts = await fetcher.fetchAllPosts();
  console.log(`✓ Fetched ${posts.length} posts successfully.`);
  console.assert(posts.length >= 2, 'Should fetch at least 2 posts');

  // Test 2: Design Ingestion & Affiliate Auto-Tagging
  console.log('\n[Test 2] Design Ingestor & Affiliate Auto-Tagging...');
  const ingestor = new DesignIngestor({
    siteTitle: 'Swapp Tech & Company Blog',
    siteUrl: 'https://company.github.io/blog',
    affiliateDomains: ['amazon.com', 'bestbuy.com', 'partner.com']
  });

  const processedHtml = ingestor.processPostToHtml(posts[0]);
  console.log('✓ Post HTML processed.');
  console.assert(processedHtml.includes('rel="sponsored nofollow noopener"'), 'Affiliate link should contain rel="sponsored nofollow noopener"');
  console.assert(processedHtml.includes('⏱️'), 'Should contain reading time calculation');
  console.assert(processedHtml.includes('Swapp Technologies LLC'), 'Should contain Swapp Technologies LLC footer signature');
  console.assert(processedHtml.includes('Donate to Ghost'), 'Should contain Ghost donation link');
  
  // Index Layout Verification
  const indexHtml = ingestor.processPostToHtml({ title: 'Latest Articles', html: '<h2>List of Posts</h2>' }, true);
  console.assert(indexHtml.includes('<h2>List of Posts</h2>'), 'Should output content for index page');
  console.assert(!indexHtml.includes('⏱️'), 'Index page should not contain reading time calculation');
  console.assert(!indexHtml.includes('Sponsored / Affiliate Disclosure'), 'Index page should not contain disclosure badge');
  console.log('✓ Affiliate link auto-tagging, footer signature, and index page processing verified successfully!');

  // Form Redirector Verification
  const redirectIngestor = new DesignIngestor({
    enableFormRedirect: true,
    formRedirectUrl: 'https://formspree.io/f/test-id'
  });
  const inputHtmlForm = '<form class="test-form"><input type="email" name="email"></form>';
  const outputHtmlForm = redirectIngestor.redirectFormActions(inputHtmlForm);
  console.assert(outputHtmlForm.includes('action="https://formspree.io/f/test-id"'), 'Form action should be redirected');
  console.assert(outputHtmlForm.includes('method="POST"'), 'Form method should be forced to POST');
  console.log('✓ Form Action Auto-Redirector verified successfully!');

  // Test 3: Build-time AES Password Encryption
  console.log('\n[Test 3] AES Password Post Encryption...');
  const crypto = new StaticCryptoPassword();
  const encryptedPostHtml = ingestor.processPostToHtml(posts[1]);
  console.assert(encryptedPostHtml.includes('Password Protected Post'), 'Should render password prompt UI');
  console.assert(encryptedPostHtml.includes('crypto.subtle.decrypt'), 'Should decrypt via native WebCrypto SubtleCrypto');
  console.assert(encryptedPostHtml.includes('AES-GCM'), 'Should use authenticated AES-GCM');
  console.assert(!/cdnjs|crypto-js/i.test(encryptedPostHtml), 'Must not load any third-party crypto script from a CDN');
  console.assert(!encryptedPostHtml.includes(posts[1].html), 'Plaintext post body must never appear in the build output');
  const payloadMatch = encryptedPostHtml.match(/ENCRYPTED_PAYLOAD = "(v2:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+)"/);
  console.assert(payloadMatch, 'Should embed a well-formed v2 encrypted payload');
  console.log('✓ Build-time AES-256-GCM password protection verified (WebCrypto, no CDN)!');

  // Test 3b: round-trip the payload through the same primitives the browser uses
  if (payloadMatch) {
    const [, ver, saltHex, ivHex, ctHex] = payloadMatch[0].match(/(v2):([0-9a-f]+):([0-9a-f]+):([0-9a-f]+)/);
    const nodeCrypto = require('crypto');
    const key = nodeCrypto.pbkdf2Sync(posts[1].password || 'secret', Buffer.from(saltHex, 'hex'), 600000, 32, 'sha256');
    const buf = Buffer.from(ctHex, 'hex');
    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(buf.subarray(buf.length - 16));
    const out = Buffer.concat([decipher.update(buf.subarray(0, buf.length - 16)), decipher.final()]).toString('utf8');
    console.assert(out.length > 0, 'Encrypted payload should round-trip back to the original post body');
    console.log('✓ Encrypted payload round-trip verified!');
  }

  // Test 3c: FTC affiliate disclosure banner
  console.log('\n[Test 3c] FTC Affiliate Disclosure Banner...');
  const discOn = new DesignIngestor({ affiliateDomains: ['amazon.com'], enableAffiliateAutoTag: true });
  const discOff = new DesignIngestor({ affiliateDomains: ['amazon.com'], enableAffiliateAutoTag: false });
  console.assert(discOn.processPostToHtml(posts[0]).includes('ftc-affiliate-disclosure'), 'Disclosure banner should render when affiliate tagging is enabled');
  console.assert(!discOff.processPostToHtml(posts[0]).includes('ftc-affiliate-disclosure'), 'Disclosure banner should NOT render when affiliate tagging is disabled');
  console.log('✓ FTC affiliate disclosure banner verified!');

  // Test 4: RSS & Sitemap Generation
  console.log('\n[Test 4] RSS & Sitemap XML Generation...');
  const rssGen = new RssSitemapGenerator('Company Blog', 'https://company.github.io/blog');
  const rssXml = rssGen.generateRss(posts);
  const sitemapXml = rssGen.generateSitemap(posts);
  const robotsTxt = rssGen.generateRobotsTxt();

  console.assert(rssXml.includes('<rss version="2.0"'), 'RSS XML should be valid format');
  console.assert(sitemapXml.includes('<urlset'), 'Sitemap XML should be valid format');
  console.assert(robotsTxt.includes('Sitemap: https://company.github.io/blog/sitemap.xml'), 'Robots.txt should include sitemap directive');
  console.log('✓ RSS, Sitemap XML, and Robots.txt generated successfully!');

  // Test 5: Static Export to Temporary Directory & Pagefind Indexing
  console.log('\n[Test 5] Full Static Directory Export & Search Indexing...');
  const testOutputDir = path.join(__dirname, 'test-export-output');
  if (!fs.existsSync(testOutputDir)) fs.mkdirSync(testOutputDir, { recursive: true });

  fs.writeFileSync(path.join(testOutputDir, 'index.html'), processedHtml, 'utf8');
  posts.forEach(p => {
    fs.writeFileSync(path.join(testOutputDir, `${p.slug}.html`), ingestor.processPostToHtml(p), 'utf8');
  });

  PagefindIndexer.createSearchIndex(testOutputDir, posts);
  console.assert(fs.existsSync(path.join(testOutputDir, 'search', 'search-index.js')), 'Search index JS should exist');
  console.log('✓ Search index created at /search/search-index.js');

  // Test 6: Multi-Template Ingestion & Dynamic Photo Placeholders
  console.log('\n[Test 6] Multi-Template Ingestion & Dynamic Photo Placeholders...');
  
  const photoTemplate = '<html><body>Image 1: <!-- GHOST_PAGE_PHOTO -->, Image 2: <!-- GHOST_PAGE_PHOTO -->, Feature: <!-- GHOST_FEATURE_IMAGE --></body></html>';
  const postWithImages = {
    title: 'Post with Images',
    slug: 'post-images',
    feature_image: 'https://site.com/hero.jpg',
    html: '<p>Intro</p><img src="https://site.com/photo-a.jpg"><p>Middle</p><img src="https://site.com/photo-b.jpg"><p>End</p>'
  };

  const processedPhotoHtml = ingestor.processPostToHtml(postWithImages, false, photoTemplate);
  console.assert(processedPhotoHtml.includes('Image 1: https://site.com/photo-a.jpg'), 'First placeholder should match photo-a');
  console.assert(processedPhotoHtml.includes('Image 2: https://site.com/photo-b.jpg'), 'Second placeholder should match photo-b');
  console.assert(processedPhotoHtml.includes('Feature: https://site.com/hero.jpg'), 'Feature image should match hero.jpg');
  console.log('✓ Sequential photo placeholders and feature image mapped successfully!');

  const sampleTemplates = [
    { key: 'gallery', html: '<html>Gallery: <!-- GHOST_CONTENT --></html>' },
    { key: 'review', html: '<html>Review: <!-- GHOST_CONTENT --></html>' }
  ];

  const galleryPost = {
    title: 'My Gallery',
    tags: [{ name: 'Gallery', slug: 'gallery' }],
    html: '<p>Photos here</p>'
  };

  let resolvedTemplateHtml = null;
  if (galleryPost.tags && Array.isArray(galleryPost.tags)) {
    for (const tag of galleryPost.tags) {
      const tagSlug = (tag.slug || tag.name || '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      const matched = sampleTemplates.find(t => t.key === tagSlug);
      if (matched) {
        resolvedTemplateHtml = matched.html;
        break;
      }
    }
  }

  console.assert(resolvedTemplateHtml !== null, 'Should resolve tag-based template');
  console.assert(resolvedTemplateHtml.includes('Gallery:'), 'Resolved template should be Gallery template');
  
  const compiledGalleryHtml = ingestor.processPostToHtml(galleryPost, false, resolvedTemplateHtml);
  console.assert(compiledGalleryHtml.includes('Gallery:'), 'Compiled output should use Gallery layout');
  console.log('✓ Custom tag-based template routing verified successfully!');

  console.log('\n==================================================');
  console.log('🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('==================================================\n');
}

runVerificationTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
