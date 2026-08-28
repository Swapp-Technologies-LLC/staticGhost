const { execFile } = require('child_process');

/**
 * Docker lifecycle for per-project Ghost containers and their optional
 * file browser sidecar.
 *
 * Two things here are deliberate and easy to regress:
 *
 * 1. Container lookups use an ANCHORED filter. Docker's `name` filter is a
 *    substring regex, so `name=blog` also matches `blog-filebrowser` and
 *    `blog-archive`. Left unanchored, a project's status line concatenates
 *    every match, and `running` can report true because a *different*
 *    project happens to be up.
 *
 * 2. Published ports bind to 127.0.0.1. A bare `-p 2368:2368` binds
 *    0.0.0.0, which puts Ghost and an unauthenticated file browser on every
 *    interface — and Docker's forwarding rules bypass most host firewalls.
 *    README states ports are loopback-scoped; this is what makes that true.
 */

const { FB_IMAGE } = require('./filebrowser-timer');

const DEFAULT_CONTAINER = 'ghost-local-blog';
const FB_SUFFIX = '-filebrowser';
const FB_PORT_OFFSET = 10000;

class DockerGhost {
  /** Escape a container name for use inside Docker's Go-regexp name filter. */
  static escapeForFilter(name) {
    return String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Anchored name filter so `blog` cannot match `blog-filebrowser`. */
  static buildNameFilter(containerName) {
    return `name=^${DockerGhost.escapeForFilter(containerName)}$`;
  }

  /** Loopback-scoped port publish argument. */
  static buildPortArg(hostPort, containerPort) {
    return `127.0.0.1:${hostPort}:${containerPort}`;
  }

  static fileBrowserNameFor(containerName) {
    return `${containerName}${FB_SUFFIX}`;
  }

  static fileBrowserPortFor(port) {
    return Number(port) + FB_PORT_OFFSET;
  }

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

  /** Status of one exact container. Never merges sibling containers. */
  static getContainerStatus(containerName) {
    return new Promise((resolve) => {
      execFile(
        'docker',
        ['ps', '-a', '--filter', DockerGhost.buildNameFilter(containerName), '--format', '{{.Status}}'],
        (err, stdout) => {
          if (err || !stdout || !stdout.trim()) {
            resolve({ exists: false, running: false, status: 'Not Created' });
          } else {
            // Anchored filter should yield one line; take the first defensively.
            const status = stdout.trim().split('\n')[0].trim();
            resolve({ exists: true, running: status.startsWith('Up'), status });
          }
        }
      );
    });
  }

  static getGhostContainerStatus(containerName = DEFAULT_CONTAINER) {
    return DockerGhost.getContainerStatus(containerName);
  }

  /**
   * Status of the file browser sidecar. Reported separately so the UI can
   * give it its own line instead of splicing it into Ghost's status.
   */
  static async getFileBrowserStatus(containerName = DEFAULT_CONTAINER, port) {
    const fbName = DockerGhost.fileBrowserNameFor(containerName);
    const status = await DockerGhost.getContainerStatus(fbName);
    return {
      ...status,
      containerName: fbName,
      port: port ? DockerGhost.fileBrowserPortFor(port) : null
    };
  }

  static startGhostContainer(options = {}) {
    const containerName = options.containerName || DEFAULT_CONTAINER;
    const port = String(options.port || 2368);
    const volumeName = options.volumeName || `${containerName}_data`;
    const ghostImage = options.ghostImage || 'ghost:5-alpine';

    const siteUrl = options.siteUrl ? options.siteUrl.replace(/\/$/, '') : `http://localhost:${port}`;

    return new Promise((resolve) => {
      const args = [
        'run', '-d',
        '--name', containerName,
        '-p', DockerGhost.buildPortArg(port, 2368),
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
          // Container already exists: start the existing one.
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

  static stopGhostContainer(containerName = DEFAULT_CONTAINER) {
    const fbContainerName = DockerGhost.fileBrowserNameFor(containerName);
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
    const containerName = options.containerName || DEFAULT_CONTAINER;
    const fbContainerName = DockerGhost.fileBrowserNameFor(containerName);
    const port = Number(options.port || 2368);
    const fbPort = String(DockerGhost.fileBrowserPortFor(port));
    const volumeName = options.volumeName || `${containerName}_data`;

    return new Promise((resolve) => {
      const args = [
        'run', '-d',
        '--name', fbContainerName,
        '-p', DockerGhost.buildPortArg(fbPort, 80),
        '-v', `${volumeName}:/srv`,
        FB_IMAGE,
        '--noauth'
      ];

      execFile('docker', args, (err) => {
        if (err) {
          execFile('docker', ['start', fbContainerName], (startErr) => {
            if (startErr) {
              resolve({ success: false, error: startErr.message });
            } else {
              resolve({ success: true, message: `File browser started on port ${fbPort}`, port: Number(fbPort) });
            }
          });
        } else {
          resolve({ success: true, message: `File browser created on port ${fbPort}`, port: Number(fbPort) });
        }
      });
    });
  }
}

module.exports = DockerGhost;
