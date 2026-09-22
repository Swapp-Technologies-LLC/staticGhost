# Changelog

All notable changes to **StaticGhost** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-09-03

### 🚨 Security & Breaking Changes

* **Strict Loopback Port Scoping (`127.0.0.1`)**: Container ports published via `DockerGhost.buildPortArg()` now bind strictly to `127.0.0.1` instead of `0.0.0.0`. 
  * *Impact:* Ghost and File Browser containers are no longer reachable from external network interfaces or local LAN peers, closing an attack surface that could bypass host-level packet filtering.
  * *Breaking Behavior:* If you previously accessed your local development Ghost container from other devices on your local network (e.g. mobile testing on LAN), that access is intentionally blocked. Use an authorized tunneling mechanism (such as Cloudflare Tunnel) to expose instances securely.
* **Anchored Container Status Filtering**: Container status and inspect operations now use strict regex anchors (`name=^<container-name>$`) with escaped metacharacters via `DockerGhost.buildNameFilter()`. Sibling containers sharing common substrings (e.g., `blog` vs `blog-filebrowser`) will no longer merge status outputs or conflict during container lifecycle management.

### 📜 Licensing

* **Operative AGPL-3.0-only Public License**: `LICENSE` is now the verbatim GNU AGPLv3 (AGPL-3.0-only); commercial licensing by separate agreement. Previous public metadata advertised MIT with no LICENSE file; that was incorrect.

### 🚀 Added

* **Time-Boxed File Browser Session Engine (`lib/filebrowser-timer.js`)**:
  * Implemented session timer controls: 15-minute default session, +15-minute extend step, and a 2-hour hard maximum cap calculated from initial startup timestamp.
  * Container image strictly pinned to `filebrowser/filebrowser:v2.30.0` to eliminate supply-chain drift.
  * Added automated startup and shutdown container sweeps to terminate orphaned browser instances.
* **Structured Observability & Distributed Tracing (`lib/logger.js`)**:
  * Single-line JSON logger emitting structured fields (`timestamp`, `service`, `level`, `message`, `requestId`, `durationMs`, `endpoint`, `customerId`, `exception`, `metadata`).
  * Added OpenTelemetry-compatible `startSpan()` tracing wrappers with automatic duration calculation for static compilation and export jobs.
* **Automated Verification Suite Expansion (`test-suite.js`)**:
  * Test Suite 7: Validates structured JSON logging format and distributed trace span lifecycle.
  * Test Suite 8: Validates file browser session timer math, extension clamps, and container sweep patterns.
  * Docker security suite: Validates regex name anchoring and loopback port string construction.
* **Installer Compilation & Dynamic Versioning**:
  * Added dynamic `appVersion` rendering in the renderer UI.
  * Configured NSIS target artifact name (`StaticGhost Setup ${version}.exe`).
* **Design & Repository Protection**:
  * Allowlisted and tracked `SITE_VISUAL_PATTERNS.md` defining reusable UI patterns (P-1 scrollytelling, P-2 framed screenshots, P-3 caption voice).
  * Hardened `./scripts/repo-guard.sh` and CI workflows with SVG path coordinate exclusions and explicit LF line ending enforcement.

### 🛠️ Fixed & Improved

* **Production Site URL in Newsletter Links**: Passed `options.siteUrl` into the Docker Ghost container `url` environment variable so newsletter previews format links with the target production domain rather than `localhost`.
* **Ghost 2FA Staff Verification Disabled on Localhost**: Added `security__staffDeviceVerification=false` environment configuration to prevent local test accounts from being locked out by email verification prompts on development containers.
* **Mail Transport Timeout Prevention**: Set `mail__transport=stub` and `mail__from=noreply@localhost` to resolve background mail transport timeouts during newsletter compilation.
* **UI & Layout Separation**:
  * Split Mode A Docker container administration and Cloudflare Tunnel Pro management into dedicated interface views.
  * Cleaned container state indicators (`Exited` normalized to `Stopped`).
  * Separated real-time action feedback from persistent container status lines.

### 📦 Binary Distribution Notice

* `StaticGhost Setup 1.1.0.exe` is distributed as an unsigned Windows executable. Code-signing certificates and automated over-the-air update mechanisms are scheduled for subsequent release phases. Verify SHA256 checksums when distributing release binaries.

---

## [1.0.0] - 2026-08-17

### 🚀 Initial Production Release

* **Desktop Application**: Electron-based interface for managing local Ghost instances via Docker and exporting complete static HTML sites.
* **Native WebCrypto Password Protection**: AES-256-GCM encryption with PBKDF2-HMAC-SHA256 key derivation (600,000 iterations) running in-browser via platform-native `crypto.subtle` (zero third-party dependencies, zero CDN requests).
* **Licensing (as published)**: This release's public metadata advertised the MIT license, but no `LICENSE` file was included, which left the licensing terms unclear. Corrected in 1.1.0: see *Licensing* above.
* **Static Export Engine**: Clean HTML rendering, custom header/footer template injection, Pagefind client-side search indexing, and automated RSS/Sitemap XML generation.
* **Compliance & Legal Protections**: Integrated FTC affiliate disclosure banners and automated `rel="sponsored nofollow noopener"` link attribute tagging.
* **Documentation Architecture**: Comprehensive public documentation covering architecture specifications, standard operating procedures, and certification question banks.
