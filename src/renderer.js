document.addEventListener('DOMContentLoaded', async () => {
  // Profiles Management State
  let profiles = [];
  let activeProfileId = null;

  const projectSelect = document.getElementById('project-profile-select');
  const btnAddProject = document.getElementById('btn-add-project');

  // Input Elements
  const siteTitleInput = document.getElementById('site-title-input');
  const siteUrlInput = document.getElementById('site-url-input');
  const ghostUrlInput = document.getElementById('ghost-url-input');
  const dockerContainerNameInput = document.getElementById('docker-container-name-input');
  const dockerPortInput = document.getElementById('docker-port-input');
  const dockerVolumeInput = document.getElementById('docker-volume-input');
  const githubRepoInput = document.getElementById('github-repo-input');
  const giscusRepoInput = document.getElementById('giscus-repo-input');
  const layoutCodeInput = document.getElementById('layout-code-input');
  const chkAutoAffiliate = document.getElementById('chk-auto-affiliate');
  const affiliateDomainsInput = document.getElementById('affiliate-domains-input');
  const chkAutoFormRedirect = document.getElementById('chk-auto-form-redirect');
  const formRedirectUrlInput = document.getElementById('form-redirect-url-input');

  // Sync Data Volume default when Container Name is edited
  if (dockerContainerNameInput && dockerVolumeInput) {
    dockerContainerNameInput.addEventListener('input', (e) => {
      const containerName = e.target.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (containerName) {
        dockerVolumeInput.value = `ghost_vol_${containerName}`;
      }
    });
  }

  async function loadAllProfiles() {
    if (window.ghostAppAPI) {
      profiles = await window.ghostAppAPI.loadProfiles();
    } else {
      profiles = [
        { id: 'p1', name: 'Project A (Main Blog)', containerName: 'ghost-blog-proj-a', port: 2368, volumeName: 'ghost_vol_proj_a', siteTitle: 'Main Project Blog', siteUrl: 'https://user.github.io/blog-a', githubRepo: 'https://github.com/user/blog-a.git' }
      ];
    }
    renderProjectSelect();
  }

  function renderProjectSelect(preserveActive = false) {
    if (!projectSelect) return;
    const selectedId = preserveActive && activeProfileId ? activeProfileId : null;
    projectSelect.innerHTML = '';
    profiles.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      projectSelect.appendChild(opt);
    });

    if (selectedId && profiles.some(p => p.id === selectedId)) {
      activeProfileId = selectedId;
      projectSelect.value = selectedId;
    } else if (profiles.length > 0) {
      activeProfileId = profiles[0].id;
      applyActiveProfile(profiles[0]);
    }
  }

  function applyActiveProfile(p) {
    if (!p) return;
    const containerSlug = (p.containerName || `ghost-${p.id}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    if (siteTitleInput) siteTitleInput.value = p.siteTitle || p.name;
    if (siteUrlInput) siteUrlInput.value = p.siteUrl || '';
    if (ghostUrlInput) ghostUrlInput.value = `http://localhost:${p.port || 2368}`;
    if (dockerContainerNameInput) dockerContainerNameInput.value = p.containerName || `ghost-${p.id}`;
    if (dockerPortInput) dockerPortInput.value = p.port || 2368;
    if (dockerVolumeInput) dockerVolumeInput.value = p.volumeName || `ghost_vol_${containerSlug}`;
    if (githubRepoInput) githubRepoInput.value = p.githubRepo || '';
    if (giscusRepoInput) giscusRepoInput.value = p.giscusRepo || '';
    if (layoutCodeInput && p.customLayoutHtml) layoutCodeInput.value = p.customLayoutHtml;

    if (chkAutoAffiliate) chkAutoAffiliate.checked = p.enableAffiliateAutoTag !== false;
    if (affiliateDomainsInput) affiliateDomainsInput.value = p.affiliateDomains || 'amazon.com, amzn.to, bestbuy.com, shareasale.com, partnerstack.com';
    if (chkAutoFormRedirect) chkAutoFormRedirect.checked = p.enableFormRedirect === true;
    if (formRedirectUrlInput) formRedirectUrlInput.value = p.formRedirectUrl || '';

    checkDocker();
  }

  function saveCurrentProfileData() {
    const p = profiles.find(item => item.id === activeProfileId);
    if (!p) return;
    p.siteTitle = siteTitleInput.value;
    p.siteUrl = siteUrlInput.value;
    p.containerName = dockerContainerNameInput.value;
    p.port = parseInt(dockerPortInput.value) || 2368;
    p.volumeName = dockerVolumeInput.value;
    p.githubRepo = githubRepoInput.value;
    p.giscusRepo = giscusRepoInput.value;
    p.customLayoutHtml = layoutCodeInput ? layoutCodeInput.value : '';

    p.enableAffiliateAutoTag = chkAutoAffiliate ? chkAutoAffiliate.checked : true;
    p.affiliateDomains = affiliateDomainsInput ? affiliateDomainsInput.value : '';
    p.enableFormRedirect = chkAutoFormRedirect ? chkAutoFormRedirect.checked : false;
    p.formRedirectUrl = formRedirectUrlInput ? formRedirectUrlInput.value : '';

    if (window.ghostAppAPI) {
      window.ghostAppAPI.saveProfiles(profiles);
    }
  }

  if (projectSelect) {
    projectSelect.addEventListener('change', (e) => {
      saveCurrentProfileData();
      activeProfileId = e.target.value;
      const selected = profiles.find(p => p.id === activeProfileId);
      applyActiveProfile(selected);
    });
  }

  // Add Project Modal elements
  const addProjectModal = document.getElementById('add-project-modal');
  const newProjectNameInput = document.getElementById('new-project-name-input');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnConfirmAddProject = document.getElementById('btn-confirm-add-project');

  function openAddProjectModal() {
    if (addProjectModal && newProjectNameInput) {
      newProjectNameInput.value = '';
      newProjectNameInput.style.borderColor = '#334155';
      addProjectModal.style.display = 'flex';
      setTimeout(() => newProjectNameInput.focus(), 50);
    }
  }

  function closeAddProjectModal() {
    if (addProjectModal) {
      addProjectModal.style.display = 'none';
    }
  }

  function handleCreateNewProject() {
    if (!newProjectNameInput) return;
    const name = newProjectNameInput.value.trim();
    if (!name) {
      newProjectNameInput.style.borderColor = '#ef4444';
      return;
    }
    newProjectNameInput.style.borderColor = '#334155';

    saveCurrentProfileData();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const volSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const nextPort = 2368 + profiles.length;
    const newProf = {
      id: `proj_${Date.now()}`,
      name: name,
      containerName: slug,
      port: nextPort,
      volumeName: `ghost_vol_${volSlug}`,
      siteTitle: name,
      siteUrl: `https://username.github.io/${slug}`,
      githubRepo: `https://github.com/username/${slug}.git`,
      giscusRepo: '',
      customLayoutHtml: ''
    };
    profiles.push(newProf);
    if (window.ghostAppAPI) window.ghostAppAPI.saveProfiles(profiles);
    activeProfileId = newProf.id;
    renderProjectSelect(true);
    applyActiveProfile(newProf);
    closeAddProjectModal();
  }

  if (btnAddProject) {
    btnAddProject.addEventListener('click', openAddProjectModal);
  }

  if (btnCancelModal) {
    btnCancelModal.addEventListener('click', closeAddProjectModal);
  }

  if (btnConfirmAddProject) {
    btnConfirmAddProject.addEventListener('click', handleCreateNewProject);
  }

  if (newProjectNameInput) {
    newProjectNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCreateNewProject();
      if (e.key === 'Escape') closeAddProjectModal();
    });
  }

  await loadAllProfiles();

  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  const titles = {
    'tab-overview': { title: 'StaticGhost', sub: 'Manage Ghost locally or convert to static GitHub Pages with custom layout ingestion.' },
    'tab-mode-a': { title: 'Mode A: Docker + Cloudflare Tunnel', sub: 'Run Ghost in a local Docker container exposed securely via Cloudflare.' },
    'tab-mode-b': { title: 'Mode B: Static Site Exporter', sub: 'Convert Ghost posts into zero-cost, static HTML pages for GitHub Pages.' },
    'tab-ingestion': { title: 'Design & Logo Ingestion Manager', sub: 'Match your main website styling by wrapping Ghost content inside custom layout templates.' },
    'tab-affiliates': { title: 'Affiliate Links & Automation', sub: 'Tag external product links automatically with rel="sponsored nofollow" for SEO compliance.' },
    'tab-deploy': { title: 'GitHub Pages Publisher', sub: 'Deploy exported static HTML blog directly to GitHub Pages.' },
    'tab-donate': { title: 'Support Open Source Development', sub: 'Give back to the open-source community and maintainers sustaining the ecosystem.' }
  };

  function switchTab(targetId) {
    navItems.forEach(item => item.classList.toggle('active', item.dataset.tab === targetId));
    tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === targetId));
    if (titles[targetId]) {
      pageTitle.textContent = titles[targetId].title;
      pageSubtitle.textContent = titles[targetId].sub;
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  document.querySelectorAll('.switch-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });

  // Docker Container Status Check
  const dockerInfoBox = document.getElementById('docker-info-box');
  async function checkDocker() {
    if (window.ghostAppAPI && dockerInfoBox && dockerContainerNameInput) {
      const res = await window.ghostAppAPI.dockerStatus(dockerContainerNameInput.value);
      if (!res.installed) {
        dockerInfoBox.textContent = 'Docker CLI not detected. Please install Docker Desktop for Mode A.';
      } else {
        dockerInfoBox.textContent = `Container '${dockerContainerNameInput.value}': ${res.status} (Port ${dockerPortInput.value})`;
      }
    }
  }

  const btnStartDocker = document.getElementById('btn-start-docker');
  if (btnStartDocker) {
    btnStartDocker.addEventListener('click', async () => {
      if (window.ghostAppAPI) {
        dockerInfoBox.textContent = 'Starting dedicated Docker container & volume...';
        const res = await window.ghostAppAPI.dockerStart({
          containerName: dockerContainerNameInput.value,
          port: parseInt(dockerPortInput.value) || 2368,
          volumeName: dockerVolumeInput.value
        });
        dockerInfoBox.textContent = res.message || res.error;

        if (res.success) {
          const rawName = dockerContainerNameInput.value.trim();
          if (rawName) {
            const formattedName = rawName
              .replace(/^ghost[-_]/i, '')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase());

            const p = profiles.find(item => item.id === activeProfileId);
            if (p) {
              p.name = formattedName || rawName;
              p.containerName = rawName;
              p.volumeName = dockerVolumeInput.value;
              p.port = parseInt(dockerPortInput.value) || 2368;
              if (!p.siteTitle || p.siteTitle.startsWith('Project ') || p.siteTitle === 'Main Project Blog') {
                p.siteTitle = formattedName || rawName;
                if (siteTitleInput) siteTitleInput.value = p.siteTitle;
              }
            }
          }
          saveCurrentProfileData();
          renderProjectSelect(true);
        }
      }
    });
  }

  const btnUploadLayout = document.getElementById('btn-upload-layout');
  if (btnUploadLayout) {
    btnUploadLayout.addEventListener('click', async () => {
      if (window.ghostAppAPI) {
        const fileData = await window.ghostAppAPI.selectFile();
        if (fileData && fileData.content && layoutCodeInput) {
          layoutCodeInput.value = fileData.content;
          saveCurrentProfileData();
        }
      }
    });
  }


  const btnSaveProjectLayout = document.getElementById('btn-save-project-layout');
  if (btnSaveProjectLayout) {
    btnSaveProjectLayout.addEventListener('click', () => {
      saveCurrentProfileData();
      renderProjectSelect(true);
    });
  }

  const btnBrowseFiles = document.getElementById('btn-browse-files');
  if (btnBrowseFiles) {
    btnBrowseFiles.addEventListener('click', async () => {
      if (window.ghostAppAPI) {
        dockerInfoBox.textContent = 'Launching Web File Browser...';
        const res = await window.ghostAppAPI.dockerStartFileBrowser({
          containerName: dockerContainerNameInput.value,
          port: parseInt(dockerPortInput.value) || 2368,
          volumeName: dockerVolumeInput.value
        });
        dockerInfoBox.textContent = res.message || res.error;
      }
    });
  }

  const btnStopDocker = document.getElementById('btn-stop-docker');
  if (btnStopDocker) {
    btnStopDocker.addEventListener('click', async () => {
      if (window.ghostAppAPI) {
        const res = await window.ghostAppAPI.dockerStop(dockerContainerNameInput.value);
        dockerInfoBox.textContent = res.message || res.error;
      }
    });
  }

  // Export Static Site
  const btnRunExport = document.getElementById('btn-run-export');
  const exportResultBox = document.getElementById('export-result-box');
  if (btnRunExport) {
    btnRunExport.addEventListener('click', async () => {
      saveCurrentProfileData();
      exportResultBox.style.display = 'block';
      exportResultBox.textContent = '⏳ Fetching Ghost content and exporting static HTML pages...';

      const config = {
        projectName: activeProfileId,
        ghostUrl: ghostUrlInput.value,
        ghostApiKey: document.getElementById('ghost-key-input') ? document.getElementById('ghost-key-input').value : '',
        siteTitle: siteTitleInput.value,
        siteUrl: siteUrlInput.value,
        giscusRepo: giscusRepoInput.value,
        customLayoutHtml: layoutCodeInput ? layoutCodeInput.value : '',
        enableAffiliateAutoTag: document.getElementById('chk-auto-affiliate').checked,
        affiliateDomains: document.getElementById('affiliate-domains-input').value.split(',').map(d => d.trim()),
        enableFormRedirect: document.getElementById('chk-auto-form-redirect').checked,
        formRedirectUrl: document.getElementById('form-redirect-url-input').value.trim()
      };

      if (window.ghostAppAPI) {
        const res = await window.ghostAppAPI.exportStaticSite(config);
        if (res.success) {
          exportResultBox.style.color = '#34d399';
          exportResultBox.innerHTML = `✅ ${res.message}<br><small style="color:#94a3b8;">Output Directory: ${res.exportDir}</small>`;
          window.lastExportDir = res.exportDir;
        } else {
          exportResultBox.style.color = '#ef4444';
          exportResultBox.textContent = `Export error: ${res.error}`;
        }
      }
    });
  }

  // GitHub Pages Deploy
  const btnDeployNow = document.getElementById('btn-deploy-now');
  const deployResultBox = document.getElementById('deploy-result-box');
  if (btnDeployNow) {
    btnDeployNow.addEventListener('click', async () => {
      saveCurrentProfileData();
      deployResultBox.style.display = 'block';
      deployResultBox.textContent = '🚀 Committing static site and pushing to GitHub Pages...';

      const deployOptions = {
        exportDir: window.lastExportDir,
        provider: document.getElementById('deploy-provider-select') ? document.getElementById('deploy-provider-select').value : 'github',
        repoUrl: githubRepoInput.value,
        branch: document.getElementById('github-branch-input').value || 'gh-pages'
      };

      if (!deployOptions.repoUrl) {
        deployResultBox.style.color = '#ef4444';
        deployResultBox.textContent = 'Please enter your GitHub Repository URL first.';
        return;
      }

      if (window.ghostAppAPI) {
        const res = await window.ghostAppAPI.deployGithub(deployOptions);
        if (res.success) {
          deployResultBox.style.color = '#34d399';
          deployResultBox.textContent = `🎉 ${res.message}`;
        } else {
          deployResultBox.style.color = '#ef4444';
          deployResultBox.textContent = `Deployment error: ${res.error}`;
        }
      }
    });
  }

  // Global Interceptor for External Links in Electron
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.classList.contains('external-link')) {
      e.preventDefault();
      if (window.ghostAppAPI && window.ghostAppAPI.openExternal) {
        window.ghostAppAPI.openExternal(link.href);
      }
    }
  });
});
