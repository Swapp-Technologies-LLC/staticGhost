const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class GithubDeployer {
  constructor(options = {}) {
    this.repoUrl = options.repoUrl || '';
    this.branch = options.branch || 'gh-pages';
    this.token = options.token || '';
  }

  deployDirectory(exportDir) {
    return new Promise((resolve) => {
      if (!fs.existsSync(exportDir)) {
        return resolve({ success: false, error: 'Export directory does not exist' });
      }

      // 1. Create .nojekyll to prevent GitHub Pages from ignoring _assets
      fs.writeFileSync(path.join(exportDir, '.nojekyll'), '', 'utf8');

      // 2. Format authenticated URL if token provided
      let targetRepo = this.repoUrl;
      if (this.token && targetRepo.startsWith('https://')) {
        targetRepo = targetRepo.replace('https://', `https://${this.token}@`);
      }

      const gitCommands = [
        'git init',
        'git checkout -B ' + this.branch,
        'git add .',
        'git commit -m "Auto-deploy static Ghost blog with custom layout via Desktop Suite"',
        targetRepo ? `git remote add origin ${targetRepo} || git remote set-url origin ${targetRepo}` : '',
        targetRepo ? `git push -u origin ${this.branch} --force` : ''
      ].filter(Boolean).join(' && ');

      exec(gitCommands, { cwd: exportDir }, (err, stdout, stderr) => {
        if (err) {
          resolve({ success: false, error: err.message, logs: stderr || stdout });
        } else {
          resolve({ success: true, message: `Successfully pushed to ${this.branch}!`, logs: stdout });
        }
      });
    });
  }
}

module.exports = GithubDeployer;
