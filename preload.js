const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ghostAppAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  loadProfiles: () => ipcRenderer.invoke('load-profiles'),
  saveProfiles: (profiles) => ipcRenderer.invoke('save-profiles', profiles),
  testGhostConnection: (options) => ipcRenderer.invoke('test-ghost-connection', options),
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  dockerStatus: (containerName, port) => ipcRenderer.invoke('docker-status', containerName, port),
  dockerStart: (options) => ipcRenderer.invoke('docker-start', options),
  dockerStop: (containerName) => ipcRenderer.invoke('docker-stop', containerName),
  dockerStartFileBrowser: (options) => ipcRenderer.invoke('docker-start-filebrowser', options),
  filebrowserStatus: (containerName, port) => ipcRenderer.invoke('filebrowser-status', containerName, port),
  filebrowserExtend: (containerName) => ipcRenderer.invoke('filebrowser-extend', containerName),
  filebrowserStop: (containerName) => ipcRenderer.invoke('filebrowser-stop', containerName),
  onFilebrowserExpired: (callback) => ipcRenderer.on('filebrowser-expired', (_event, data) => callback(data)),
  cloudflareStatus: () => ipcRenderer.invoke('cloudflare-status'),
  exportStaticSite: (config) => ipcRenderer.invoke('export-static-site', config),
  deployGithub: (options) => ipcRenderer.invoke('deploy-github', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openReadme: () => ipcRenderer.invoke('open-readme')
});
