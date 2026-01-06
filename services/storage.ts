import { Note, Revision } from '../types';

const STORAGE_KEY_NOTES = 'auranotes_notes';
const STORAGE_KEY_REVISIONS = 'auranotes_revisions';
const STORAGE_KEY_FOLDERS = 'auranotes_folders';

// Simulates a CUID or UUID
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class StorageService {
  private getNotesFromStorage(): Note[] {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    const notes = raw ? JSON.parse(raw) : [];
    // Migration helper: ensure existing notes have new fields
    return notes.map((n: any) => ({
      ...n,
      priority: n.priority || 'none',
      reminderAt: n.reminderAt || null
    }));
  }

  private saveNotesToStorage(notes: Note[]) {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
  }

  private getRevisionsFromStorage(): Revision[] {
    const raw = localStorage.getItem(STORAGE_KEY_REVISIONS);
    return raw ? JSON.parse(raw) : [];
  }

  private saveRevisionsToStorage(revisions: Revision[]) {
    localStorage.setItem(STORAGE_KEY_REVISIONS, JSON.stringify(revisions));
  }

  private getFoldersFromStorage(): string[] {
    const raw = localStorage.getItem(STORAGE_KEY_FOLDERS);
    // Default folders if none exist
    return raw ? JSON.parse(raw) : ['Personal', 'Work', 'Ideas'];
  }

  private saveFoldersToStorage(folders: string[]) {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  }

  async getAllNotes(): Promise<Note[]> {
    await delay(300); // Simulate network
    return this.getNotesFromStorage().sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getNote(id: string): Promise<Note | null> {
    await delay(200);
    const notes = this.getNotesFromStorage();
    return notes.find(n => n.id === id) || null;
  }

  async createNote(folder: string = 'General'): Promise<Note> {
    await delay(300);
    const notes = this.getNotesFromStorage();
    const newNote: Note = {
      id: generateId(),
      title: 'Untitled',
      content: { type: 'doc', content: [] }, // Empty Tiptap doc
      folder: folder,
      priority: 'none',
      reminderAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notes.unshift(newNote);
    this.saveNotesToStorage(notes);
    return newNote;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    await delay(100); // Fast save
    const notes = this.getNotesFromStorage();
    const index = notes.findIndex(n => n.id === id);
    
    if (index === -1) throw new Error('Note not found');

    const updatedNote = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    notes[index] = updatedNote;
    this.saveNotesToStorage(notes);

    // Create a revision if content changed essentially
    if (updates.content) {
      this.createRevision(id, updates.content);
    }

    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    await delay(300);
    const notes = this.getNotesFromStorage();
    const filtered = notes.filter(n => n.id !== id);
    this.saveNotesToStorage(filtered);
  }

  async getFolders(): Promise<string[]> {
    await delay(100);
    return this.getFoldersFromStorage();
  }

  async createFolder(name: string): Promise<string[]> {
    await delay(200);
    const folders = this.getFoldersFromStorage();
    if (!folders.includes(name)) {
      folders.push(name);
      this.saveFoldersToStorage(folders);
    }
    return folders;
  }

  // Revision History Logic
  private async createRevision(noteId: string, content: any) {
    const revisions = this.getRevisionsFromStorage();
    
    const noteRevisions = revisions.filter(r => r.noteId === noteId);
    if (noteRevisions.length > 20) {
       const oldest = noteRevisions.sort((a,b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime())[0];
       const idx = revisions.findIndex(r => r.id === oldest.id);
       if (idx !== -1) revisions.splice(idx, 1);
    }

    const newRevision: Revision = {
      id: generateId(),
      noteId,
      content,
      savedAt: new Date().toISOString()
    };
    
    revisions.push(newRevision);
    this.saveRevisionsToStorage(revisions);
  }

  async getRevisions(noteId: string): Promise<Revision[]> {
    await delay(200);
    const revisions = this.getRevisionsFromStorage();
    return revisions
      .filter(r => r.noteId === noteId)
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }
}

export const storageService = new StorageService();