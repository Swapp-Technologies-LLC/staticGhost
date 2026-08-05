# StaticGhost - Local Development Guide

This guide details the development workflow, project architecture, compilation process, and testing guidelines for developers contributing to the StaticGhost Desktop Suite.

---

## 📑 Table of Contents
- [📁 Project Directory Map](#-project-directory-map)
- [🛠️ Local Development Cycle](#️-local-development-cycle)
- [🔒 Data Persistence & Profiles](#-data-persistence--profiles)
- [🎨 Custom Post Layouts & Placeholders](#-custom-post-layouts--placeholders)
- [🧪 Testing & Verification](#-testing--verification)
- [📦 Packaging & Production Releases](#-packaging--production-releases)
- [🌐 Collaborating via Git & WSL](#-collaborating-via-git--wsl)

---

## 📁 Project Directory Map

| Path / File | Purpose |
| :--- | :--- |
| **`main.js`** | Electron Main Process. Manages window lifecycles, IPC communication handlers (Docker, compilation, deployment), and native filesystem interactions. |
| **`preload.js`** | Context isolation bridge. Safely exposes select backend node APIs/handlers to the frontend renderer. |
| **`src/index.html`** | Desktop app UI layouts, tabs, forms, and custom modal windows. |
| **`src/renderer.js`** | Electron Renderer Process. Handles client-side state, form data binding, profile creation, and button event listeners. |
| **`src/styles.css`** | App custom styling (dark mode, glassmorphism, buttons, grids, layout panels). |
| **`lib/ghost-fetcher.js`** | Ghost Content API client wrapper. Handles Docker/local connections, credentials parsing, and fallback mock data. |
| **`lib/design-ingestor.js`** | Exporter compiler engine. Parses raw post HTML, auto-tags affiliate links, wraps content into layouts, and extracts photos. |
| **`lib/static-crypto-password.js`** | Build-time AES-256 password protection encoder and browser decryption script generator. |
| **`lib/rss-sitemap-generator.js`** | XML compiler for feed readers (`rss.xml`) and search engines (`sitemap.xml`). |
| **`lib/pagefind-indexer.js`** | Client-side search index builder using Pagefind. |
| **`test-suite.js`** | Local automated test suite. Evaluates compiler accuracy and layouts without launching the full GUI. |

---

## 🛠️ Local Development Cycle

When making styling adjustments, backend updates, or adding new features, follow this workflow:

1. **Active Iteration**: Make changes to source files (e.g. `src/renderer.js`, `lib/design-ingestor.js`).
2. **Launch Development GUI**: Run the development Electron shell directly from source:
   ```bash
   npm start
   ```
   *Any edits to the renderer layer (`src/index.html` or `src/styles.css`) can be viewed immediately in the open window by pressing `Ctrl + R` (Reload).*
3. **Verify Code Health**: Before packaging or committing code, always run the automated verification suite:
   ```bash
   npm test
   ```

---

## 🔒 Data Persistence & Profiles

Project profiles, database ports, volumes, custom layout scripts, and Content API Keys are saved locally on the user's computer inside the Electron app data directory:
* **Path (Windows)**: `%APPDATA%/staticghost/profiles.json`
* **Path (macOS)**: `~/Library/Application Support/staticghost/profiles.json`

Do **NOT** commit local profiles, volume data, or API keys to the version control repository. They are managed dynamically by each user's installation.

---

## 🎨 Custom Post Layouts & Placeholders

StaticGhost supports multiple layout templates per project.
* **Default Template**: Loaded in the "Individual Article Layout Template" textarea.
* **Additional Templates**: Managed in the table at the bottom of the Design Ingestion tab. These are matched automatically against the post's **tags** (slug-matched) or **Ghost custom template name** (`post.custom_template`).

### Dynamic Layout Placeholders
Use these HTML comments inside layout templates to inject Ghost content dynamically during static export:

* `<!-- GHOST_PAGE_TITLE -->`: Post title (placed in `<title>`).
* `<!-- GHOST_SITE_TITLE -->`: Blog name (used in headers/logos).
* `<!-- GHOST_META_TAGS -->`: OpenGraph tags, RSS feeds, and viewport tags (placed in `<head>`).
* `<!-- GHOST_CONTENT -->`: Core post body markup, Giscus comments, and page signature.
* `<!-- GHOST_FEATURE_IMAGE -->`: Post cover photo URL.
* `<!-- GHOST_PAGE_PHOTO -->`: Sequentially replaced in order of appearance by post body images (1st placeholder gets 1st body image, 2nd gets 2nd, etc.). Cleans up excess placeholders automatically.

---

## 🧪 Testing & Verification

The automated verification tests in `test-suite.js` run independent unit checks on:
* **Mock Data Integrity**: Validates sample article loads.
* **Affiliate Tagging & Redirects**: Ensures affiliate domains are auto-tagged with `rel="sponsored nofollow noopener"` and form actions redirect correctly.
* **AES Encryption**: Confirms password-protected posts are encrypted at build time and decryption scripts are embedded.
* **RSS/Sitemaps**: Checks XML formatting.
* **Multi-Template & Photo Sequencing**: Verifies tag template routing and sequential image mapping.

*Always add a matching test block to `test-suite.js` when developing a new compilation feature.*

---

## 📦 Packaging & Production Releases

When your updates are fully tested and ready for production use, follow the guidelines below:

### Semantic Versioning (SemVer) Guidelines
StaticGhost adheres to the standard `vMAJOR.MINOR.PATCH` versioning convention:
* **`PATCH` (Bug Fixes & Tweaks)**: Bumed for backward-compatible bug fixes, UI styling alignments, or documentation corrections. Example: `v1.0.0` ➔ `v1.0.1`.
* **`MINOR` (New Features)**: Bumped for new features introduced in a backward-compatible manner (e.g., adding a new templates override manager or custom export targets). Example: `v1.0.0` ➔ `v1.1.0`.
* **`MAJOR` (Breaking Changes)**: Bumped for breaking changes or incompatible API/schema updates (e.g., modifying `profiles.json` structure in a way that breaks existing project files). Example: `v1.0.0` ➔ `v2.0.0`.
* **Pre-releases**: Suffix version tag with a hyphen and phase for testing builds (e.g., `v1.1.0-alpha.1`, `v1.1.0-beta.3`).

### Release Procedure
1. **Bump Version**: Update the `"version"` field inside `package.json` following the SemVer guidelines above.
2. **Build Standalone Installer**:
   ```powershell
   npm run dist
   ```
   *Note: If building behind a corporate VPN or proxy that inspects SSL handshakes, package downloads may fail with certificate errors. Bypass this using:*
   ```powershell
   $env:NODE_TLS_REJECT_UNAUTHORIZED="0"; npm run dist
   ```
3. **Deploy Setup**: Open the `dist/` directory and run **`StaticGhost Setup <version>.exe`** to install the application natively. This registers the new launcher in the Start Menu and Desktop.

---

## 🌐 Collaborating via Git & WSL

For developers working inside a mixed Windows / Windows Subsystem for Linux (WSL) environment:
* **Running the App / Building**: Execute Windows commands inside PowerShell (`npm start`, `npm run dist`).
* **Git Operations**: Because SSH keys are held securely inside the WSL shell, run your Git commits, branch merges, and pulls inside the Ubuntu terminal:
  ```bash
  git add .
  git commit -m "Update message"
  git push origin main
  ```
