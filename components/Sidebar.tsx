import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, Settings, Folder, Home, ChevronRight, ChevronDown, X, MoreHorizontal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Delete Confirmation Modal Component
const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
  theme?: string;
}> = ({ isOpen, onClose, onConfirm, folderName, theme = 'dark' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
          theme === 'dark' ? 'bg-[#2a2a2a] border border-[#3f3f3f]' : 'bg-[#bebebe] border border-[#7f7f7f]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-[#d3d3d3]' : 'text-[#151515]'
        }`}>
          Delete Folder
        </h3>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-[#7f7f7f]' : 'text-[#3f3f3f]'
        }`}>
          Are you sure you want to delete the folder "{folderName}" and all its contents? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded transition-colors ${
              theme === 'dark' 
                ? 'bg-[#3f3f3f] text-[#7f7f7f] hover:bg-[#151515] hover:text-[#d3d3d3]' 
                : 'bg-[#7f7f7f] text-[#3f3f3f] hover:bg-[#d3d3d3] hover:text-[#151515]'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Modal Component
const FolderModal: React.FC<{
  isOpen: boolean;
  title: string;
  defaultValue?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}> = ({ isOpen, title, defaultValue = '', onClose, onConfirm }) => {
  const [value, setValue] = useState(defaultValue);
  
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
      setValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2a2a2a] border border-[#3f3f3f] rounded-lg p-6 w-80">
        <h3 className="text-[#d3d3d3] font-bold mb-4 uppercase tracking-wider text-sm">{title}</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full bg-[#151515] border border-[#3f3f3f] text-[#d3d3d3] px-3 py-2 rounded text-sm outline-none focus:border-[#bebebe] transition-colors placeholder-[#7f7f7f]"
          placeholder="Enter name..."
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-transparent border border-[#404040] text-gray-400 px-4 py-2 rounded text-sm hover:text-white hover:border-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gray-200 text-black px-4 py-2 rounded text-sm font-bold hover:bg-gray-300 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

interface SidebarProps {
  notes: any[];
  folders: string[];
  currentNoteId?: string;
  activeFilter: string | null;
  searchQuery: string;
  onSearch: (query: string) => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onSelectFilter: (filter: string | null) => void;
  onAddFolder: () => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onCreateSubfolder: (parentPath: string, subfolderName: string) => void;
  onOpenSettings: () => void;
  onSignOut?: () => void;
  onDeleteFolder: (folderPath: string) => void;
  theme?: string;}

// FIX: Added explicit guard against non-array paths to stop the "not iterable" crash
const buildFolderTree = (paths: string[] = []) => {
  if (!Array.isArray(paths)) return [];
  const root: any[] = [];
  [...paths].sort().forEach(path => {
    const parts = path.split('/');
    let cur = root;
    let curPath = '';
    parts.forEach(part => {
      curPath = curPath ? `${curPath}/${part}` : part;
      let node = cur.find(n => n.name === part);
      if (!node) {
        node = { name: part, fullPath: curPath, children: [] };
        cur.push(node);
      }
      cur = node.children;
    });
  });
  return root;
};

const FolderItem: React.FC<any> = ({ node, activeFilter, onSelect, onRename, onCreateSubfolder, onDeleteFolder, depth = 0, theme = 'dark' }) => {
  const isActive = activeFilter === node.fullPath;
  const isChildActive = activeFilter?.startsWith(node.fullPath + '/');
  const [isExpanded, setIsExpanded] = useState(isChildActive);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  useEffect(() => {
    if (isChildActive) setIsExpanded(true);
  }, [isChildActive]);

  // Close menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== node.name) {
      onRename(node.fullPath, editName.trim());
    }
    setIsEditing(false);
    setEditName(node.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(node.name);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="relative">
      <div 
        className={`group flex items-center gap-2 px-3 py-1.5 text-[11px] rounded-sm cursor-pointer transition-colors uppercase tracking-tight ${
          isActive ? 'bg-[#2a2a2a] text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
        }`} 
        style={{ paddingLeft: `${12 + (depth * 12)}px` }} 
        onClick={() => !isEditing && onSelect(node.fullPath)}
      >
        {hasChildren ? (
          <div onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="hover:text-white transition-colors">
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </div>
        ) : <Folder size={11} />}
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyPress={handleKeyPress}
            className="bg-[#2a2a2a] text-white px-1 py-0.5 text-[11px] border border-[#404040] rounded outline-none focus:border-white flex-1"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <>
            <span className="truncate flex-1">{node.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#1a1a1a] rounded transition-all"
            >
              <MoreHorizontal size={10} />
            </button>
          </>
        )}
      </div>
      
      {showMenu && (
        <div 
          className="absolute right-2 top-8 bg-[#2a2a2a] border border-[#404040] rounded-sm shadow-xl z-50 w-20 py-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onCreateSubfolder(node.fullPath); setShowMenu(false); }}
            className="w-full text-left px-1.5 py-1 text-[10px] text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            New Sub
          </button>
          <button
            onClick={() => { setIsEditing(true); setShowMenu(false); }}
            className="w-full text-left px-1.5 py-1 text-[10px] text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            Rename
          </button>
          <button
            onClick={() => { 
              setShowDeleteModal(true);
              setShowMenu(false); 
            }}
            className="w-full text-left px-1.5 py-1 text-[10px] text-red-400 hover:text-red-300 hover:bg-[#1a1a1a] transition-colors"
          >
            Delete
          </button>
        </div>
      )}
      
      {hasChildren && isExpanded && node.children.map((c: any) => (
        <FolderItem key={c.fullPath} node={c} activeFilter={activeFilter} onSelect={onSelect} onRename={onRename} onCreateSubfolder={onCreateSubfolder} onDeleteFolder={onDeleteFolder} depth={depth + 1} theme={theme} />
      ))}
      
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => onDeleteFolder(node.fullPath)}
        folderName={node.name}
        theme={theme}
      />
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  notes = [], folders = [], currentNoteId, activeFilter, searchQuery, onSearch, onSelectNote, onCreateNote, onSelectFilter, onAddFolder, onRenameFolder, onCreateSubfolder, onOpenSettings, onSignOut, onDeleteFolder, theme = 'dark'
}) => {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'create' | 'subfolder';
    title: string;
    parentPath?: string;
  }>({ isOpen: false, type: 'create', title: '' });
  
  // Safe execution of tree builder
  const folderTree = buildFolderTree(folders);

  const handleCreateSubfolder = (parentPath: string) => {
    setModalState({
      isOpen: true,
      type: 'subfolder',
      title: 'Create Subfolder',
      parentPath
    });
  };

  const handleModalConfirm = (name: string) => {
    if (modalState.type === 'subfolder' && modalState.parentPath) {
      onCreateSubfolder(modalState.parentPath, name);
    } else {
      onAddFolder();
    }
    setModalState({ isOpen: false, type: 'create', title: '' });
  };

  // Filter notes based on active folder selection or search
  const filteredNotes = notes.filter(note => {
    if (searchQuery) return note.title?.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeFilter === 'recent') return true;
    if (activeFilter) return note.folder === activeFilter;
    return true;
  });

  return (
    <div className={`flex flex-col h-full w-[260px] border-r font-mono shrink-0 select-none ${
      theme === 'dark' ? 'bg-[#2a2a2a] border-[#3f3f3f]' : 'bg-[#2a2a2a] border-[#3f3f3f]'
    }`}>
      <div className="flex-1 overflow-y-auto">
        <div className={`px-3 py-3 border-b ${theme === 'dark' ? 'border-[#3f3f3f]' : 'border-[#3f3f3f]'}`}>
          <div className="flex items-center justify-between mb-3">
            <h1 className={`text-xs font-bold uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-[#d3d3d3]' : 'text-[#d3d3d3]'}`}>NOTES</h1>
            <button onClick={onCreateNote} className={`transition-colors ${
              theme === 'dark' ? 'text-[#bebebe] hover:text-[#d3d3d3]' : 'text-[#bebebe] hover:text-[#d3d3d3]'
            }`}><Plus size={18} /></button>
          </div>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#7f7f7f]' : 'text-[#7f7f7f]'}`} size={13} />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => onSearch(e.target.value)} 
              placeholder="SEARCH..." 
              className={`w-full rounded-sm py-1.5 pl-8 pr-3 text-[10px] border outline-none transition-all placeholder:text-[#7f7f7f] ${
                theme === 'dark'
                  ? 'bg-[#151515] text-[#d3d3d3] border-[#3f3f3f] focus:border-[#bebebe]'
                  : 'bg-[#151515] text-[#d3d3d3] border-[#3f3f3f] focus:border-[#bebebe]'
              }`} 
            />
          </div>
        </div>

        <div className="space-y-4 p-3">
          <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Menu</div>
          <button onClick={() => { onSelectFilter(null); navigate('/'); }} className={`w-full flex items-center space-x-2 px-3 py-2 text-[10px] rounded-sm uppercase tracking-widest ${!activeFilter && !searchQuery ? 'bg-[#2a2a2a] text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}><Home size={14} /><span>General</span></button>
          <button onClick={() => onSelectFilter('recent')} className={`w-full flex items-center space-x-2 px-3 py-2 text-[10px] rounded-sm uppercase tracking-widest ${activeFilter === 'recent' ? 'bg-[#2a2a2a] text-white font-bold' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}><Clock size={14} /><span>Recent</span></button>
          <button onClick={onOpenSettings} className="w-full flex items-center space-x-2 px-3 py-2 text-[10px] text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors uppercase tracking-widest"><Settings size={14} /><span>Settings</span></button>
        </div>

        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] flex justify-between items-center">
            <span>Folders</span>
            <Plus size={11} className="cursor-pointer text-gray-400 hover:text-white transition-colors" onClick={onAddFolder} />
          </div>
          {folders.length > 0 ? (
            folderTree.map(node => (
              <FolderItem key={node.fullPath} node={node} activeFilter={activeFilter} onSelect={(path: string) => { onSelectFilter(path); navigate('/'); }} onRename={onRenameFolder} onCreateSubfolder={handleCreateSubfolder} onDeleteFolder={onDeleteFolder} theme={theme} />
            ))
          ) : (
            <div className="px-3 py-2 text-[10px] text-gray-500 italic">No folders yet</div>
          )}
        </div>

        <div className="space-y-1 pt-4 border-t border-[#404040]">
          <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
            {searchQuery ? 'Search Results' : 'Notes List'}
          </div>
          {filteredNotes.map(note => (
            <button 
              key={note.id} 
              onClick={() => onSelectNote(note.id)} 
              className={`w-full text-left px-3 py-2 text-[11px] rounded-sm border-l-2 transition-all group ${currentNoteId === note.id ? 'border-white bg-[#2a2a2a] text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-[#2a2a2a]'}`}
            >
              <div className="font-bold truncate group-hover:tracking-wide transition-all uppercase">{note.title || 'Untitled'}</div>
              <div className="text-[8px] text-gray-500 mt-1 uppercase">
                {note.updatedAt ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : 'NEW_ENTRY'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 border-t border-[#404040] space-y-2">
        {onSignOut && (
          <button 
            onClick={onSignOut} 
            className="w-full flex items-center space-x-2 px-3 py-2 text-[10px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-sm font-bold uppercase tracking-tighter transition-colors group"
          >
            <X size={12} className="group-hover:rotate-90 transition-transform" />
            <span>Terminate Session</span>
          </button>
        )}
        <div className="text-[9px] text-gray-400 flex justify-between px-2 font-bold tracking-tighter">
          <span>SYSTEM_READY</span>
          <span>UTF-8</span>
        </div>
      </div>
      
      <FolderModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        onClose={() => setModalState({ isOpen: false, type: 'create', title: '' })}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

export default Sidebar;