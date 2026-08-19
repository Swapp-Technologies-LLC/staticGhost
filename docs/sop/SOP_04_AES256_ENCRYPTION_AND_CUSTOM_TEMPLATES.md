# 📋 SOP-04: AES-256 Content Encryption & Custom Template Routing

> **SOP ID**: `SOP-STATICGHOST-04`  
> **Category**: Advanced Features & Security Operations  
> **Target Role**: Systems Administrator  

---

## 1. Objective
To configure build-time AES-256-GCM encryption for private posts and set up tag-based custom template overrides (`#gallery`, `#case-study`) with dynamic photo mappings.

## 2. Operating Procedures

### Procedure 4.1: Build-Time AES-256 Post Encryption
1. In Ghost Editor (`localhost:2368/ghost`), open post settings for a private article.
2. Set post visibility to **Password Protected** and enter a secret password.
3. Run StaticGhost Export.
4. Compiler automatically:
   - Derives a key from the password with PBKDF2-HMAC-SHA256 (600,000 iterations, random 16-byte salt).
   - Encrypts the post HTML body with authenticated **AES-256-GCM** using Node's built-in `crypto` module.
   - Strips raw plaintext entirely from exported files.
   - Embeds the hex-encoded payload (`v2:salt:iv:ciphertext||authTag`) and an inline decryptor that uses the browser's native WebCrypto API. No third-party script is loaded.
5. Test: Open the exported HTML over **HTTPS or localhost** (WebCrypto requires a secure context), enter the password, and verify the content decrypts. Key derivation is intentionally slow — expect roughly a quarter of a second.
6. Verify an incorrect password is rejected: AES-GCM authentication fails cleanly rather than rendering corrupted output.

> **Security note:** the ciphertext is published in a public file and is therefore subject to offline password attack. The iteration count raises the cost but does not eliminate it — always use a strong post password.

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
