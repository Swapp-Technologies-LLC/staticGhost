const { app, BrowserWindow, ipcMain, dialog, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');

const GhostFetcher = require('./lib/ghost-fetcher');
const DesignIngestor = require('./lib/design-ingestor');
const RssSitemapGenerator = require('./lib/rss-sitemap-generator');
const PagefindIndexer = require('./lib/pagefind-indexer');
const DockerGhost = require('./lib/docker-ghost');
const CloudflareTunnel = require('./lib/cloudflare-tunnel');
const CloudDeployer = require('./lib/cloud-deployer');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 880,
    minWidth: 900,
    minHeight: 650,
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Helper for Native OS Keychain Encryption (Windows DPAPI / macOS Keychain / Linux Secret Service)
function encryptToken(text) {
  if (!text) return '';
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return 'enc:' + safeStorage.encryptString(text).toString('hex');
    }
  } catch (e) {}
  return text;
}

function decryptToken(text) {
  if (!text) return '';
  if (!text.startsWith('enc:')) return text;
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const hex = text.replace('enc:', '');
      return safeStorage.decryptString(Buffer.from(hex, 'hex'));
    }
  } catch (e) {}
  return '';
}

// Project Profiles Storage with OS Encryption
const profilesPath = () => path.join(app.getPath('userData'), 'project-profiles.json');

