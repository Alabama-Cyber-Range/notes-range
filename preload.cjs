const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Global shortcuts
  onGlobalSearch: (callback) => ipcRenderer.on('global-search', callback),
  onCreateNewNote: (callback) => ipcRenderer.on('create-new-note', callback),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Cleanup
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});