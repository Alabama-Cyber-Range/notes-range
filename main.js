const { app, BrowserWindow, globalShortcut, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Create the browser window with modern styling
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    frame: process.platform !== 'win32', // Frameless on Windows for custom title bar
    backgroundColor: '#0f0f0f', // Dark theme background to prevent white flicker
    icon: path.join(__dirname, 'assets/icon.png'), // You'll need to add an icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false // Don't show until ready to prevent visual glitches
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, 'dist/index.html')}`; // Built app
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  
  // Set up global shortcuts
  setupGlobalShortcuts();
  
  // Set up application menu
  setupAppMenu();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

function setupGlobalShortcuts() {
  // Global shortcut for quick note creation (Cmd/Ctrl + Shift + N)
  globalShortcut.register('CmdOrCtrl+Shift+N', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // Send event to renderer to create new note
      mainWindow.webContents.send('create-new-note');
    }
  });

  // Global shortcut for search (Cmd/Ctrl + K)
  globalShortcut.register('CmdOrCtrl+K', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      // Send event to renderer to open search
      mainWindow.webContents.send('open-search');
    }
  });

  // Quick show/hide (Cmd/Ctrl + Shift + A for AuraNotes)
  globalShortcut.register('CmdOrCtrl+Shift+A', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function setupAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('create-new-note');
          }
        },
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            mainWindow?.webContents.send('open-search');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for communication with renderer process
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('is-dev', () => {
  return isDev;
});

// Security: prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});