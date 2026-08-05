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
  const layoutIndexCodeInput = document.getElementById('layout-index-code-input');
  const layoutPostCodeInput = document.getElementById('layout-post-code-input');
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
    profiles.forEach(p => {
      if (!p.postTemplates) {
        p.postTemplates = [];
      }
    });
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
    const ghostKeyInput = document.getElementById('ghost-key-input');
    if (ghostKeyInput) ghostKeyInput.value = p.ghostApiKey || '';
    const customOutputDirInput = document.getElementById('custom-output-dir-input');
    if (customOutputDirInput) customOutputDirInput.value = p.outputDir || '';
    if (dockerContainerNameInput) dockerContainerNameInput.value = p.containerName || `ghost-${p.id}`;
    if (dockerPortInput) dockerPortInput.value = p.port || 2368;
    if (dockerVolumeInput) dockerVolumeInput.value = p.volumeName || `ghost_vol_${containerSlug}`;
    if (githubRepoInput) githubRepoInput.value = p.githubRepo || '';
    if (giscusRepoInput) giscusRepoInput.value = p.giscusRepo || '';
    if (layoutIndexCodeInput) {
      layoutIndexCodeInput.value = p.customIndexLayoutHtml || p.customLayoutHtml || '';
    }
    if (layoutPostCodeInput) {
      layoutPostCodeInput.value = p.customPostLayoutHtml || p.customLayoutHtml || '';
    }

    if (chkAutoAffiliate) chkAutoAffiliate.checked = p.enableAffiliateAutoTag !== false;
    if (affiliateDomainsInput) affiliateDomainsInput.value = p.affiliateDomains || 'amazon.com, amzn.to, bestbuy.com, shareasale.com, partnerstack.com';
    if (chkAutoFormRedirect) chkAutoFormRedirect.checked = p.enableFormRedirect === true;
    if (formRedirectUrlInput) formRedirectUrlInput.value = p.formRedirectUrl || '';
    renderPostTemplatesList(p);

    checkDocker();
  }

  function saveCurrentProfileData() {
    const p = profiles.find(item => item.id === activeProfileId);
    if (!p) return;
    p.siteTitle = siteTitleInput.value;
    p.siteUrl = siteUrlInput.value;
    const ghostKeyInput = document.getElementById('ghost-key-input');
    if (ghostKeyInput) p.ghostApiKey = ghostKeyInput.value;
    const customOutputDirInput = document.getElementById('custom-output-dir-input');
    if (customOutputDirInput) p.outputDir = customOutputDirInput.value.trim();
    p.containerName = dockerContainerNameInput.value;
    p.port = parseInt(dockerPortInput.value) || 2368;
    p.volumeName = dockerVolumeInput.value;
    p.githubRepo = githubRepoInput.value;
    p.giscusRepo = giscusRepoInput.value;
    p.customIndexLayoutHtml = layoutIndexCodeInput ? layoutIndexCodeInput.value : '';
    p.customPostLayoutHtml = layoutPostCodeInput ? layoutPostCodeInput.value : '';
    p.customLayoutHtml = p.customPostLayoutHtml; // fallback for backwards compatibility

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
      customLayoutHtml: '',
      customIndexLayoutHtml: '',
      customPostLayoutHtml: '',
      postTemplates: []
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
    const headerLogo = document.getElementById('app-header-logo');
    if (headerLogo) {
      headerLogo.style.display = (targetId === 'tab-overview') ? 'block' : 'none';
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

  const btnUploadLayoutIndex = document.getElementById('btn-upload-layout-index');
  if (btnUploadLayoutIndex) {
    btnUploadLayoutIndex.addEventListener('click', async () => {
      if (window.ghostAppAPI) {
        const fileData = await window.ghostAppAPI.selectFile();
        if (fileData && fileData.content && layoutIndexCodeInput) {
          layoutIndexCodeInput.value = fileData.content;
          saveCurrentProfileData();
        }
      }
    });
  }

  const btnUploadLayoutPost = document.getElementById('btn-upload-layout-post');
  if (btnUploadLayoutPost) {
    btnUploadLayoutPost.addEventListener('click', async () => {
      if (window.ghostAppAPI) {
        const fileData = await window.ghostAppAPI.selectFile();
        if (fileData && fileData.content && layoutPostCodeInput) {
          layoutPostCodeInput.value = fileData.content;
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

  // Ghost Connection Test
  const btnTestGhost = document.getElementById('btn-test-ghost');
  const connectionStatusBox = document.getElementById('connection-status-box');
  if (btnTestGhost && connectionStatusBox) {
    btnTestGhost.addEventListener('click', async () => {
      saveCurrentProfileData();
      connectionStatusBox.style.display = 'block';
      connectionStatusBox.style.color = '#fff';
      connectionStatusBox.textContent = '⏳ Testing connection to Ghost...';

      if (window.ghostAppAPI) {
        const url = ghostUrlInput ? ghostUrlInput.value : 'http://localhost:2368';
        const key = document.getElementById('ghost-key-input') ? document.getElementById('ghost-key-input').value : '';
        const res = await window.ghostAppAPI.testGhostConnection({ baseUrl: url, apiKey: key });
        if (res.success) {
          connectionStatusBox.style.color = '#34d399';
          connectionStatusBox.textContent = `✅ ${res.message}`;
        } else {
          connectionStatusBox.style.color = '#ef4444';
          connectionStatusBox.textContent = `❌ Connection failed: ${res.message || res.error}`;
        }
      } else {
        connectionStatusBox.style.color = '#ef4444';
        connectionStatusBox.textContent = '❌ Ghost API not available in this environment.';
      }
    });
  }

  // Select Custom Output Directory
  const btnSelectOutputDir = document.getElementById('btn-select-output-dir');
  const customOutputDirInput = document.getElementById('custom-output-dir-input');
  if (btnSelectOutputDir && customOutputDirInput) {
    btnSelectOutputDir.addEventListener('click', async () => {
      if (window.ghostAppAPI && window.ghostAppAPI.selectDirectory) {
        const folderPath = await window.ghostAppAPI.selectDirectory();
        if (folderPath) {
          customOutputDirInput.value = folderPath;
          saveCurrentProfileData();
        }
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
      exportResultBox.style.color = '#fff';
      exportResultBox.textContent = '⏳ Verifying connection to Ghost container...';

      const url = ghostUrlInput.value;
      const key = document.getElementById('ghost-key-input') ? document.getElementById('ghost-key-input').value : '';

      if (window.ghostAppAPI) {
        if (!key) {
          exportResultBox.style.color = '#ff9f1c';
          exportResultBox.innerHTML = '⚠️ <strong>No Content API Key configured.</strong> Exporting layout using local mock posts...';
          await new Promise(r => setTimeout(r, 1500));
        } else {
          const testRes = await window.ghostAppAPI.testGhostConnection({ baseUrl: url, apiKey: key });
          if (!testRes.success) {
            exportResultBox.style.color = '#ef4444';
            exportResultBox.innerHTML = `❌ <strong>Export Failed: Cannot connect to Ghost.</strong><br>
              <span style="font-size:0.9rem;">Reason: ${testRes.message || 'Unauthorized or container offline'}.</span><br>
              <small style="color:#94a3b8; display:block; margin-top:0.5rem;">
                Please verify that your Ghost container is started on port ${dockerPortInput.value || 2368} and that your Content API Key is correct.
              </small>`;
            return;
          }
        }
      }

      exportResultBox.style.color = '#fff';
      exportResultBox.textContent = '⏳ Connection verified! Fetching Ghost content and exporting static HTML pages...';

      const config = {
        projectName: activeProfileId,
        ghostUrl: url,
        ghostApiKey: key,
        outputDir: document.getElementById('custom-output-dir-input') ? document.getElementById('custom-output-dir-input').value.trim() : '',
        siteTitle: siteTitleInput.value,
        siteUrl: siteUrlInput.value,
        giscusRepo: giscusRepoInput.value,
        customIndexLayoutHtml: layoutIndexCodeInput ? layoutIndexCodeInput.value : '',
        customPostLayoutHtml: layoutPostCodeInput ? layoutPostCodeInput.value : '',
        customLayoutHtml: layoutPostCodeInput ? layoutPostCodeInput.value : '',
        postTemplates: (profiles.find(p => p.id === activeProfileId)?.postTemplates || []),
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

  // Post Templates UI & Event Listeners
  function renderPostTemplatesList(p) {
    const tbody = document.getElementById('post-templates-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!p || !p.postTemplates || p.postTemplates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="padding:1rem; text-align:center; color:var(--text-muted);">No custom templates configured. Using default post.html.</td></tr>';
      return;
    }

    p.postTemplates.forEach((t, idx) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      
      const tdName = document.createElement('td');
      tdName.style.padding = '0.75rem 1rem';
      tdName.textContent = t.name;
      tr.appendChild(tdName);

      const tdKey = document.createElement('td');
      tdKey.style.padding = '0.75rem 1rem';
      tdKey.innerHTML = `<code class="badge">${t.key}</code>`;
      tr.appendChild(tdKey);

      const tdActions = document.createElement('td');
      tdActions.style.padding = '0.75rem 1rem';
      tdActions.style.textAlign = 'right';

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn btn-outline btn-sm';
      btnEdit.style.fontSize = '0.75rem';
      btnEdit.style.padding = '0.2rem 0.5rem';
      btnEdit.style.marginRight = '0.5rem';
      btnEdit.textContent = '✏️ Edit';
      btnEdit.addEventListener('click', () => openTemplateModal(idx));
      tdActions.appendChild(btnEdit);

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn btn-danger btn-sm';
      btnDelete.style.fontSize = '0.75rem';
      btnDelete.style.padding = '0.2rem 0.5rem';
      btnDelete.textContent = '🗑️ Delete';
      btnDelete.addEventListener('click', () => handleDeleteTemplate(idx));
      tdActions.appendChild(btnDelete);

      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
  }

  function openTemplateModal(index) {
    const modal = document.getElementById('template-modal');
    const modalTitle = document.getElementById('template-modal-title');
    const modalIndex = document.getElementById('template-modal-index');
    const nameInput = document.getElementById('template-name-input');
    const keyInput = document.getElementById('template-key-input');
    const htmlInput = document.getElementById('template-html-input');

    if (!modal) return;
    
    const p = profiles.find(item => item.id === activeProfileId);
    if (!p) return;

    nameInput.style.borderColor = '#334155';
    keyInput.style.borderColor = '#334155';

    if (index >= 0) {
      const t = p.postTemplates[index];
      modalTitle.textContent = '✏️ Edit Custom Template';
      modalIndex.value = index;
      nameInput.value = t.name || '';
      keyInput.value = t.key || '';
      htmlInput.value = t.html || '';
    } else {
      modalTitle.textContent = '➕ Add Custom Template';
      modalIndex.value = '-1';
      nameInput.value = '';
      keyInput.value = '';
      htmlInput.value = '';
    }
    modal.style.display = 'flex';
  }

  function handleDeleteTemplate(index) {
    const p = profiles.find(item => item.id === activeProfileId);
    if (!p || !p.postTemplates) return;
    if (confirm(`Are you sure you want to delete the custom template "${p.postTemplates[index].name}"?`)) {
      p.postTemplates.splice(index, 1);
      saveCurrentProfileData();
      renderPostTemplatesList(p);
    }
  }

  const btnAddPostTemplate = document.getElementById('btn-add-post-template');
  if (btnAddPostTemplate) {
    btnAddPostTemplate.addEventListener('click', () => openTemplateModal(-1));
  }

  const btnCancelTemplateModal = document.getElementById('btn-cancel-template-modal');
  if (btnCancelTemplateModal) {
    btnCancelTemplateModal.addEventListener('click', () => {
      document.getElementById('template-modal').style.display = 'none';
    });
  }

  const btnSaveTemplateModal = document.getElementById('btn-save-template-modal');
  if (btnSaveTemplateModal) {
    btnSaveTemplateModal.addEventListener('click', () => {
      const p = profiles.find(item => item.id === activeProfileId);
      if (!p) return;

      const idxVal = document.getElementById('template-modal-index').value;
      const nameInput = document.getElementById('template-name-input');
      const keyInput = document.getElementById('template-key-input');
      const htmlInput = document.getElementById('template-html-input');

      const name = nameInput.value.trim();
      const key = keyInput.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      const html = htmlInput.value;

      if (!name) {
        nameInput.style.borderColor = '#ef4444';
        return;
      }
      if (!key) {
        keyInput.style.borderColor = '#ef4444';
        return;
      }

      if (!p.postTemplates) p.postTemplates = [];

      const index = parseInt(idxVal);
      if (index >= 0) {
        p.postTemplates[index] = { id: p.postTemplates[index].id, name, key, html };
      } else {
        p.postTemplates.push({ id: `tmpl_${Date.now()}`, name, key, html });
      }

      saveCurrentProfileData();
      renderPostTemplatesList(p);
      document.getElementById('template-modal').style.display = 'none';
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
