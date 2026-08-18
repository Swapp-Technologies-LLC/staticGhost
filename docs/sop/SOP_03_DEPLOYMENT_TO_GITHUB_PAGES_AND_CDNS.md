# 📋 SOP-03: Deployment to GitHub Pages, Netlify & Edge CDNs

> **SOP ID**: `SOP-STATICGHOST-03`  
> **Category**: Field Deployment & Infrastructure Delivery  
> **Target Role**: Certified DevOps Specialist / Web Administrator  

---

## 1. Objective
To deploy compiled static HTML assets to GitHub Pages, Netlify, or Cloudflare Pages for global edge delivery.

## 2. Deployment Procedures

### Procedure 3.1: GitHub Pages Deployment (Free Community Tier)
1. Open terminal inside your exported output directory:
   ```bash
   cd C:/Users/user/Documents/GitHub/my-static-blog
   ```
2. Commit and push build assets:
   ```bash
   git add .
   git commit -m "Deploy static export - $(date)"
   git push origin main
   ```
3. In GitHub Repository settings -> **Pages**, set source branch to `main` and root `/`.
4. Verify site resolves live at `https://<username>.github.io/<repo>/` in <35ms.

### Procedure 3.2: Netlify / Cloudflare Pages Deployment
1. Connect target output directory to your Cloudflare Pages / Netlify project repository.
2. Set build command to `(none)` (static HTML is pre-compiled).
3. Set publish directory to `/` or `dist/`.
4. Trigger automated git push webhook.

---

## 3. Post-Deployment Verification Checklist
- [ ] Site opens over HTTPS without SSL errors.
- [ ] Pagefind search modal returns results in <20ms.
- [ ] Affiliate links carry `rel="sponsored nofollow noopener"` attributes.
- [ ] `sitemap.xml` and `robots.txt` load cleanly at root.
