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
      const cmd = `cloudflared tunnel --url http://127.0.0.1:${portStr}`;
      resolve({
        success: false,
        implemented: false,
        isProFeature: true,
        command: cmd,
        message: `Automated 1-click background tunnel management is a StaticGhost Pro feature. Run '${cmd}' in terminal to start a manual tunnel.`,
        instructions: `Run command in terminal to expose local Ghost: ${cmd}`
      });
    });
  }
}

module.exports = CloudflareTunnel;