ipcMain.handle('load-profiles', async () => {
  try {
    const currentPath = profilesPath();
    if (fs.existsSync(currentPath)) {
      const data = fs.readFileSync(currentPath, 'utf8');
      const loaded = JSON.parse(data);
      return loaded.map(p => ({
        ...p,
        githubToken: decryptToken(p.githubToken),
        ghostApiKey: decryptToken(p.ghostApiKey)
      }));
    } else {
      const legacyPath = path.join(app.getPath('appData'), 'ghost-desktop-suite', 'project-profiles.json');
      if (fs.existsSync(legacyPath)) {
        const data = fs.readFileSync(legacyPath, 'utf8');
        const destDir = path.dirname(currentPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.writeFileSync(currentPath, data, 'utf8');
        const loaded = JSON.parse(data);
        return loaded.map(p => ({
          ...p,
          githubToken: decryptToken(p.githubToken),
          ghostApiKey: decryptToken(p.ghostApiKey)
        }));
      }
    }
  } catch (e) {}
  return [
    {
      id: 'proj_default',
      name: 'Project A (Main Blog)',
      containerName: 'ghost-blog-proj-a',
      port: 2368,
      volumeName: 'ghost_vol_proj_a',
      siteTitle: 'Main Project Blog',
      siteUrl: 'https://username.github.io/blog-a',
      githubRepo: 'https://github.com/username/blog-a.git',
      githubToken: '',
      ghostApiKey: '',
      giscusRepo: '',
      customLayoutHtml: ''
    }
  ];
});

ipcMain.handle('save-profiles', async (event, profiles) => {
  try {
    const encryptedProfiles = profiles.map(p => ({
      ...p,
      githubToken: encryptToken(p.githubToken),
      ghostApiKey: encryptToken(p.ghostApiKey)
    }));
    fs.writeFileSync(profilesPath(), JSON.stringify(encryptedProfiles, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// IPC Communication Handlers

ipcMain.handle('test-ghost-connection', async (event, options) => {
  const fetcher = new GhostFetcher(options);
  return await fetcher.testConnection();
});

ipcMain.handle('select-file', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'HTML Files', extensions: ['html', 'htm'] }]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return { path: filePath, content };
});

ipcMain.handle('docker-status', async (event, containerName) => {
  const available = await DockerGhost.checkDockerAvailable();
  if (!available.installed) return available;
  const status = await DockerGhost.getGhostContainerStatus(containerName || 'ghost-local-blog');
  return { installed: true, ...status };
});

ipcMain.handle('docker-start', async (event, options) => {
  return await DockerGhost.startGhostContainer(options);
});

ipcMain.handle('docker-stop', async (event, containerName) => {
  return await DockerGhost.stopGhostContainer(containerName);
});

ipcMain.handle('docker-start-filebrowser', async (event, options) => {
  const result = await DockerGhost.startFileBrowser(options);
  if (result.success && result.port) {
    const { shell } = require('electron');
    shell.openExternal(`http://localhost:${result.port}`);
  }
  return result;
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
  return { success: true };
});

ipcMain.handle('open-readme', async () => {
  const { shell } = require('electron');
  const path = require('path');
  shell.openPath(path.join(__dirname, 'README.md'));
  return { success: true };
});

ipcMain.handle('cloudflare-status', async () => {
  return await CloudflareTunnel.checkCloudflared();
});

ipcMain.handle('export-static-site', async (event, config) => {
  try {
    const projectSlug = (config.projectName || 'project').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const outputDir = path.join(app.getPath('userData'), `exported-ghost-${projectSlug}`);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fetcher = new GhostFetcher({ baseUrl: config.ghostUrl, apiKey: config.ghostApiKey });
    const posts = await fetcher.fetchAllPosts();

    const ingestor = new DesignIngestor({
      customLayoutHtml: config.customLayoutHtml,
      siteTitle: config.siteTitle || 'My Blog',
      siteUrl: config.siteUrl || 'https://username.github.io/blog',
      enableAffiliateAutoTag: config.enableAffiliateAutoTag !== false,
      affiliateDomains: config.affiliateDomains || ['amazon.com', 'amzn.to', 'bestbuy.com'],
      giscusRepo: config.giscusRepo || '',
      enableFormRedirect: config.enableFormRedirect === true,
      formRedirectUrl: config.formRedirectUrl || ''
    });

    const homepageHtml = ingestor.processPostToHtml({
      title: config.siteTitle || 'Latest Articles',
      slug: 'index',
      html: `
        <div class="blog-container" style="max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, sans-serif;">
          <!-- Search & Filter Controls -->
          <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; margin-bottom: 2.5rem; backdrop-filter: blur(8px);">
            <input type="text" id="search-input" placeholder="🔍 Search articles, topics, or tags..." 
                   style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;"
                   onfocus="this.style.borderColor='#818cf8'" onblur="this.style.borderColor='#475569'">
            
            <div style="margin-top: 1.25rem;">
              <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 0.6rem; letter-spacing: 0.05em;">FILTER BY TAG:</span>
              <div id="tag-filters" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <!-- Tag buttons injected dynamically -->
              </div>
            </div>
          </div>

          <!-- Featured Post Container -->
          <div id="featured-post-container" style="margin-bottom: 3.5rem;">
            <!-- Featured card injected dynamically -->
          </div>

          <!-- Main Articles Grid -->
          <h2 style="font-size: 1.5rem; border-bottom: 2px solid #334155; padding-bottom: 0.5rem; margin-bottom: 1.5rem; color: #fff; font-weight: 700;">All Articles</h2>
          <div id="posts-grid" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
            <!-- Article cards injected dynamically -->
          </div>
        </div>

        <script src="./search/search-index.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            const posts = window.SEARCH_INDEX || [];
            const searchInput = document.getElementById('search-input');
            const tagFilters = document.getElementById('tag-filters');
            const featuredContainer = document.getElementById('featured-post-container');
            const postsGrid = document.getElementById('posts-grid');

            let activeTag = 'All';
            let searchQuery = '';

            // Extract Unique Tags
            const allTags = new Set();
            posts.forEach(p => {
              if (p.tags) {
                p.tags.split(',').map(t => t.trim()).forEach(t => {
                  if (t) allTags.add(t);
                });
              }
            });

            // Render Tag Filter Buttons
            function renderTagFilters() {
              let buttonsHtml = \`<button class="tag-btn" data-tag="All" style="padding: 0.4rem 1rem; border-radius: 9999px; border: 1px solid #475569; background: \${activeTag === 'All' ? '#818cf8' : '#1e293b'}; color: #fff; cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;">All</button>\`;
              allTags.forEach(tag => {
                buttonsHtml += \`<button class="tag-btn" data-tag="\${tag}" style="padding: 0.4rem 1rem; border-radius: 9999px; border: 1px solid #475569; background: \${activeTag === tag ? '#818cf8' : '#1e293b'}; color: #fff; cursor: pointer; font-size: 0.82rem; font-weight: 600; transition: all 0.2s;">\${tag}</button>\`;
              });
              tagFilters.innerHTML = buttonsHtml;

              document.querySelectorAll('.tag-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                  activeTag = btn.dataset.tag;
                  renderAll();
                });
              });
            }

            // Render Featured Post & Article Grid
            function renderAll() {
              renderTagFilters();
              
              let filtered = posts;
              if (activeTag !== 'All') {
                filtered = filtered.filter(p => p.tags && p.tags.split(',').map(t => t.trim()).includes(activeTag));
              }
              if (searchQuery) {
                filtered = filtered.filter(p => 
                  p.title.toLowerCase().includes(searchQuery) || 
                  p.excerpt.toLowerCase().includes(searchQuery) ||
                  p.tags.toLowerCase().includes(searchQuery)
                );
              }

              // Display the latest post as featured only when no search or tag filter is active
              if (filtered.length > 0 && searchQuery === '' && activeTag === 'All') {
                const featured = filtered[0];
                const remaining = filtered.slice(1);

                featuredContainer.style.display = 'block';
                featuredContainer.innerHTML = \`
                  <h2 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: #818cf8; margin-bottom: 0.75rem; font-weight: 700;">⭐ Featured Article</h2>
                  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid #334155; border-radius: 12px; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4);">
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                      \${featured.tags ? featured.tags.split(',').map(t => \`<span style="background: rgba(129, 140, 248, 0.2); color: #c7d2fe; font-size: 0.75rem; padding: 0.25rem 0.60rem; border-radius: 4px; font-weight: 600;">\${t.trim()}</span>\`).join('') : ''}
                    </div>
                    <h3 style="margin: 0; font-size: 1.8rem; font-weight: 700; line-height: 1.3;"><a href="\${featured.url}" style="color: #fff; text-decoration: none;">\${featured.title}</a></h3>
                    <p style="color: #94a3b8; font-size: 0.98rem; margin: 0; line-height: 1.6;">\${featured.excerpt}</p>
                    <a href="\${featured.url}" style="display: inline-block; width: fit-content; background: #6366f1; color: #fff; padding: 0.65rem 1.30rem; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.88rem; transition: background 0.2s;" onmouseover="this.style.background='#4f46e5'" onmouseout="this.style.background='#6366f1'">Read Featured Article →</a>
                  </div>
                \`;

                renderGrid(remaining);
              } else {
                featuredContainer.style.display = 'none';
                renderGrid(filtered);
              }
            }

            function renderGrid(list) {
              if (list.length === 0) {
                postsGrid.innerHTML = \`
                  <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; color: #94a3b8; background: #1e293b; border: 1px solid #334155; border-radius: 10px;">
                    <h3 style="margin: 0; color: #fff; font-size: 1.2rem;">No matching articles found</h3>
                    <p style="font-size: 0.88rem; margin: 0.5rem 0 0 0;">Try adjusting your keyword search or filter tags.</p>
                  </div>
                \`;
                return;
              }

              postsGrid.innerHTML = list.map(p => \`
                <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; min-height: 220px; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">
                  <div>
                    <div style="display: flex; gap: 0.35rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
                      \${p.tags ? p.tags.split(',').map(t => \`<span style="background: rgba(148, 163, 184, 0.12); color: #cbd5e1; font-size: 0.7rem; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 500;">\${t.trim()}</span>\`).join('') : ''}
                    </div>
                    <h3 style="margin-top: 0; margin-bottom: 0.5rem; font-size: 1.25rem; font-weight: 700; line-height: 1.4;"><a href="\${p.url}" style="color: #818cf8; text-decoration: none;">\${p.title}</a></h3>
                    <p style="color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.5rem;">\${p.excerpt}</p>
                  </div>
                  <a href="\${p.url}" style="display: inline-block; color: #6366f1; font-weight: 600; font-size: 0.88rem; text-decoration: none;">Read Article →</a>
                </div>
              \`).join('');
            }

            searchInput.addEventListener('input', (e) => {
              searchQuery = e.target.value.toLowerCase().trim();
              renderAll();
            });

            renderAll();
          });
        </script>
      `,
      excerpt: 'Latest updates and product recommendations.',
      published_at: new Date().toISOString()
    });

    fs.writeFileSync(path.join(outputDir, 'index.html'), homepageHtml, 'utf8');

    posts.forEach(post => {
      const postHtml = ingestor.processPostToHtml(post);
      fs.writeFileSync(path.join(outputDir, `${post.slug}.html`), postHtml, 'utf8');
    });

    const rssGen = new RssSitemapGenerator(config.siteTitle, config.siteUrl);
    fs.writeFileSync(path.join(outputDir, 'rss.xml'), rssGen.generateRss(posts), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), rssGen.generateSitemap(posts), 'utf8');

    // Copy Favicons to Output Directory if present
    const srcFaviconIco = path.join(__dirname, 'src', 'favicon.ico');
    const srcFaviconPng = path.join(__dirname, 'src', 'favicon.png');
    if (fs.existsSync(srcFaviconIco)) {
      fs.copyFileSync(srcFaviconIco, path.join(outputDir, 'favicon.ico'));
    }
    if (fs.existsSync(srcFaviconPng)) {
      fs.copyFileSync(srcFaviconPng, path.join(outputDir, 'favicon.png'));
    }

    PagefindIndexer.createSearchIndex(outputDir, posts);

    return {
      success: true,
      exportDir: outputDir,
      postCount: posts.length,
      message: `Exported ${posts.length} posts for '${config.siteTitle}'!`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('deploy-github', async (event, options) => {
  const deployer = new CloudDeployer(options);
  return await deployer.deployDirectory(options.exportDir);
});
