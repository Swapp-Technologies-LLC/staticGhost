const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

class CloudDeployer {
  constructor(options = {}) {
    this.provider = options.provider || 'github'; // 'github', 'netlify', 'cloudflare', 'render', 'vercel'
    this.repoUrl = options.repoUrl || '';
    this.branch = options.branch || 'gh-pages';
    this.token = options.token || '';
    this.siteId = options.siteId || '';
  }

  deployDirectory(exportDir) {
    return new Promise((resolve) => {
      if (!fs.existsSync(exportDir)) {
        return resolve({ success: false, error: 'Export directory does not exist' });
      }

      // Ensure .nojekyll for static routing
      fs.writeFileSync(path.join(exportDir, '.nojekyll'), '', 'utf8');

      if (this.provider === 'netlify') {
        return this.deployNetlify(exportDir, resolve);
      } else if (this.provider === 'cloudflare') {
        return this.deployCloudflarePages(exportDir, resolve);
      } else {
        return this.deployGitRepo(exportDir, resolve);
      }
    });
  }

  deployGitRepo(exportDir, resolve) {
    let targetRepo = this.repoUrl;
    if (this.token && targetRepo.startsWith('https://')) {
      targetRepo = targetRepo.replace('https://', `https://${this.token}@`);
    }

    // Parameterized sequence of git operations
    const runGit = (args) => {
      return new Promise((res, rej) => {
        execFile('git', args, { cwd: exportDir }, (err, stdout, stderr) => {
          if (err) rej(new Error(stderr || stdout || err.message));
          else res(stdout);
        });
      });
    };

    (async () => {
      try {
        await runGit(['init']);
        await runGit(['checkout', '-B', this.branch]);
        await runGit(['add', '.']);
        await runGit(['commit', '-m', 'Auto-deploy static Ghost blog via StaticGhost']);

        if (targetRepo) {
          try {
            await runGit(['remote', 'add', 'origin', targetRepo]);
          } catch (e) {
            await runGit(['remote', 'set-url', 'origin', targetRepo]);
          }
          const pushLogs = await runGit(['push', '-u', 'origin', this.branch, '--force']);
          resolve({ success: true, message: `Successfully published to ${this.provider.toUpperCase()} (${this.branch})!`, logs: pushLogs });
        } else {
          resolve({ success: true, message: `Git repository initialized on branch ${this.branch}`, logs: '' });
        }
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    })();
  }

  deployNetlify(exportDir, resolve) {
    const args = ['-y', 'netlify-cli', 'deploy', '--prod', '--dir=.'];
    if (this.token) args.push(`--auth=${this.token}`);
    if (this.siteId) args.push(`--site=${this.siteId}`);

    execFile('npx', args, { cwd: exportDir }, (err, stdout) => {
      if (err) resolve({ success: false, error: `Netlify deploy error: ${err.message}` });
      else resolve({ success: true, message: 'Successfully deployed static site to Netlify!', logs: stdout });
    });
  }

  deployCloudflarePages(exportDir, resolve) {
    const projName = this.siteId || 'ghost-static-blog';
    const args = ['-y', 'wrangler', 'pages', 'deploy', '.', `--project-name=${projName}`];

    execFile('npx', args, { cwd: exportDir }, (err, stdout) => {
      if (err) resolve({ success: false, error: `Cloudflare Pages deploy error: ${err.message}` });
      else resolve({ success: true, message: 'Successfully deployed static site to Cloudflare Pages!', logs: stdout });
    });
  }
}

module.exports = CloudDeployer;
