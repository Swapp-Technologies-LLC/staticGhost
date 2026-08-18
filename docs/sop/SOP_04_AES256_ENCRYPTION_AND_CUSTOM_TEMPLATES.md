# 📋 SOP-04: AES-256 Content Encryption & Custom Template Routing

> **SOP ID**: `SOP-STATICGHOST-04`  
> **Category**: Advanced Features & Security Operations  
> **Target Role**: Certified Systems Administrator  

---

## 1. Objective
To configure build-time AES-256 WebCrypto encryption for private posts and set up tag-based custom template overrides (`#gallery`, `#case-study`) with dynamic photo mappings.

## 2. Operating Procedures

### Procedure 4.1: Build-Time AES-256 Post Encryption
1. In Ghost Editor (`localhost:2368/ghost`), open post settings for a private article.
2. Set post visibility to **Password Protected** and enter a secret password.
3. Run StaticGhost Export.
4. Compiler automatically:
   - Encrypts post HTML body using `CryptoJS.AES.encrypt(postHtml, secretPassword)`.
   - Strips raw plaintext entirely from exported files.
   - Embeds Base64 ciphertext and inline WebCrypto decryptor form.
5. Test: Open exported HTML in browser, enter password, verify content decrypts in <3ms.

### Procedure 4.2: Tag-Based Custom Template Routing
1. In StaticGhost Desktop settings, navigate to **Custom Templates**.
2. Add a template rule matching tag `gallery`:
   ```json
   {
     "key": "gallery",
     "name": "Photo Gallery Layout",
     "html": "<div class="gallery-container"><!-- GHOST_PAGE_PHOTO --><!-- GHOST_PAGE_PHOTO --></div>"
   }
   ```
3. Assign tag `#gallery` to post in Ghost.
4. During export, compiler replaces `<!-- GHOST_PAGE_PHOTO -->` comment placeholders sequentially with body images.
