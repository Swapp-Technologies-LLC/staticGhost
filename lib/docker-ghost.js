const { execFile } = require('child_process');

class DockerGhost {
  static checkDockerAvailable() {
    return new Promise((resolve) => {
      execFile('docker', ['--version'], (err, stdout) => {
        if (err) {
          resolve({ installed: false, message: 'Docker CLI not found' });
        } else {
          resolve({ installed: true, version: stdout.trim() });
        }
      });
    });
  }

  static getGhostContainerStatus(containerName = 'ghost-local-blog') {
    return new Promise((resolve) => {
      execFile('docker', ['ps', '-a', '--filter', `name=${containerName}`, '--format', '{{.Status}}'], (err, stdout) => {
        if (err || !stdout || !stdout.trim()) {
          resolve({ running: false, status: 'Not Created' });
        } else {
          const status = stdout.trim();
          resolve({ running: status.includes('Up'), status: status });
        }
      });
    });
  }

  static startGhostContainer(options = {}) {
    const containerName = options.containerName || 'ghost-local-blog';
    const port = String(options.port || 2368);
    const volumeName = options.volumeName || `${containerName}_data`;
    const ghostImage = options.ghostImage || 'ghost:5-alpine';

    const siteUrl = options.siteUrl ? options.siteUrl.replace(/\/$/, '') : `http://localhost:${port}`;

    return new Promise((resolve) => {
      const args = [
        'run', '-d',
        '--name', containerName,
        '-p', `${port}:2368`,
        '-v', `${volumeName}:/var/lib/ghost/content`,
        '-e', `url=${siteUrl}`,
        '-e', 'database__client=sqlite3',
        '-e', 'database__connection__filename=/var/lib/ghost/content/data/ghost.db',
        '-e', 'mail__transport=stub',
        '-e', 'mail__from=noreply@localhost',
        '-e', 'security__staffDeviceVerification=false',
        ghostImage
      ];

      execFile('docker', args, (err, stdout) => {
        if (err) {
          // If container exists, start it safely
          execFile('docker', ['start', containerName], (startErr, startStdout) => {
            if (startErr) {
              resolve({ success: false, error: startErr.message });
            } else {
              resolve({ success: true, message: `Container '${containerName}' started on port ${port}`, containerId: startStdout.trim() });
            }
          });
        } else {
          resolve({ success: true, message: `Container '${containerName}' created with persistent volume '${volumeName}' on port ${port}`, containerId: stdout.trim() });
        }
      });
    });
  }

  static stopGhostContainer(containerName = 'ghost-local-blog') {
    const fbContainerName = `${containerName}-filebrowser`;
    return new Promise((resolve) => {
      execFile('docker', ['stop', containerName], (err) => {
        execFile('docker', ['stop', fbContainerName], () => {
          if (err) resolve({ success: false, error: err.message });
          else resolve({ success: true, message: `Container '${containerName}' and file browser stopped` });
        });
      });
    });
  }

  static startFileBrowser(options = {}) {
    const containerName = options.containerName || 'ghost-local-blog';
    const fbContainerName = `${containerName}-filebrowser`;
    const port = Number(options.port || 2368);
    const fbPort = String(port + 10000);
    const volumeName = options.volumeName || `${containerName}_data`;

    return new Promise((resolve) => {
      const args = [
        'run', '-d',
        '--name', fbContainerName,
        '-p', `${fbPort}:80`,
        '-v', `${volumeName}:/srv`,
        'filebrowser/filebrowser:latest',
        '--noauth'
      ];

      execFile('docker', args, (err) => {
        if (err) {
          execFile('docker', ['start', fbContainerName], (startErr) => {
            if (startErr) {
              resolve({ success: false, error: startErr.message });
            } else {
              resolve({ success: true, message: `File browser started`, port: Number(fbPort) });
            }
          });
        } else {
          resolve({ success: true, message: `File browser created`, port: Number(fbPort) });
        }
      });
    });
  }
}

module.exports = DockerGhost;
