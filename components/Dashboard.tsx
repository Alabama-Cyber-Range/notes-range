import React from 'react';
import { Note } from '../types';
import { formatDistanceToNow, isToday, isPast, isSameDay, parseISO } from 'date-fns';
import { FileText, Clock, Folder, Search, Calendar, AlertCircle, Plus, CornerDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  notes: Note[];
  folders?: string[];
  onCreateNote: () => void;
  onCreateSubfolder?: (parentPath: string) => void;
  onSelectSubfolder?: (path: string) => void;
  userName?: string;
  filterName?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  notes, 
  folders = [],
  onCreateNote,
  onCreateSubfolder, 
  onSelectSubfolder,
  userName = "Friend", 
  filterName 
}) => {
  const navigate = useNavigate();
  
  // Get Greeting based on time
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const displayNotes = [...notes].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  // Filter Due Today or Overdue
  const today = new Date();
  const dueNotes = notes.filter(n => {
    if (!n.reminderAt) return false;
    const due = parseISO(n.reminderAt);
    return isToday(due) || (isPast(due) && !isSameDay(due, today));
  }).sort((a, b) => new Date(a.reminderAt!).getTime() - new Date(b.reminderAt!).getTime());

  const isFiltered = filterName && filterName !== 'All Notes' && !filterName.includes('Search');
  const isSearch = filterName && filterName.includes('Search');
  const currentFolder = isFiltered ? filterName : null;

  const title = isFiltered ? filterName!.split('/').pop() : (isSearch ? filterName : `${greeting}, ${userName}.`);
  const subtitle = isFiltered 
    ? `Folder: ${filterName}` 
    : "Here is what you've been working on recently.";

  // Find Subfolders
  const subfolders = currentFolder 
    ? folders.filter(f => {
        // Must start with current folder path + '/'
        // And must not contain more '/' after that (direct children only)
        // actually showing deep descendants is fine, but usually UI shows direct children.
        // Let's do direct children.
        const prefix = currentFolder + '/';
        return f.startsWith(prefix) && f.split('/').length === currentFolder.split('/').length + 1;
      })
    : [];

  return (
    <div className="flex-1 h-full overflow-y-auto bg-bg text-fg p-8 custom-scrollbar font-mono transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="space-y-2">
          {isFiltered && (
            <div className="flex items-center gap-2 text-muted-fg text-sm mb-2">
              <Folder size={14} />
              <span>{filterName?.split('/').slice(0, -1).join(' / ') || 'Root'} /</span>
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-fg truncate">{title}</h1>
          <p className="text-muted-fg">{subtitle}</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
           <button 
             onClick={onCreateNote}
             className="px-6 py-3 bg-fg text-bg hover:opacity-90 transition-opacity font-bold text-sm flex items-center gap-2"
           >
             <Plus size={16} />
             <span>New Note</span>
           </button>
           
           {isFiltered && onCreateSubfolder && (
             <button 
               onClick={() => onCreateSubfolder(currentFolder!)}
               className="px-6 py-3 border border-border hover:bg-muted transition-colors font-bold text-sm flex items-center gap-2"
             >
               <Folder size={16} />
               <span>New Subfolder</span>
             </button>
           )}

           <div className="px-6 py-3 border border-border text-muted-fg text-sm flex items-center gap-2">
             <FileText size={16} />
             <span>{notes.length} Note{notes.length !== 1 ? 's' : ''}</span>
           </div>
        </div>
        
        {/* Subfolders Grid */}
        {subfolders.length > 0 && (
          <div className="space-y-4">
             <h2 className="text-xl font-bold flex items-center gap-2 text-fg border-b border-border pb-2">
                <CornerDownRight size={20} />
                <span>Subfolders</span>
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {subfolders.map(sub => {
                  const subName = sub.split('/').pop();
                  return (
                    <button
                      key={sub}
                      onClick={() => onSelectSubfolder && onSelectSubfolder(sub)}
                      className="bg-muted hover:bg-accent hover:text-accent-fg p-4 rounded-sm border border-border flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                       <Folder size={32} />
                       <span className="font-bold text-sm truncate w-full text-center">{subName}</span>
                    </button>
                  )
                })}
             </div>
          </div>
        )}

        {/* Due Today Section */}
        {dueNotes.length > 0 && !isFiltered && (
          <div className="space-y-4">
             <h2 className="text-xl font-bold flex items-center gap-2 text-fg">
                <AlertCircle size={20} className="text-red-500" />
                <span>Due Today & Overdue</span>
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {dueNotes.map(note => (
                 <div 
                   key={note.id}
                   onClick={() => navigate(`/notes/${note.id}`)}
                   className="group bg-muted/50 border border-l-4 border-l-red-500 border-border p-4 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                 >
                    <div>
                      <h4 className="font-bold text-fg">{note.title || 'Untitled'}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-fg mt-1">
                        <Calendar size={12} />
                        <span className={isPast(parseISO(note.reminderAt!)) && !isToday(parseISO(note.reminderAt!)) ? "text-red-500 font-bold" : ""}>
                          {isToday(parseISO(note.reminderAt!)) ? 'Today' : 'Overdue'}
                        </span>
                      </div>
                    </div>
                    <div className={`priority-dot priority-${note.priority}`} />
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* Notes Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-fg">
            {isFiltered && filterName?.includes('Search') ? <Search size={20} /> : <Clock size={20} />}
            <span>{isFiltered ? 'Notes' : 'Recent Activity'}</span>
          </h2>
          
          {displayNotes.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center text-muted-fg">
              <p>No notes found in this view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="group bg-muted border border-border p-4 h-48 flex flex-col justify-between cursor-pointer hover:border-fg transition-all duration-200 relative overflow-hidden"
                >
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-fg uppercase tracking-wider">
                        <Folder size={12} />
                        <span className="truncate max-w-[80px]">{note.folder?.split('/').pop() || 'General'}</span>
                      </div>
                      <div className={`priority-dot priority-${note.priority}`} title={`Priority: ${note.priority}`} />
                    </div>
                    <h3 className="font-bold text-lg text-fg truncate leading-tight group-hover:underline decoration-1 underline-offset-4">
                      {note.title || 'Untitled'}
                    </h3>
                  </div>
                  
                  <div className="text-xs text-muted-fg flex justify-between items-end relative z-10">
                     <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
                  </div>

                  {/* Decorative Background Icon */}
                  <FileText className="absolute -bottom-4 -right-4 text-border opacity-10 group-hover:opacity-20 transition-opacity transform rotate-12" size={100} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;