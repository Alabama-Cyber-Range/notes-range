import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Clock, Plus, CornerDownRight, Folder, X, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DASHBOARD_COLORS = [
  '#005066', '#525469', '#925565', '#DC4C65',
  '#6F7372', '#A8AFB2', '#C9D1BC', '#E2D8BF',
  '#C4FF8E', '#FFB986', '#942B3A', '#AF878F',
  '#151515' // The "Reset to Default" color
];
import ColorPicker from './ColorPicker';

const Dashboard: React.FC<any> = ({ notes, folders = [], onCreateNote, onSelectSubfolder, onDeleteNote, onUpdateNote, filterName, username = 'Friend', theme = 'dark' }) => {
  const navigate = useNavigate();
  const [openColorMenu, setOpenColorMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const isFiltered = filterName && filterName !== 'All Notes' && !filterName.includes('Search');
  const subfolders = isFiltered ? folders.filter((f: any) => f.startsWith(filterName + '/') && f.split('/').length === filterName.split('/').length + 1) : [];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenColorMenu(null);
      }
    };

    if (openColorMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openColorMenu]);

  const handleUpdateColor = async (noteId: string, color: string | null) => {
    console.log('🎨 Updating note color:', { noteId, color });
    try {
      await onUpdateNote?.(noteId, { color });
      setOpenColorMenu(null);
    } catch (error) {
      console.error('Failed to update note color:', error);
    }
  };

  return (
    <div className={`flex-1 h-full overflow-y-auto p-12 pt-12 font-mono custom-scrollbar ${
      theme === 'dark' ? 'bg-[#151515] text-[#d3d3d3]' : 'bg-[#d3d3d3] text-[#151515]'
    }`}>
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tighter">{isFiltered ? filterName.split('/').pop() : `${greeting}, ${username}.`}</h1>
          <p className={`uppercase tracking-[0.3em] text-xs ${theme === 'dark' ? 'text-[#7f7f7f]' : 'text-[#3f3f3f]'}`}>Here is what you've been working on recently.</p>
        </div>

        <div className="flex gap-4">
          <button onClick={onCreateNote} className={`px-8 py-3 font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
            theme === 'dark' ? 'bg-[#bebebe] text-[#151515] hover:bg-[#d3d3d3]' : 'bg-[#2a2a2a] text-[#d3d3d3] hover:bg-[#151515]'
          }`}>
            <Plus size={14} /> New Note
          </button>
          <div className={`px-8 py-3 border text-[10px] uppercase tracking-widest flex items-center gap-2 ${
            theme === 'dark' ? 'border-[#3f3f3f] text-[#7f7f7f] bg-[#2a2a2a]' : 'border-[#7f7f7f] text-[#3f3f3f] bg-[#bebebe]'
          }`}>
            <FileText size={14} /> {notes.length} Notes
          </div>
        </div>

        {subfolders.length > 0 && (
          <div className="space-y-6">
            <h2 className={`text-xs font-bold uppercase tracking-[0.4em] flex items-center gap-2 border-b pb-4 ${
              theme === 'dark' ? 'text-[#7f7f7f] border-[#3f3f3f]' : 'text-[#3f3f3f] border-[#7f7f7f]'
            }`}><CornerDownRight size={16} /> Subfolders</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {subfolders.map((sub: any) => (
                <button key={sub} onClick={() => onSelectSubfolder(sub)} className={`p-6 flex flex-col items-center gap-3 border transition-all group ${
                  theme === 'dark' 
                    ? 'bg-[#2a2a2a] border-[#3f3f3f] hover:border-[#bebebe]' 
                    : 'bg-[#bebebe] border-[#7f7f7f] hover:border-[#2a2a2a]'
                }`}>
                  <Folder size={24} className={`transition-colors ${
                    theme === 'dark' ? 'text-[#7f7f7f] group-hover:text-[#d3d3d3]' : 'text-[#3f3f3f] group-hover:text-[#151515]'
                  }`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full text-center">{sub.split('/').pop()}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center gap-2"><Clock size={16} /> Recent Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {notes.map((note: any) => {
              const hasCustomColor = note.color && note.color !== '#151515';
              return (
              <div 
                key={note.id} 
                className={`group bg-[#2a2a2a] border border-[#404040] p-0 h-56 flex flex-col cursor-pointer hover:border-white transition-all relative overflow-hidden ${
                  hasCustomColor ? 'border-t-8' : ''
                }`}
                style={hasCustomColor ? {
                  borderTopColor: note.color
                } : {}}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote?.(note.id);
                  }}
                  className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                  title="Delete note"
                >
                  <X size={12} />
                </button>
                
                <div 
                  onClick={() => navigate(`/note/${note.id}`)}
                  className="bg-[#1a1a1a] p-6 flex-1 flex flex-col justify-between relative"
                >
                  <div className="relative z-10 space-y-4">
                    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Folder size={10} /> {note.folder?.split('/').pop() || 'General'}
                    </div>
                    <h3 className="text-xl font-bold truncate uppercase tracking-tighter group-hover:underline underline-offset-8 decoration-white/20 text-white">{note.title || 'Untitled'}</h3>
                  </div>
                  <FileText className="absolute -bottom-6 -right-6 text-white opacity-[0.03] group-hover:opacity-[0.07] transition-opacity transform rotate-12" size={140} />
                </div>
                <div className="bg-[#2a2a2a] p-4 border-t border-[#404040] flex items-center justify-between">
                  <div 
                    onClick={() => navigate(`/note/${note.id}`)}
                    className="flex-1"
                  >
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {formatDistanceToNow(new Date(note.updatedAt || note.createdAt || 0), { addSuffix: true })}
                    </div>
                  </div>
                  
                  {/* Color Picker */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenColorMenu(openColorMenu === note.id ? null : note.id);
                      }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-[#2a2a2a] text-[#7f7f7f] hover:text-[#d3d3d3]"
                      title="Change note color"
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {openColorMenu === note.id && (
                      <div
                        ref={menuRef}
                        className="absolute bottom-[calc(100%+12px)] right-0 bg-[#1a1a1a] border border-[#3f3f3f] rounded-lg shadow-xl p-3 z-50 w-48"
                      >
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {DASHBOARD_COLORS.slice(0, -1).map((hex) => (
                            <button
                              key={hex}
                              onClick={async () => await handleUpdateColor(note.id, hex)}
                              className="w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform"
                              style={{ 
                                backgroundColor: hex,
                                borderColor: note.color === hex ? '#ffffff' : '#404040'
                              }}
                              title={`Set color to ${hex}`}
                            />
                          ))}
                        </div>
                        <button 
                          onClick={async () => await handleUpdateColor(note.id, null)}
                          className="w-full py-1 text-[9px] font-bold uppercase tracking-widest bg-[#2a2a2a] hover:bg-[#3f3f3f] border border-[#3f3f3f] text-[#d3d3d3] rounded"
                        >
                          Remove Color
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;