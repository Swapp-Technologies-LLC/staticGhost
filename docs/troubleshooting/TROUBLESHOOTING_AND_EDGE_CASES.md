# 🔍 Troubleshooting, Diagnostic Checklists & Failure Modes

> **Target Audience**: Developers & Support Engineers  

---

## 🚨 Error Diagnostic Matrix

| Error Code | Symptom | Root Cause | Remediation Procedure |
| :--- | :--- | :--- | :--- |
| **`ERR-DOCKER-01`** | Cannot start Ghost container | Docker Desktop daemon offline | Launch Docker Desktop; wait for green tray icon; retry button. |
| **`ERR-GHOST-401`** | `Ghost API Unauthorized` | Invalid Admin or Content API Key | Re-generate Content API Key in Ghost Admin -> Integrations -> Custom Integration. |
| **`ERR-SEARCH-02`** | Search returns no results | Pagefind WASM index binary missing | Verify `outputDir/search/search-index.js` exists; re-run `npm test`. |
| **`ERR-TEMPLATE-03`**| Layout photo placeholders broken | Excess `<!-- GHOST_PAGE_PHOTO -->` tags | Compiler automatically scrubs excess tags to `""`. Verify layout syntax. |
| **`ERR-TLS-04`** | Asset download rejection | Host TLS certificate validation issue | Check system clock is correct; if behind a corporate or antivirus proxy that re-signs TLS, set `NODE_EXTRA_CA_CERTS` to that proxy's CA certificate file. |

---

## 🛠️ Field Diagnostic Checklist
1. **Container Check**: Run `docker ps` to verify container `ghost:5-alpine` is active on port 2368.
2. **Build Asset Verification**: Inspect `outputDir` to confirm `index.html`, `sitemap.xml`, `robots.txt`, and `/search/` directory are present.
3. **Encryption Verification**: View raw source code of protected post to ensure zero raw plaintext is exposed.
