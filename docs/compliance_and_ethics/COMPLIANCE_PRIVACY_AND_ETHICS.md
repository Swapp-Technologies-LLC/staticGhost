# ⚖️ Compliance, Privacy Hygiene & Ethical Standards

> **Target Audience**: Developers, Field Technicians & Open Source Contributors  

---

## 1. Privacy Hygiene & Data Protection
* **Local Data Storage**: StaticGhost stores all API keys, database files, and project profiles locally on the user's workstation inside Electron's `userData` folder and Docker volume mounts.
* **No Telemetry (Community Edition)**: The StaticGhost Community Edition transmits zero user data or blog contents to Swapp Technologies LLC servers. **This statement is scoped to the Community Edition.** Pro-tier edge analytics collect visitor data from published blogs and will be governed by a separate privacy policy (internal draft in `private-docs/PRIVACY_POLICY.md`).
* **Third-Party Resources in Exported Sites**: Password-protected posts use the browser's built-in WebCrypto API and load **no** external script. Third-party analytics are opt-in and absent from a default export. Giscus comments, if enabled, load from GitHub and disclose visitor IP addresses to GitHub — publishers enabling comments are responsible for disclosing this in their own site privacy notice.

## 2. Google SEO Affiliate Link Tagging
* **Automatic `rel` Attribute Tagging**: External affiliate links processed by StaticGhost are automatically formatted with `rel="sponsored nofollow noopener"` and `target="_blank"` to comply with **Google search guidelines** and avoid manual search penalties.
* **⚠️ This is not FTC compliance.** The `rel` attribute is invisible to human readers and does **not** satisfy the FTC Endorsement Guides, which require a clear and conspicuous disclosure that the publisher earns a commission. Publishers using affiliate links remain solely responsible for adding a visible disclosure to their posts, and for complying with the terms of their affiliate programs (for example the Amazon Associates Operating Agreement, which mandates a specific disclosure statement).

## 3. Legal Liability Limits
* **Liability Cap**: Swapp Technologies LLC aggregate liability is capped at $100 USD for free Community Edition users or total 12-month fees paid for Pro subscribers, to the maximum extent permitted by applicable law. Software is provided "as-is". Certain liabilities cannot lawfully be limited, and mandatory consumer rights vary by jurisdiction.
* **Jurisdiction**: State of Maryland, United States of America, subject to any mandatory consumer-protection rules that apply where the user resides.

## 4. Security Claim Boundaries
* Build-time content encryption uses AES-256-GCM with PBKDF2-HMAC-SHA256 key derivation (600,000 iterations) and is decrypted in-browser via the native WebCrypto API. No encryption implementation is guaranteed free of defects, and because the ciphertext is published in a public file it remains subject to offline password attack. Use a strong post password, and do not rely on this as the sole protection for sensitive material.
* Static hosting substantially improves resilience to traffic spikes compared with database-backed rendering. It is not a guarantee of availability, and no representation of "DDoS-proof" operation is made.
