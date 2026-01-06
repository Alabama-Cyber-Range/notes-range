import React, { useState } from 'react';
import { Plus, Search, Clock, Settings, Folder, Home, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Note } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  notes: Note[];
  folders: string[];
  currentNoteId?: string;
  activeFilter: string | null;
  searchQuery: string;
  onSearch: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onSelectFilter: (filter: string | null) => void;
  onAddFolder: () => void;
  onOpenSettings: () => void;
  className?: string;
}

// Tree structure interface
interface FolderNode {
  name: string;
  fullPath: string;
  children: FolderNode[];
}

// Helper to build tree from flat paths
const buildFolderTree = (paths: string[]): FolderNode[] => {
  const root: FolderNode[] = [];
  const map: Record<string, FolderNode> = {};

  // Sort paths to ensure parents are processed first if possible, 
  // though simple string split logic below handles it regardless.
  const sortedPaths = [...paths].sort();

  sortedPaths.forEach(path => {
    const parts = path.split('/');
    // We only care about the top level for the root array
    // But we need to construct the chain
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      // Check if we already have this node at this level
      let existingNode = currentLevel.find(n => n.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          fullPath: currentPath,
          children: []
        };
        currentLevel.push(existingNode);
      }

      currentLevel = existingNode.children;
    });
  });

  return root;
};

