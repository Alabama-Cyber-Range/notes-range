// Mimics the Prisma Schema structure provided in the prompt
export type Priority = 'high' | 'medium' | 'low' | 'none';

export interface Note {
  id: string;
  title: string;
  content: any; // JSON content from Tiptap
  folder?: string | null;
  priority?: Priority;
  color?: string; // Hex color for note categorization
  reminderAt?: string | null; // ISO Date string
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  type?: 'note' | 'folder';
  parentId?: string;
}

export interface Revision {
  id: string;
  noteId: string;
  content: any;
  savedAt: string;
}

// Helper types for the application state
export type NotePreview = Pick<Note, 'id' | 'title' | 'updatedAt' | 'folder' | 'priority' | 'color' | 'reminderAt'>;

export interface EditorProps {
  initialContent?: any;
  onChange: (content: any) => void;
  editable?: boolean;
}