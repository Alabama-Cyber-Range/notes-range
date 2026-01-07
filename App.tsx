import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import TitleBar from './components/TitleBar';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from './amplify/data/resource';
import { Note, Folder } from './types';
import { X, ArrowLeft } from 'lucide-react';

// Note Editor with back navigation
const NoteEditor: React.FC<{
  notes: Note[];
  refreshNotes: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  theme: string;
}> = ({ notes, refreshNotes, toggleSidebar, isSidebarOpen, theme }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!id) return;
    const loadNote = async () => {
      try {
        const { data } = await client.models.Note.get({ id });
        if (data) {
          setNote(data as any);
          setTitle(data.title || '');
          setContent(data.content ? JSON.parse(data.content) : null);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to load note:', error);
        navigate('/');
      }
    };
    loadNote();
  }, [id, navigate]);

  const handleSave = async (updates: { title?: string; content?: any }) => {
    if (!note) return;
    try {
      // 1. Prepare data for Amplify (Amplify expects content as a string)
      const updateData: any = { id: note.id };
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.content !== undefined) updateData.content = JSON.stringify(updates.content);

      // 2. Perform the cloud update
      const { data: updatedNote, errors } = await client.models.Note.update(updateData);

      if (errors) {
        console.error("Amplify Update Error:", errors);
      } else if (updatedNote) {
        setNote(updatedNote as any);
        // observeQuery will handle refreshing the notes list
      }
    } catch (err) {
      console.error("Cloud sync failed:", err);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    handleSave({ title: newTitle });
  };

  const handleContentChange = (newContent: any) => {
    setContent(newContent);
    handleSave({ content: newContent });
  };

  if (!note) {
    return (
      <div className={`flex h-screen items-center justify-center ${theme === 'dark' ? 'bg-[#151515] text-[#d3d3d3]' : 'bg-[#d3d3d3] text-[#151515]'}`}>
        <div className="text-lg">Loading note...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-[#151515] text-[#d3d3d3]' : 'bg-[#d3d3d3] text-[#151515]'}`}>
      {/* Header with back button */}
      <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-[#3f3f3f]' : 'border-[#7f7f7f]'}`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              // Navigate back to the parent folder if the note has one, otherwise go to root
              if (note.folder) {
                navigate(`/?folder=${encodeURIComponent(note.folder)}`);
              } else {
                navigate('/');
              }
            }}
            className={`flex items-center space-x-2 transition-colors ${
              theme === 'dark' ? 'text-[#7f7f7f] hover:text-[#d3d3d3]' : 'text-[#3f3f3f] hover:text-[#151515]'
            }`}
          >
            <ArrowLeft size={20} />
            <span className="text-sm">
              {note.folder ? `Back to ${note.folder}` : 'Back to Notes'}
            </span>
          </button>
        </div>
        <button
          onClick={toggleSidebar}
          className={`transition-colors lg:hidden ${
            theme === 'dark' ? 'text-[#bebebe] hover:text-[#d3d3d3]' : 'text-[#2a2a2a] hover:text-[#151515]'
          }`}
        >
          ☰
        </button>
      </div>

      {/* Title */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-[#404040]' : 'border-gray-300'}`}>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={`w-full text-2xl font-bold bg-transparent border-none outline-none resize-none ${
            theme === 'dark' ? 'text-[#d3d3d3] placeholder-[#7f7f7f]' : 'text-[#151515] placeholder-[#3f3f3f]'
          }`}
          placeholder="Untitled Note"
        />
      </div>

      {/* Content Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          content={content}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
          theme={theme}
        />
      </div>
    </div>
  );
};

// Folder Creation Modal
const FolderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [folderName, setFolderName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      onConfirm(folderName.trim());
      setFolderName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onKeyDown={handleKeyPress}>
      <div className="bg-[#2a2a2a] border border-[#404040] rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold uppercase tracking-wider text-sm">New Folder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            className="w-full p-3 bg-[#1a1a1a] border border-[#404040] rounded text-white placeholder-gray-500 focus:outline-none focus:border-white"
            autoFocus
          />
          <div className="flex space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#404040] rounded text-gray-300 hover:text-white hover:border-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-white text-black rounded font-bold hover:bg-gray-200 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Settings Modal
const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  onUsernameChange: (username: string) => void;
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}> = ({ isOpen, onClose, currentUsername, onUsernameChange, currentTheme, onThemeChange }) => {
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Friend');
  const [autoSave, setAutoSave] = useState(localStorage.getItem('autoSave') !== 'false');
  const [theme, setTheme] = useState(currentTheme);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    localStorage.setItem('username', username);
    localStorage.setItem('autoSave', autoSave.toString());
    localStorage.setItem('theme', theme);
    onUsernameChange(username);
    onThemeChange(theme);
    onClose();
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onKeyDown={handleKeyPress}>
      <div className={`border rounded-lg p-6 w-96 ${currentTheme === 'dark' ? 'bg-[#2a2a2a] border-[#404040]' : 'bg-gray-100 border-gray-300'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`font-bold uppercase tracking-wider text-sm ${currentTheme === 'dark' ? 'text-white' : 'text-black'}`}>Settings</h3>
          <button onClick={onClose} className={`transition-colors ${currentTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
            <X size={16} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Username */}
          <div className="flex justify-between items-center">
            <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Display Name</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`px-3 py-1 border rounded text-sm w-32 ${
                currentTheme === 'dark'
                  ? 'bg-[#1a1a1a] border-[#404040] text-white focus:border-white'
                  : 'bg-gray-100 border-gray-300 text-black focus:border-gray-500'
              }`}
            />
          </div>

          {/* Auto Save */}
          <div className="flex justify-between items-center">
            <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Auto Save</span>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`px-3 py-1 border rounded text-xs uppercase tracking-wider transition-colors ${
                autoSave
                  ? currentTheme === 'dark' 
                    ? 'bg-white text-black border-white' 
                    : 'bg-black text-white border-black'
                  : currentTheme === 'dark'
                    ? 'bg-[#1a1a1a] border-[#404040] text-gray-300 hover:border-white'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:border-gray-500'
              }`}
            >
              {autoSave ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 border rounded transition-colors ${
              currentTheme === 'dark'
                ? 'border-[#404040] text-gray-300 hover:text-white hover:border-white'
                : 'border-gray-300 text-gray-700 hover:text-black hover:border-gray-500'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            className="flex-1 px-4 py-2 bg-white text-black rounded font-bold hover:bg-gray-200 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Create Amplify client at global scope
const client = generateClient<Schema>();

const AppContent: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('username') || 'Friend');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Handle URL-based folder filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const folderParam = urlParams.get('folder');
    if (folderParam) {
      setActiveFilter(decodeURIComponent(folderParam));
    }
  }, [location.search]);

  const isElectron = typeof window !== 'undefined' && window.electron;

  // Replace localStorage with Amplify observeQuery
  useEffect(() => {
    let subNotes: any;
    let subFolders: any;
    
    const initializeSubscriptions = async () => {
      try {
        // Verify we have an authenticated user before starting subscriptions
        const currentUser = await getCurrentUser();
        console.log('🔐 Current user verified:', currentUser.username);
        
        // Subscribe to Notes - replaces storage.getNotes()
        subNotes = client.models.Note.observeQuery().subscribe({
          next: ({ items }) => {
            console.log('📝 Notes received from Amplify:', items);
            const notesData = items.map(item => ({
              ...item,
              content: item.content ? JSON.parse(item.content) : null,
              lastModified: item.updatedAt || item.createdAt || new Date().toISOString()
            })) as Note[];
            console.log('📝 Processed notes:', notesData);
            setNotes(notesData);
            setLoading(false); // Stop loading once data is received
          },
          error: (err) => {
            console.error('Error observing notes:', err);
            setLoading(false);
          }
        });

        // Subscribe to Folders - replaces storage.getFolders()
        subFolders = client.models.Folder.observeQuery().subscribe({
          next: ({ items }) => {
            console.log('📁 Folders received from Amplify:', items);
            // Map cloud paths to your folder state - no defaults!
            const folderPaths = items.map(f => f.path || f.name);
            console.log('📁 Processed folders:', folderPaths);
            setFolders(folderPaths);
          },
          error: (err) => {
            console.error('Error observing folders:', err);
          }
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize subscriptions - user not authenticated:', error);
        setLoading(false);
      }
    };

    initializeSubscriptions();

    return () => {
      subNotes?.unsubscribe();
      subFolders?.unsubscribe();
    };
  }, []); // Empty dependency - no user check needed since auth is handled by Amplify

  useEffect(() => {
    let filtered = notes;
    
    if (activeFilter && activeFilter !== 'All Notes') {
      if (activeFilter.includes('Search: ')) {
        const searchTerm = activeFilter.replace('Search: ', '').toLowerCase();
        filtered = notes.filter(note => 
          note.title.toLowerCase().includes(searchTerm) ||
          (note.content && JSON.stringify(note.content).toLowerCase().includes(searchTerm))
        );
      } else {
        filtered = notes.filter(note => note.folder === activeFilter);
      }
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.content && JSON.stringify(note.content).toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredNotes(filtered);
  }, [notes, activeFilter, searchQuery]);

  const handleSelectNote = (noteId: string) => {
    navigate(`/note/${noteId}`);
  };

  const handleCreateNote = async (eventOrFolder?: React.MouseEvent | string) => {
    try {
      // Check if first parameter is a React event, if so ignore it
      let folderPath: string | undefined;
      if (typeof eventOrFolder === 'string') {
        folderPath = eventOrFolder;
      } else {
        // It's a React event or undefined, use current filter
        folderPath = activeFilter || 'General';
      }
      
      console.log('🚀 Creating note with folder:', folderPath);
      
      // 1. Create the note in the cloud
      const { data: newNote, errors } = await client.models.Note.create({
        title: 'New Note',
        content: JSON.stringify({ type: 'doc', content: [] }),
        folder: folderPath,
        priority: 'none'
      });

      console.log('📝 Note creation result:', { newNote, errors });

      if (errors) {
        console.error("Amplify Create Error:", errors);
        return;
      }

      // 2. Navigate immediately using the new ID
      if (newNote) {
        console.log('🎯 Navigating to note:', newNote.id);
        navigate(`/note/${newNote.id}`);
      }
    } catch (err) {
      console.error("Failed to create note in Amplify:", err);
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    try {
      // Create the folder in the cloud with proper error handling
      const { data: newFolder, errors } = await client.models.Folder.create({
        name: folderName,
        path: folderName
      });

      if (errors) {
        console.error("Amplify Folder Create Error:", errors);
        return;
      }

      if (newFolder) {
        setShowFolderModal(false);
        // observeQuery will automatically update the folders list
      }
    } catch (err) {
      console.error('Failed to create folder in Amplify:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { errors } = await client.models.Note.delete({ id: noteId });
      
      if (errors) {
        console.error("Amplify Delete Note Error:", errors);
      }
      // observeQuery will automatically update the notes list
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<{color: string | null}>) => {
    try {
      console.log('🔄 Updating note in Amplify:', { noteId, updates });
      
      const { data, errors } = await client.models.Note.update({ 
        id: noteId,
        ...updates
      });
      
      if (errors) {
        console.error("❌ Amplify Update Note Error:", errors);
        return false;
      }
      
      if (data) {
        console.log('✅ Note updated successfully:', data);
        return true;
      }
      
      // observeQuery will automatically update the notes list
    } catch (err) {
      console.error('❌ Failed to update note:', err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1a1a] text-white">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden font-mono flex-col ${currentTheme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-50 text-black'}`}>
      {isElectron && <TitleBar />}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`w-64 flex-shrink-0 ${!isSidebarOpen ? 'hidden' : ''}`}>
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
            onAddFolder={() => setShowFolderModal(true)}
            onRenameFolder={async (oldName: string, newName: string) => {
              try {
                // Find the existing folder and update it
                const { data: folders } = await client.models.Folder.list({
                  filter: { name: { eq: oldName } }
                });
                
                if (folders && folders.length > 0) {
                  await client.models.Folder.update({
                    id: folders[0].id,
                    name: newName,
                    path: newName
                  });
                  
                  // Update active filter if it matches
                  if (activeFilter === oldName) {
                    setActiveFilter(newName);
                  }
                }
              } catch (error) {
                console.error('Failed to rename folder:', error);
              }
            }}
            onCreateSubfolder={async (parentFolder: string, subfolderName: string) => {
              try {
                const subfolderPath = `${parentFolder}/${subfolderName}`;
                await client.models.Folder.create({
                  name: subfolderName,
                  path: subfolderPath,
                  parentPath: parentFolder
                });
              } catch (error) {
                console.error('Failed to create subfolder:', error);
              }
            }}
            onOpenSettings={() => setShowSettingsModal(true)}
            onSignOut={() => console.log('Sign out')}
            onDeleteFolder={async (folderPath: string) => {
              try {
                // Find and delete the folder
                const { data: folders } = await client.models.Folder.list({
                  filter: { path: { eq: folderPath } }
                });
                
                if (folders && folders.length > 0) {
                  await client.models.Folder.delete({ id: folders[0].id });
                  
                  // Clear filter if we deleted the active folder
                  if (activeFilter === folderPath || activeFilter?.startsWith(folderPath + '/')) {
                    setActiveFilter(null);
                    navigate('/');
                  }
                }
              } catch (error) {
                console.error('Failed to delete folder:', error);
              }
            }}
            theme={currentTheme}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  notes={filteredNotes}
                  folders={folders}
                  onSelectNote={handleSelectNote}
                  onCreateNote={handleCreateNote}
                  onDeleteNote={handleDeleteNote}
                  onUpdateNote={handleUpdateNote}
                  onSelectSubfolder={(folder) => setActiveFilter(folder)}
                  filterName={activeFilter}
                  toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                  isSidebarOpen={isSidebarOpen}
                  username={currentUsername}
                  theme={currentTheme}
                />
              }
            />
            <Route
              path="/note/:id"
              element={
                <NoteEditor
                  notes={notes}
                  refreshNotes={() => {}} // No longer needed - observeQuery handles updates
                  toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                  isSidebarOpen={isSidebarOpen}
                  theme={currentTheme}
                />
              }
            />
          </Routes>
        </div>
      </div>
      
      {/* Modals */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onConfirm={handleCreateFolder}
      />
      
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        currentUsername={currentUsername}
        onUsernameChange={setCurrentUsername}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;