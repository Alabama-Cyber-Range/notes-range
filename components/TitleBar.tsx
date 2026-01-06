import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useElectronWindow } from '../hooks/useElectron';

const TitleBar: React.FC = () => {
  const { isElectron, minimizeWindow, maximizeWindow, closeWindow } = useElectronWindow();

  // Only show title bar in Electron on Windows/Linux
  // Note: process.platform is not available in renderer, so we check for Windows behavior
  const isWindows = navigator.platform.indexOf('Win') > -1;
  const isMacOS = navigator.platform.indexOf('Mac') > -1;
  
  if (!isElectron || isMacOS) {
    return null;
  }

  return (
    <div className="flex items-center justify-between h-10 bg-gray-900 border-b border-gray-700 select-none" style={{WebkitAppRegion: 'drag'}}>
      {/* App Title */}
      <div className="flex items-center px-4">
        <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 mr-2" />
        <span className="text-sm font-medium text-gray-200">AuraNotes</span>
      </div>

      {/* Window Controls */}
      <div className="flex" style={{WebkitAppRegion: 'no-drag'}}>
        <button
          onClick={minimizeWindow}
          className="flex items-center justify-center w-12 h-10 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={maximizeWindow}
          className="flex items-center justify-center w-12 h-10 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Maximize"
        >
          <Square size={14} />
        </button>
        <button
          onClick={closeWindow}
          className="flex items-center justify-center w-12 h-10 text-gray-400 hover:text-white hover:bg-red-600 transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;