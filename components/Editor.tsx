import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Undo, Redo, Heading1, Heading2, Heading3, Bold, Italic, Strikethrough, Code, List, ListOrdered, CheckSquare, Quote, Minus } from 'lucide-react';

interface EditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
  theme?: string;
}

const EditorToolbar: React.FC<{ editor: any; theme?: string }> = ({ editor, theme = 'dark' }) => {
  if (!editor) return null;
  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }: any) => (
    <button 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }} 
      title={title} 
      className={`p-1.5 rounded-sm transition-colors ${
        isActive 
          ? theme === 'dark' ? 'bg-[#bebebe] text-[#151515]' : 'bg-[#2a2a2a] text-[#d3d3d3]'
          : theme === 'dark' ? 'text-[#7f7f7f] hover:text-[#d3d3d3] hover:bg-[#363636]' : 'text-[#3f3f3f] hover:text-[#151515] hover:bg-[#a8a8a8]'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className={`flex items-center flex-wrap gap-1 p-2 mb-4 border-b sticky top-0 backdrop-blur z-10 transition-colors ${
      theme === 'dark' 
        ? 'border-[#3f3f3f] bg-[#2a2a2a]/95' 
        : 'border-[#7f7f7f] bg-[#bebebe]/95'
    }`}>
      <div className={`flex gap-0.5 border-r pr-2 mr-1 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="Redo" />
      </div>
      <div className={`flex gap-0.5 border-r pr-2 mr-1 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="H1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="H2" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="H3" />
      </div>
      <div className={`flex gap-0.5 border-r pr-2 mr-1 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} icon={Code} title="Code" />
      </div>
      <div className={`flex gap-0.5 border-r pr-2 mr-1 ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
      }`}>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullets" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={CheckSquare} title="Tasks" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
      </div>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="Rule" />
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: "Type '/' for commands..." }), TaskList, TaskItem.configure({ nested: true })],
    content: content,
    editable: editable,
    editorProps: { attributes: { class: 'prose prose-invert prose-lg max-w-none focus:outline-none font-mono text-white min-h-[500px] text-left prose-p:text-left prose-headings:text-left' } },
    onUpdate: ({ editor }) => { onChange(editor.getJSON()); },
  });

  useEffect(() => {
    if (editor && content) {
      const cur = JSON.stringify(editor.getJSON());
      const incoming = typeof content === 'string' ? content : JSON.stringify(content);
      if (cur !== incoming) {
        editor.commands.setContent(typeof content === 'string' ? JSON.parse(content) : content);
      }
    }
  }, [content, editor]);

  // Auto-focus editor when it loads
  useEffect(() => {
    if (editor && editable) {
      // Focus the editor after a small delay to ensure it's fully mounted
      const timer = setTimeout(() => {
        editor.commands.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editor, editable]);

  // Auto-focus editor when it loads
  useEffect(() => {
    if (editor && editable) {
      // Focus the editor after a small delay to ensure it's fully mounted
      const timer = setTimeout(() => {
        editor.commands.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editor, editable]);

  if (!editor) return null;

  return (
    <div 
      className="relative w-full font-mono cursor-text flex flex-col bg-transparent min-h-full" 
      onClick={() => {
        if (editor && !editor.isFocused) {
          editor.commands.focus();
        }
      }}
    >
      {editable && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto max-h-full">
        <EditorContent editor={editor} className="prose prose-invert max-w-none p-4" />
      </div>
    </div>
  );
};

export default Editor;