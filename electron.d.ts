export interface ElectronAPI {
  onGlobalSearch: (callback: () => void) => void;
  onCreateNewNote: (callback: () => void) => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  getAppVersion: () => Promise<string>;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};