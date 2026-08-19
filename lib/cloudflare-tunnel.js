const { execFile } = require('child_process');

class CloudflareTunnel {
  static checkCloudflared() {
    return new Promise((resolve) => {
      execFile('cloudflared', ['--version'], (err, stdout) => {
        if (err) resolve({ installed: false, message: 'cloudflared CLI not installed' });
        else resolve({ installed: true, version: stdout.trim() });
      });
    });
  }

  static startTunnel(localPort = 2368) {
    return new Promise((resolve) => {
      const portStr = String(localPort);
      const cmd = `cloudflared tunnel --url http://localhost:${portStr}`;
      resolve({
        success: true,
        command: cmd,
        instructions: `Run command in terminal to expose local Ghost: cloudflared tunnel --url http://localhost:${portStr}`
      });
    });
  }
}

module.exports = CloudflareTunnel;
