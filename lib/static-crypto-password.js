const crypto = require('crypto');

class StaticCryptoPassword {
  encrypt(text, password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Package salt, iv, and ciphertext as a payload
    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  wrapEncryptedPost(htmlContent, password) {
    const encryptedPayload = this.encrypt(htmlContent, password);

    return `
      <div class="protected-post-container" id="protected-post-box">
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed #6366f1; border-radius: 12px; padding: 2rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔒</div>
          <h3 style="margin-top: 0;">Password Protected Post</h3>
          <p style="color: #94a3b8; font-size: 0.95rem;">This post is encrypted with AES-256. Enter the password below to decrypt and view the article.</p>
          <div style="max-width: 360px; margin: 1.5rem auto 0; display: flex; gap: 0.5rem;">
            <input type="password" id="post-pass-input" placeholder="Enter post password..." style="flex: 1; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #fff; outline: none;">
            <button onclick="unlockPost()" style="padding: 0.75rem 1.25rem; border-radius: 8px; border: none; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer;">Unlock</button>
          </div>
          <div id="unlock-error" style="color: #ef4444; font-size: 0.85rem; margin-top: 0.75rem; display: none;">Invalid password. Please try again.</div>
        </div>
      </div>
      <div id="decrypted-content-box" style="display: none;"></div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
      <script>
        const ENCRYPTED_PAYLOAD = "${encryptedPayload}";
        function unlockPost() {
          const pass = document.getElementById('post-pass-input').value;
          const errorEl = document.getElementById('unlock-error');
          try {
            // Decrypt using WebCrypto or Simple CryptoJS fallback
            const parts = ENCRYPTED_PAYLOAD.split(':');
            const salt = CryptoJS.enc.Hex.parse(parts[0]);
            const iv = CryptoJS.enc.Hex.parse(parts[1]);
            const ciphertext = CryptoJS.enc.Hex.parse(parts[2]);
            const key = CryptoJS.PBKDF2(pass, salt, { keySize: 256/32, iterations: 10000, hasher: CryptoJS.algo.SHA256 });

            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, { iv: iv });
            const decryptedHtml = decrypted.toString(CryptoJS.enc.Utf8);

            if (decryptedHtml && decryptedHtml.length > 0) {
              document.getElementById('protected-post-box').style.display = 'none';
              const contentBox = document.getElementById('decrypted-content-box');
              contentBox.innerHTML = decryptedHtml;
              contentBox.style.display = 'block';
            } else {
              errorEl.style.display = 'block';
            }
          } catch(e) {
            errorEl.style.display = 'block';
          }
        }
      </script>
    `;
  }
}

module.exports = StaticCryptoPassword;
