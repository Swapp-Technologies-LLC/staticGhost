const { exec } = require('child_process');
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

    const gitCommands = [
      'git init',
      'git checkout -B ' + this.branch,
      'git add .',
      'git commit -m "Auto-deploy static Ghost blog via Ghost Desktop Suite"',
      targetRepo ? `git remote add origin ${targetRepo} || git remote set-url origin ${targetRepo}` : '',
      targetRepo ? `git push -u origin ${this.branch} --force` : ''
    ].filter(Boolean).join(' && ');

    exec(gitCommands, { cwd: exportDir }, (err, stdout, stderr) => {
      if (err) {
        resolve({ success: false, error: err.message, logs: stderr || stdout });
      } else {
        resolve({ success: true, message: `Successfully published to ${this.provider.toUpperCase()} (${this.branch})!`, logs: stdout });
      }
    });
  }

  deployNetlify(exportDir, resolve) {
    const tokenFlag = this.token ? `--auth=${this.token}` : '';
    const siteFlag = this.siteId ? `--site=${this.siteId}` : '';
    const cmd = `npx -y netlify-cli deploy --prod --dir=. ${tokenFlag} ${siteFlag}`;

    exec(cmd, { cwd: exportDir }, (err, stdout) => {
      if (err) resolve({ success: false, error: `Netlify deploy error: ${err.message}` });
      else resolve({ success: true, message: 'Successfully deployed static site to Netlify!', logs: stdout });
    });
  }

  deployCloudflarePages(exportDir, resolve) {
    const projName = this.siteId || 'ghost-static-blog';
    const cmd = `npx -y wrangler pages deploy . --project-name=${projName}`;

    exec(cmd, { cwd: exportDir }, (err, stdout) => {
      if (err) resolve({ success: false, error: `Cloudflare Pages deploy error: ${err.message}` });
      else resolve({ success: true, message: 'Successfully deployed static site to Cloudflare Pages!', logs: stdout });
    });
  }
}

module.exports = CloudDeployer;
