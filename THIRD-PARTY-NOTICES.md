# Third-Party Notices & Dependency Licenses

StaticGhost incorporates or bundles third-party software components. Each component is governed by its respective open-source license as detailed below:

---

## 1. Electron & Chromium Engine
* **Project**: Electron Framework (`electron`)
* **License**: MIT License
* **Copyright**: Copyright (c) Electron contributors, OpenJS Foundation
* **Notice**: Bundles Chromium, Node.js, and V8 engines. Chromium carries BSD, MIT, LGPL, and MPL licenses. Full Chromium licenses are embedded in Electron binary distributions under `LICENSES.chromium.html`.

---

## 2. Pagefind WebAssembly Search Engine
* **Project**: Pagefind (`pagefind`)
* **License**: MIT License
* **Copyright**: Copyright (c) Cloudflare, Inc.
* **URL**: https://pagefind.app/

---

## 3. Cheerio Server-Side HTML Parser
* **Project**: Cheerio (`cheerio`)
* **License**: MIT License
* **Copyright**: Copyright (c) Cheerio Authors
* **URL**: https://cheerio.js.org/

---

## 4. Cryptography

StaticGhost bundles **no third-party cryptography library**.

* **Build time**: Node.js built-in `crypto` module (AES-256-GCM, PBKDF2-HMAC-SHA256), covered by the Node.js license already noted under Electron above.
* **Read time**: the browser's native Web Cryptography API (`crypto.subtle`). No script is fetched from any CDN, and no cryptography code is redistributed by this project.

*(Earlier releases bundled CryptoJS via a CDN reference. That dependency was removed in favour of the platform-native WebCrypto API.)*

---

## 5. Ghost CMS API Schema & Types
* **Project**: Ghost CMS (`ghost`)
* **License**: MIT License
* **Copyright**: Copyright (c) Ghost Foundation
* **URL**: https://ghost.org/

---

## 6. File Browser Sidecar Container
* **Project**: File Browser (`filebrowser/filebrowser`)
* **License**: Apache License 2.0
* **Copyright**: Copyright (c) File Browser Authors
* **URL**: https://github.com/filebrowser/filebrowser

