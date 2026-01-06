import { useEffect, useState } from 'react';

// Hook to detect if app is running in Electron
export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && window.electronAPI);
  }, []);

  return isElectron;
};

// Hook to handle Electron shortcuts
export const useElectronShortcuts = (onSearch: () => void, onNewNote: () => void) => {
  const isElectron = useElectron();

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    // Listen for global search shortcut
    const handleGlobalSearch = () => onSearch();
    const handleCreateNote = () => onNewNote();

    window.electronAPI.onGlobalSearch(handleGlobalSearch);
    window.electronAPI.onCreateNewNote(handleCreateNote);

    // Cleanup
    return () => {
      window.electronAPI.removeAllListeners('global-search');
      window.electronAPI.removeAllListeners('create-new-note');
    };
  }, [isElectron, onSearch, onNewNote]);
};

// Hook for window controls
export const useElectronWindow = () => {
  const isElectron = useElectron();

  const minimizeWindow = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const maximizeWindow = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const closeWindow = () => {
    if (isElectron && window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return {
    isElectron,
    minimizeWindow,
    maximizeWindow,
    closeWindow
  };
};