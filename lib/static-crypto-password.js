const crypto = require('crypto');

/**
 * Build-time post encryption.
 *
 * Design notes:
 *  - Uses AES-256-GCM (authenticated) rather than CBC, so a wrong password
 *    fails cleanly on the auth tag instead of being guessed at by testing
 *    whether the plaintext happens to decode as UTF-8.
 *  - Decryption in the browser uses the native WebCrypto SubtleCrypto API.
 *    No third-party script is loaded, which means no CDN dependency, no
 *    supply-chain exposure, and no disclosure of the reader's IP address
 *    to a third party.
 *  - PBKDF2 iteration count follows current OWASP guidance for
 *    PBKDF2-HMAC-SHA256. The ciphertext is published in a public HTML file,
 *    so it is subject to offline attack; the iteration count is the only
 *    thing making that expensive. Post passwords should still be strong.
 *
 * Payload format (all hex, colon-delimited):
 *     v2:<salt>:<iv>:<ciphertext||authTag>
 */

const PBKDF2_ITERATIONS = 600000;
const SALT_BYTES = 16;
const IV_BYTES = 12; // 96-bit nonce, the recommended size for GCM
const KEY_BYTES = 32; // AES-256

class StaticCryptoPassword {
  encrypt(text, password) {
    const salt = crypto.randomBytes(SALT_BYTES);
    const iv = crypto.randomBytes(IV_BYTES);
    const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, 'sha256');

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      'v2',
      salt.toString('hex'),
      iv.toString('hex'),
      Buffer.concat([ciphertext, authTag]).toString('hex'),
    ].join(':');
  }

  wrapEncryptedPost(htmlContent, password) {
    const encryptedPayload = this.encrypt(htmlContent, password);

    return `
      <div class="protected-post-container" id="protected-post-box">
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px dashed #6366f1; border-radius: 12px; padding: 2rem; text-align: center;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔒</div>
          <h3 style="margin-top: 0;">Password Protected Post</h3>
          <p style="color: #94a3b8; font-size: 0.95rem;">This post is encrypted with AES-256-GCM. Enter the password below to decrypt and view the article in your browser.</p>
          <div style="max-width: 360px; margin: 1.5rem auto 0; display: flex; gap: 0.5rem;">
            <input type="password" id="post-pass-input" placeholder="Enter post password..." style="flex: 1; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #fff; outline: none;">
            <button id="post-unlock-btn" type="button" style="padding: 0.75rem 1.25rem; border-radius: 8px; border: none; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer;">Unlock</button>
          </div>
          <div id="unlock-error" style="color: #ef4444; font-size: 0.85rem; margin-top: 0.75rem; display: none;">Invalid password. Please try again.</div>
          <div id="unlock-status" style="color: #94a3b8; font-size: 0.85rem; margin-top: 0.75rem; display: none;">Decrypting…</div>
        </div>
      </div>
      <div id="decrypted-content-box" style="display: none;"></div>

      <script>
      (function () {
        var ENCRYPTED_PAYLOAD = "${encryptedPayload}";
        var PBKDF2_ITERATIONS = ${PBKDF2_ITERATIONS};

        var btn = document.getElementById('post-unlock-btn');
        var input = document.getElementById('post-pass-input');
        var errorEl = document.getElementById('unlock-error');
        var statusEl = document.getElementById('unlock-status');

        function hexToBytes(hex) {
          var out = new Uint8Array(hex.length / 2);
          for (var i = 0; i < out.length; i++) {
            out[i] = parseInt(hex.substr(i * 2, 2), 16);
          }
          return out;
        }

        function showError(msg) {
          statusEl.style.display = 'none';
          errorEl.textContent = msg || 'Invalid password. Please try again.';
          errorEl.style.display = 'block';
        }

        async function unlockPost() {
          errorEl.style.display = 'none';

          // SubtleCrypto is only exposed in secure contexts (https:// or localhost).
          if (!window.crypto || !window.crypto.subtle) {
            showError('This browser cannot decrypt the post. A secure (HTTPS) connection is required.');
            return;
          }

          var parts = ENCRYPTED_PAYLOAD.split(':');
          if (parts.length !== 4 || parts[0] !== 'v2') {
            showError('This protected post could not be read.');
            return;
          }

          var salt = hexToBytes(parts[1]);
          var iv = hexToBytes(parts[2]);
          var data = hexToBytes(parts[3]);

          statusEl.style.display = 'block';
          btn.disabled = true;

          try {
            var baseKey = await window.crypto.subtle.importKey(
              'raw',
              new TextEncoder().encode(input.value),
              'PBKDF2',
              false,
              ['deriveKey']
            );

            var key = await window.crypto.subtle.deriveKey(
              { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
              baseKey,
              { name: 'AES-GCM', length: 256 },
              false,
              ['decrypt']
            );

            // AES-GCM verifies the auth tag, so an incorrect password throws here.
            var plainBuf = await window.crypto.subtle.decrypt(
              { name: 'AES-GCM', iv: iv },
              key,
              data
            );

            var html = new TextDecoder().decode(plainBuf);
            document.getElementById('protected-post-box').style.display = 'none';
            var box = document.getElementById('decrypted-content-box');
            box.innerHTML = html;
            box.style.display = 'block';
          } catch (e) {
            showError();
          } finally {
            btn.disabled = false;
            statusEl.style.display = 'none';
          }
        }

        btn.addEventListener('click', unlockPost);
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') unlockPost();
        });
      })();
      </script>
    `;
  }
}

module.exports = StaticCryptoPassword;
