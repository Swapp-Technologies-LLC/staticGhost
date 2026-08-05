const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostAppAPI', {
  loadProfiles: () => ipcRenderer.invoke('load-profiles'),
  saveProfiles: (profiles) => ipcRenderer.invoke('save-profiles', profiles),
  testGhostConnection: (options) => ipcRenderer.invoke('test-ghost-connection', options),
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  dockerStatus: (containerName) => ipcRenderer.invoke('docker-status', containerName),
  dockerStart: (options) => ipcRenderer.invoke('docker-start', options),
  dockerStop: (containerName) => ipcRenderer.invoke('docker-stop', containerName),
  dockerStartFileBrowser: (options) => ipcRenderer.invoke('docker-start-filebrowser', options),
  cloudflareStatus: () => ipcRenderer.invoke('cloudflare-status'),
  exportStaticSite: (config) => ipcRenderer.invoke('export-static-site', config),
  deployGithub: (options) => ipcRenderer.invoke('deploy-github', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openReadme: () => ipcRenderer.invoke('open-readme')
});
