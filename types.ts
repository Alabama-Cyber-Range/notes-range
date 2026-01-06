// Mimics the Prisma Schema structure provided in the prompt
export type Priority = 'high' | 'medium' | 'low' | 'none';

export interface Note {
  id: string;
  title: string;
  content: any; // JSON content from Tiptap
  folder: string | null;
  priority: Priority;
  reminderAt: string | null; // ISO Date string
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface Revision {
  id: string;
  noteId: string;
  content: any;
  savedAt: string;
}

// Helper types for the application state
export type NotePreview = Pick<Note, 'id' | 'title' | 'updatedAt' | 'folder' | 'priority' | 'reminderAt'>;

export interface EditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  editable?: boolean;
}