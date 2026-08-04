const { exec } = require('child_process');

class CloudflareTunnel {
  static checkCloudflared() {
    return new Promise((resolve) => {
      exec('cloudflared --version', (err, stdout) => {
        if (err) resolve({ installed: false, message: 'cloudflared CLI not installed' });
        else resolve({ installed: true, version: stdout.trim() });
      });
    });
  }

  static startTunnel(localPort = 2368) {
    return new Promise((resolve) => {
      const cmd = `cloudflared tunnel --url http://localhost:${localPort}`;
      // In electron, cloudflared process can run in background
      resolve({
        success: true,
        command: cmd,
        instructions: `Run command in terminal to expose local Ghost: cloudflared tunnel --url http://localhost:${localPort}`
      });
    });
  }
}

module.exports = CloudflareTunnel;
