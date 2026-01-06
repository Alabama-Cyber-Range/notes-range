const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app-version'),
  isDev: () => ipcRenderer.invoke('is-dev'),
  
  // Global shortcuts listeners
  onCreateNewNote: (callback) => {
    ipcRenderer.on('create-new-note', callback);
  },
  
  onOpenSearch: (callback) => {
    ipcRenderer.on('open-search', callback);
  },
  
  // Cleanup listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose a safer way to handle window controls for custom title bar (Windows/Linux)
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});