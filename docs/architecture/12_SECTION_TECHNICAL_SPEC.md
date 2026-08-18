# 🏛️ StaticGhost — Public Technical Architecture Specification

> **Target Audience**: Swapp Academy Students, Open Source Contributors & System Integrators  
> **Parent Enterprise**: Swapp Technologies LLC  
> **Standard Conformed**: Master 12-Section Technical Specification Standard (`@myxfamily`)  
> **Ingestion Scope**: Whitelisted for Swapp Academy Frappe LMS Ingestion  

---

## 1. System Architecture
StaticGhost uses Electron's multi-process architecture to isolate frontend UI frames from Node.js operating system calls, Docker containers, and static compilation modules.

```mermaid
graph TD
    subgraph Client UI (Renderer)
        UI[src/index.html & src/renderer.js
Swapp Dark Theme #0b0f19]
    end
    subgraph Preload IPC Barrier
        Bridge[preload.js
contextBridge.exposeInMainWorld]
    end
    subgraph System Controller (Main)
        Main[main.js Node.js Controller
Docker CLI & File IO Engine]
    end
    subgraph Local Services
        Docker[Docker Engine: ghost:5-alpine
Localhost Container]
    end
    subgraph Static Edge Hosts
        Edge[GitHub Pages / Netlify / Cloudflare Pages]
    end

    UI -->|IPC Invoke| Bridge
    Bridge -->|ipcMain.handle| Main
    Main -->|Local REST & Shell| Docker
    Main -->|Git Push & Static HTML| Edge
```

* **Renderer Process**: Dashboard UI handling profile forms, log feeds, and event listeners.
* **Preload Script (`preload.js`)**: Secure boundary exposing whitelisted IPC channels (`nodeIntegration: false`, `contextIsolation: true`).
* **Main Process (`main.js`)**: Low-level controller managing Docker CLI commands, AES encryption, Pagefind search indexing, and Git deployments.

---

## 2. Database Schema
* **Flat Profile Database (`project-profiles.json`)**: Flat JSON store in `app.getPath('userData')` managing configured blog profiles.
* **Sandboxed Ghost Database (`ghost.db`)**: Isolated SQLite database mounted inside Docker containers (`/var/lib/ghost/content/data/ghost.db`).

---

## 3. API Specifications
* **Ghost Content API (v5)**: `GET http://localhost:<ghostPort>/ghost/api/v5/content/posts/?key=<contentKey>&include=tags,authors`
* **Electron IPC Channels**: `load-profiles`, `save-profiles`, `start-ghost-docker`, `stop-ghost-docker`, `export-static-site`, `deploy-github`.

---

## 4. Integration Requirements
* **Docker Desktop**: Host system must run Docker daemon for local Ghost containers.
* **Cloudflare Tunnel (`cloudflared`)**: CLI binary for exposing HTTPS preview links.
* **Giscus Engine**: Connects static pages to GitHub Discussions for zero-database comments.
* **OS Keychains**: Windows DPAPI and Apple Keychain via Electron `safeStorage`.

---

## 5. Data Synchronization
* **Volumetric Persistence**: Local directory bind-mounted into Docker (`-v <volumePath>/content:/var/lib/ghost/content`).
* **Exporter Pipeline**: Extracts Content API JSON, parses HTML via Cheerio, auto-tags affiliate links, wraps custom templates, and outputs static `.html` files.

---

## 6. Security & Compliance
* **Credential Isolation**: Encrypts API keys at rest via `safeStorage.encryptString()`.
* **Build-Time AES-256 WebCrypto Encryption**: Encrypts private post bodies during export; raw text is stripped from build output. WebCrypto decrypts in-browser.
* **Public Boundary Policy**: Secret API keys, billing webhooks, and private growth playbooks are strictly excluded from public training specifications.

---

## 7. Performance Requirements
* **Export Speed**: Compiles 100+ articles in under 3.0 seconds.
* **Container Cap**: Docker memory capped at `--memory="512m"`.
* **Search Speed**: Pagefind WASM full-text search returns results in <20ms.
* **CDN Latency**: Pre-rendered static pages load in <35ms on edge CDNs.

---

## 8. Monitoring & Logging
* **Structured Logs**: Written to `%APPDATA%/staticghost/logs/main.log`.
* **Container Pipe**: Docker stdout/stderr piped directly to desktop log console.

---

## 9. Testing Requirements
* **Automated Verification Suite (`test-suite.js`)**: 6 core test suites verifying API fetching, affiliate tagging, AES encryption, RSS/Sitemap/Robots.txt, search indexing, and multi-template routing.

---

## 10. Deployment & CI/CD
* **Installer Packaging**: `electron-builder` under NSIS wrapper generating `dist/StaticGhost Setup <version>.exe`.

---

## 11. Edge Cases & Error Handling
* **Ghost Offline Graceful Fallback**: Non-blocking user alert on connection failure.
* **Placeholder Cleanup**: Unmapped `<!-- GHOST_PAGE_PHOTO -->` comment tags cleaned up to prevent layout breaks.

---

## 12. Future Considerations
* **Incremental Export Diffing**: Timestamp-based partial re-compilation.
* **Auto-Schedule Exporter**: Background scheduler service.
