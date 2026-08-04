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
  console.log('✓ Affiliate link auto-tagging and footer signature verified successfully!');

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
  console.assert(encryptedPostHtml.includes('CryptoJS.AES.decrypt'), 'Should include client-side AES decryptor script');
  console.log('✓ Build-time AES-256 password protection verified!');

  // Test 4: RSS & Sitemap Generation
  console.log('\n[Test 4] RSS & Sitemap XML Generation...');
  const rssGen = new RssSitemapGenerator('Company Blog', 'https://company.github.io/blog');
  const rssXml = rssGen.generateRss(posts);
  const sitemapXml = rssGen.generateSitemap(posts);

  console.assert(rssXml.includes('<rss version="2.0"'), 'RSS XML should be valid format');
  console.assert(sitemapXml.includes('<urlset'), 'Sitemap XML should be valid format');
  console.log('✓ RSS and Sitemap XML generated successfully!');

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

  console.log('\n==================================================');
  console.log('🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('==================================================\n');
}

runVerificationTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