// Recursive Folder Component
const FolderItem: React.FC<{
  node: FolderNode;
  activeFilter: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}> = ({ node, activeFilter, onSelect, depth = 0 }) => {
  // Check if this folder or any of its children is active to auto-expand
  const isActive = activeFilter === node.fullPath;
  const isChildActive = activeFilter?.startsWith(node.fullPath + '/');
  
  const [isExpanded, setIsExpanded] = useState(isChildActive);
  
  // React to external filter changes to auto-expand
  React.useEffect(() => {
    if (isChildActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isChildActive]);

  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div 
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm transition-colors cursor-pointer select-none group
          ${isActive ? 'bg-accent text-accent-fg font-bold' : 'text-muted-fg hover:bg-muted hover:text-fg'}
        `}
        style={{ paddingLeft: `${12 + (depth * 12)}px` }}
        onClick={() => onSelect(node.fullPath)}
      >
         {hasChildren ? (
           <button 
             onClick={(e) => {
               e.stopPropagation();
               setIsExpanded(!isExpanded);
             }}
             className="p-0.5 hover:bg-fg/10 rounded"
           >
             {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
           </button>
         ) : (
           <Folder size={14} />
         )}
         
         <span className="truncate flex-1">{node.name}</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="border-l border-border ml-5 my-1">
          {node.children.map(child => (
            <FolderItem 
              key={child.fullPath} 
              node={child} 
              activeFilter={activeFilter} 
              onSelect={onSelect} 
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  notes, 
  folders,
  currentNoteId, 
  activeFilter,
  searchQuery,
  onSearch,
  onSelectNote, 
  onCreateNote,
  onSelectFilter,
  onAddFolder,
  onOpenSettings,
  className = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const folderTree = buildFolderTree(folders);

  const handleGoHome = () => {
    onSelectFilter(null);
    onSearch(''); 
    navigate('/');
  };

  const handleRecent = () => {
    onSelectFilter('recent');
    onSearch('');
    navigate('/');
  };

  const handleFolderClick = (path: string) => {
    onSelectFilter(path);
    onSearch('');
    navigate('/');
  };

  // Sort notes: High priority first, then date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className={`flex flex-col h-full bg-bg border-r border-border ${className} font-mono transition-colors duration-300`}>
      {/* Header */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleGoHome}>
             <div className="w-5 h-5 bg-fg flex items-center justify-center text-bg text-[10px] font-bold">
               A
             </div>
             <span className="font-bold text-fg text-sm tracking-tight group-hover:text-accent-fg transition-colors">Notes</span>
          </div>
          <button 
            onClick={onCreateNote}
            className="p-1 hover:bg-muted rounded-sm transition-colors text-muted-fg hover:text-fg"
            title="New Note"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg group-hover:text-fg transition-colors" size={14} />
           <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search notes..." 
              className="w-full bg-muted hover:bg-accent focus:bg-bg focus:ring-1 focus:ring-fg transition-all rounded-sm py-1.5 pl-8 pr-3 text-sm text-fg placeholder-muted-fg border border-border focus:border-fg outline-none"
           />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar">
        
        {/* Quick Links */}
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-xs font-bold text-muted-fg uppercase tracking-widest">
            Menu
          </div>
          <button 
            onClick={handleGoHome}
            className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm rounded-sm transition-colors ${
              location.pathname === '/' && activeFilter === null && !searchQuery
                ? 'bg-accent text-accent-fg font-bold' 
                : 'text-muted-fg hover:bg-muted hover:text-fg'
            }`}
          >
            <Home size={15} />
            <span>General</span>
          </button>
          <button 
            onClick={handleRecent}
            className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm rounded-sm transition-colors ${
              activeFilter === 'recent' 
                ? 'bg-accent text-accent-fg font-bold' 
                : 'text-muted-fg hover:bg-muted hover:text-fg'
            }`}
          >
            <Clock size={15} />
            <span>Recent</span>
          </button>
           <button 
            onClick={onOpenSettings}
            className="w-full flex items-center space-x-2 px-3 py-1.5 text-sm text-muted-fg hover:bg-muted hover:text-fg rounded-sm transition-colors"
           >
            <Settings size={15} />
            <span>Settings</span>
          </button>
        </div>

        {/* Folders Accordion */}
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-xs font-bold text-muted-fg uppercase tracking-widest flex justify-between items-center group">
            <span>Folders</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder();
              }} 
              className="text-muted-fg hover:text-fg hover:bg-muted p-1 rounded transition-colors cursor-pointer" 
              title="Create New Folder"
            >
               <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
             {folderTree.map(node => (
               <FolderItem 
                 key={node.fullPath} 
                 node={node} 
                 activeFilter={activeFilter} 
                 onSelect={handleFolderClick} 
               />
             ))}
          </div>
        </div>

        {/* Filtered Notes List */}
        <div className="space-y-0.5 pt-4 border-t border-border">
           <div className="px-3 py-1 text-xs font-bold text-muted-fg uppercase tracking-widest">
            {searchQuery ? `Search: "${searchQuery}"` : (activeFilter === 'recent' ? 'Recent Notes' : (activeFilter ? activeFilter.split('/').pop() : 'All Notes'))}
          </div>
          
          {sortedNotes.length === 0 && (
             <div className="px-3 py-4 text-xs text-muted-fg font-mono italic">
                {searchQuery ? '-- No matches --' : '-- Empty --'}
             </div>
          )}

          {sortedNotes.map(note => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`w-full group flex items-start space-x-2 px-3 py-2 text-sm rounded-sm transition-all duration-200 border-l-2 ${
                currentNoteId === note.id 
                  ? 'border-fg bg-muted text-fg' 
                  : 'border-transparent text-muted-fg hover:bg-muted hover:text-fg'
              }`}
            >
              <div className="flex flex-col items-start overflow-hidden text-left w-full">
                <div className="flex items-center w-full gap-2">
                   {note.priority === 'high' && <span className="priority-dot priority-high shrink-0" title="High Priority" />}
                   <span className={`truncate w-full font-medium ${note.priority === 'high' ? 'text-fg font-bold' : ''}`}>{note.title || 'Untitled'}</span>
                </div>
                <span className="text-[10px] text-muted-fg truncate w-full">
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </button>
          ))}
        </div>

      </div>
      
      {/* Footer */}
      <div className="p-2 border-t border-border text-[10px] text-muted-fg flex justify-between">
         <span>Ln 1, Col 1</span>
         <span>UTF-8</span>
      </div>
    </div>
  );
};

export default Sidebar;