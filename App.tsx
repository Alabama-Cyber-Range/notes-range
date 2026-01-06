import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Route, Routes, useParams, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Dashboard from './components/Dashboard';
import { storageService } from './services/storage';
import { Note, Revision, Priority } from './types';
import { Loader2, History, Menu, X, MoreHorizontal, FileText, Plus, Moon, Sun, FolderPlus, ArrowLeft, Calendar as CalendarIcon, Flag, Bell, ChevronDown } from 'lucide-react';
import { format, isToday, isPast, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameDay } from 'date-fns';

// -----------------------------------------------------------------------------
// Utilities & Custom Hooks
// -----------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const getTextFromContent = (json: any): string => {
  if (!json) return '';
  if (Array.isArray(json)) {
    return json.map(getTextFromContent).join(' ');
  }
  if (json.text) {
    return json.text;
  }
  if (json.content) {
    return getTextFromContent(json.content);
  }
  return '';
};

// -----------------------------------------------------------------------------
// UI Components
// -----------------------------------------------------------------------------

// Sleek Custom Date Picker using date-fns
const DatePicker: React.FC<{
  date: string | null;
  onChange: (date: string | null) => void;
  onClose: () => void;
}> = ({ date, onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(date ? parseISO(date) : new Date());
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startDay = getDay(startOfMonth(currentDate)); // 0 = Sunday

  const handleDayClick = (day: Date) => {
    // Set time to noon to avoid timezone switching issues on simple dates
    const d = new Date(day);
    d.setHours(12, 0, 0, 0);
    onChange(d.toISOString());
    onClose();
  };

  return (
    <div className="absolute top-10 right-0 z-50 bg-bg border border-border shadow-xl w-64 p-4 rounded-sm font-mono animate-in fade-in zoom-in-95 duration-100">
       <div className="flex justify-between items-center mb-4">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-muted text-muted-fg hover:text-fg">&lt;</button>
          <span className="font-bold text-sm">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-muted text-muted-fg hover:text-fg">&gt;</button>
       </div>
       <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-muted-fg">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
       </div>
       <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const isSelected = date && isSameDay(parseISO(date), day);
            const isTodayDate = isToday(day);
            return (
              <button 
                key={day.toISOString()} 
                onClick={() => handleDayClick(day)}
                className={`
                  w-8 h-8 flex items-center justify-center text-xs rounded-full transition-colors
                  ${isSelected ? 'bg-fg text-bg font-bold' : 'hover:bg-muted text-fg'}
                  ${!isSelected && isTodayDate ? 'border border-fg' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            )
          })}
       </div>
       <div className="mt-4 flex justify-between border-t border-border pt-2">
         <button onClick={() => { onChange(null); onClose(); }} className="text-xs text-muted-fg hover:text-red-500">Clear</button>
         <button onClick={onClose} className="text-xs text-muted-fg hover:text-fg">Close</button>
       </div>
    </div>
  );
};

// Custom Priority Dropdown
const PriorityDropdown: React.FC<{
  priority: Priority;
  onChange: (p: Priority) => void;
}> = ({ priority, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const priorityColors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-blue-500',
    none: 'text-muted-fg'
  };

  const options: Priority[] = ['high', 'medium', 'low', 'none'];

  return (
    <div className="relative" ref={wrapperRef}>
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`flex items-center gap-1 text-xs hover:bg-muted p-1 rounded transition-colors uppercase font-bold ${priorityColors[priority]}`}
       >
          <Flag size={14} />
          <span>{priority === 'none' ? 'Priority' : priority}</span>
          <ChevronDown size={10} className="opacity-50" />
       </button>
       
       {isOpen && (
         <div className="absolute top-8 left-0 z-50 w-32 bg-bg border border-border shadow-xl rounded-sm py-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col">
            {options.map(opt => (
               <button
                 key={opt}
                 onClick={() => { onChange(opt); setIsOpen(false); }}
                 className={`flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase hover:bg-muted w-full text-left transition-colors ${priorityColors[opt]}`}
               >
                 <span className={`w-2 h-2 rounded-full ${opt === 'none' ? 'border border-muted-fg' : ''} ${opt === 'high' ? 'bg-red-500' : opt === 'medium' ? 'bg-yellow-500' : opt === 'low' ? 'bg-blue-500' : ''}`} />
                 {opt}
               </button>
            ))}
         </div>
       )}
    </div>
  );
};

// Toast Notification System
interface ToastMessage {
  id: string;
  title: string;
  description: string;
  action?: () => void;
}

const ToastContext = React.createContext<{
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
}>({ addToast: () => {} });

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className="pointer-events-auto min-w-[300px] bg-bg/90 backdrop-blur border border-border p-4 shadow-2xl rounded-sm animate-slide-up flex items-start gap-3"
          >
             <Bell className="text-fg shrink-0 mt-0.5" size={16} />
             <div className="flex-1">
                <h4 className="font-bold text-sm text-fg">{t.title}</h4>
                <p className="text-xs text-muted-fg mt-1">{t.description}</p>
             </div>
             {t.action && (
               <button onClick={t.action} className="text-xs font-bold text-fg hover:underline">View</button>
             )}
             <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-muted-fg hover:text-fg">
               <X size={14} />
             </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// Component: Note View
// -----------------------------------------------------------------------------
const NoteView: React.FC<{ 
  notes: Note[]; 
  refreshNotes: () => void; 
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}> = ({ notes, refreshNotes, toggleSidebar, isSidebarOpen }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [reminderAt, setReminderAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const debouncedContent = useDebounce(content, 1000);
  const debouncedTitle = useDebounce(title, 1000);

  useEffect(() => {
    if (!id) return;
    const loadNote = async () => {
      const data = await storageService.getNote(id);
      if (data) {
        setNote(data);
        setTitle(data.title);
        setContent(data.content);
        setPriority(data.priority);
        setReminderAt(data.reminderAt);
      } else {
        navigate('/');
      }
    };
    loadNote();
  }, [id, navigate]);

  // Save Title
  useEffect(() => {
    if (!note || !id || debouncedTitle === note.title) return;
    const saveTitle = async () => {
      setStatus('saving');
      try {
        await storageService.updateNote(id, { title: debouncedTitle });
        setNote(prev => prev ? ({ ...prev, title: debouncedTitle }) : null);
        setStatus('saved');
        refreshNotes();
      } catch (err) {
        setStatus('error');
      }
    };
    saveTitle();
  }, [debouncedTitle, id]);

  // Save Content
  useEffect(() => {
    if (!note || !id || JSON.stringify(debouncedContent) === JSON.stringify(note.content)) return;
    const saveContent = async () => {
      setStatus('saving');
      try {
        await storageService.updateNote(id, { content: debouncedContent });
        setNote(prev => prev ? ({ ...prev, content: debouncedContent }) : null);
        setStatus('saved');
        refreshNotes();
      } catch (err) {
        setStatus('error');
      }
    };
    saveContent();
  }, [debouncedContent, id]);

  // Save Metadata (Priority/Reminder) immediately on change
  const handleUpdateMetadata = async (updates: Partial<Note>) => {
    if (!id) return;
    setStatus('saving');
    try {
      await storageService.updateNote(id, updates);
      setNote(prev => prev ? ({ ...prev, ...updates }) : null);
      setStatus('saved');
      refreshNotes();
    } catch(err) {
      setStatus('error');
    }
  };

  const handleFetchHistory = async () => {
    if (!id) return;
    const revs = await storageService.getRevisions(id);
    setRevisions(revs);
    setShowHistory(true);
  };

  const handleRestore = (rev: Revision) => {
    if (confirm('Restore this version? This will overwrite current changes.')) {
      setContent(rev.content);
      setShowHistory(false);
    }
  };

  const handleDelete = async () => {
     if (!id || !confirm('Delete this note?')) return;
     await storageService.deleteNote(id);
     refreshNotes();
     navigate('/');
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg h-full">
         <Loader2 className="animate-spin text-muted-fg" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-bg transition-colors duration-300 relative">
      {/* Top Bar */}
      <header className="h-12 border-b border-border flex items-center justify-between px-4 sticky top-0 bg-bg/90 backdrop-blur-md z-20 font-mono text-sm">
        <div className="flex items-center space-x-3 overflow-hidden">
          <button 
             onClick={() => navigate('/')} 
             className="p-1 hover:bg-muted rounded text-muted-fg hover:text-fg transition-colors"
             title="Back to Dashboard"
          >
             <ArrowLeft size={16} />
          </button>

          {!isSidebarOpen && (
            <button onClick={toggleSidebar} className="p-1 hover:bg-muted rounded text-muted-fg">
               <Menu size={16} />
            </button>
          )}
          <div className="flex items-center space-x-2 text-muted-fg truncate">
            <span>{note.folder || 'General'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
          
          {/* Metadata Controls */}
          <div className="flex items-center gap-2 border-r border-border pr-3">
             
             {/* Custom Priority Dropdown */}
             <PriorityDropdown 
                priority={priority} 
                onChange={(p) => {
                  setPriority(p);
                  handleUpdateMetadata({ priority: p });
                }}
             />

             {/* Reminder Date */}
             <div className="relative">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center gap-1 text-xs hover:bg-muted p-1 rounded transition-colors ${reminderAt ? 'text-fg font-bold' : 'text-muted-fg'}`}
                  title={reminderAt ? format(parseISO(reminderAt), 'PPP') : 'Set Reminder'}
                >
                   <CalendarIcon size={14} />
                   <span>{reminderAt ? format(parseISO(reminderAt), 'MMM d') : ''}</span>
                </button>
                {showDatePicker && (
                  <DatePicker 
                    date={reminderAt} 
                    onChange={(d) => {
                      setReminderAt(d);
                      handleUpdateMetadata({ reminderAt: d });
                    }} 
                    onClose={() => setShowDatePicker(false)} 
                  />
                )}
             </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-muted-fg">
            {status === 'saving' && <span className="animate-pulse">Saving...</span>}
            {status === 'saved' && <span>Saved</span>}
          </div>

          <div className="h-4 w-px bg-border"></div>

          <button onClick={handleFetchHistory} className="text-muted-fg hover:text-fg" title="History">
            <History size={16} />
          </button>
          
           <button onClick={handleDelete} className="text-muted-fg hover:text-red-500" title="Delete">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* Editor Main */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-12 md:px-24 py-8 custom-scrollbar bg-bg">
        <input 
           type="text" 
           value={title}
           onChange={(e) => setTitle(e.target.value)}
           placeholder="Untitled"
           className="w-full text-3xl font-bold text-fg placeholder-muted-fg border-none outline-none bg-transparent mb-6 max-w-4xl mx-auto block font-mono"
        />
        <Editor content={content} onChange={setContent} />
      </main>

      {/* History Drawer */}
      {showHistory && (
        <div className="absolute inset-y-0 right-0 w-80 bg-bg border-l border-border shadow-2xl z-50 flex flex-col font-mono">
          <div className="p-4 border-b border-border flex items-center justify-between">
             <h3 className="text-fg font-bold">History</h3>
             <button onClick={() => setShowHistory(false)} className="text-muted-fg hover:text-fg"><X size={16}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {revisions.map((rev) => (
                <div key={rev.id} className="border border-border p-3 hover:border-fg bg-muted/50">
                   <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-muted-fg">
                         {format(new Date(rev.savedAt), 'yyyy-MM-dd HH:mm')}
                      </div>
                      <button onClick={() => handleRestore(rev)} className="text-xs text-accent-fg hover:underline">Restore</button>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Component: Modals
// -----------------------------------------------------------------------------
const SettingsModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}> = ({ isOpen, onClose, theme, toggleTheme }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg border border-border w-full max-w-md p-6 shadow-2xl font-mono text-fg transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-muted-fg hover:text-fg"><X size={20}/></button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border border-border">
            <span className="text-fg">Appearance</span>
            <button 
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 py-1.5 bg-muted hover:bg-accent hover:text-accent-fg transition-colors rounded-sm"
            >
               {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
               <span className="text-sm uppercase">{theme} Mode</span>
            </button>
          </div>
          <div className="flex justify-between items-center p-3 border border-border">
            <span className="text-fg">Font</span>
            <span className="text-muted-fg">Monospace</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-border">
             <span className="text-fg">Version</span>
             <span className="text-muted-fg">1.2.0</span>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-fg text-bg hover:opacity-90 transition-opacity font-bold rounded-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

const CreateFolderModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  onCreate: (name: string) => void;
}> = ({ isOpen, onClose, onCreate }) => {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onCreate(folderName.trim());
      setFolderName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg border border-border w-full max-w-sm p-6 shadow-2xl font-mono text-fg transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FolderPlus size={20} />
            New Folder
          </h2>
          <button onClick={onClose} className="text-muted-fg hover:text-fg"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            autoFocus
            type="text" 
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder Name..."
            className="w-full bg-muted p-2 border border-border text-fg focus:ring-1 focus:ring-fg outline-none"
          />
          <div className="flex justify-end gap-2">
             <button type="button" onClick={onClose} className="px-4 py-2 text-muted-fg hover:text-fg">Cancel</button>
             <button type="submit" className="px-4 py-2 bg-fg text-bg hover:opacity-90 font-bold rounded-sm">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main App Component
// -----------------------------------------------------------------------------
const AppContent: React.FC = () => {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Modals
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isFolderModalOpen, setFolderModalOpen] = useState(false);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = React.useContext(ToastContext);

  // Check for upcoming reminders on load
  const hasCheckedReminders = useRef(false);

  // Theme Handling
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = useCallback(async () => {
    const [n, f] = await Promise.all([storageService.getAllNotes(), storageService.getFolders()]);
    setAllNotes(n);
    setFolders(f);
    setLoading(false);
    return n; // Return for immediate check
  }, []);

  useEffect(() => {
    loadData().then((notes) => {
      // Check reminders only once per session load
      if (!hasCheckedReminders.current && notes.length > 0) {
        const today = new Date();
        const due = notes.filter(n => {
          if (!n.reminderAt) return false;
          const d = parseISO(n.reminderAt);
          return isSameDay(d, today) || isPast(d);
        });

        if (due.length > 0) {
          addToast({
            title: `Reminder Alert`,
            description: `You have ${due.length} note${due.length === 1 ? '' : 's'} due today or overdue.`,
            action: () => setActiveFilter(null) // Go to main dashboard
          });
        }
        hasCheckedReminders.current = true;
      }
    });
  }, [loadData, addToast]);

  // Unified Filter Logic
  useEffect(() => {
    let result = allNotes;

    // 1. Search Query (Highest Priority)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(note => {
        const titleMatch = note.title.toLowerCase().includes(q);
        const contentText = getTextFromContent(note.content).toLowerCase();
        const contentMatch = contentText.includes(q);
        return titleMatch || contentMatch;
      });
    } 
    // 2. Folder/Section Filters (only if no search)
    else if (activeFilter === 'recent') {
      result = [...result].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 15);
    } else if (activeFilter) {
      result = result.filter(n => n.folder === activeFilter);
    }

    setFilteredNotes(result);
  }, [searchQuery, activeFilter, allNotes]);

  const handleCreateNote = async () => {
    const folderToUse = (activeFilter && activeFilter !== 'recent') ? activeFilter : 'General';
    const newNote = await storageService.createNote(folderToUse);
    await loadData();
    navigate(`/notes/${newNote.id}`);
    if (window.innerWidth < 768) setSidebarOpen(false);
    if (searchQuery) setSearchQuery('');
  };

  const handleCreateFolder = async (name: string) => {
    const newFolders = await storageService.createFolder(name);
    setFolders(newFolders);
  };

  const handleSelectNote = (noteId: string) => {
    navigate(`/notes/${noteId}`);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-bg text-fg font-mono">Loading_System...</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg text-fg font-mono transition-colors duration-300">
      <div 
        className={`
          fixed md:relative inset-y-0 left-0 z-30 
          w-64 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${window.innerWidth < 768 ? 'shadow-2xl' : ''}
          md:translate-x-0 md:w-64 md:flex-shrink-0
          ${!isSidebarOpen && 'md:hidden'} 
        `}
      >
        <Sidebar 
          notes={filteredNotes}
          folders={folders}
          currentNoteId={id} 
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onSelectNote={handleSelectNote}
          onCreateNote={handleCreateNote}
          onSelectFilter={setActiveFilter}
          onAddFolder={() => setFolderModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {isSidebarOpen && window.innerWidth < 768 && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col h-full w-full relative">
        <Routes>
          <Route path="/notes/:id" element={
            <NoteView 
              key={id /* KEY ADDITION FIXES STATE PERSISTENCE BUG */}
              notes={allNotes} 
              refreshNotes={loadData} 
              toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />
          } />
          <Route path="/" element={
            <div className="flex-1 flex flex-col relative h-full">
               {!isSidebarOpen && (
                 <div className="absolute top-4 left-4 z-20">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 bg-bg border border-border shadow-sm rounded text-muted-fg hover:text-fg">
                       <Menu size={20} />
                    </button>
                 </div>
               )}
               <Dashboard 
                 notes={filteredNotes} 
                 filterName={searchQuery ? `Search: "${searchQuery}"` : (activeFilter || 'All Notes')}
                 onCreateNote={handleCreateNote} 
               />
            </div>
          } />
        </Routes>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <CreateFolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Router>
  );
}