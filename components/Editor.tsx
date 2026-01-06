import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Quote, Heading1, Heading2, Heading3, CheckSquare, 
  Undo, Redo, Minus
} from 'lucide-react';

interface EditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
}

const EditorToolbar: React.FC<{ editor: any }> = ({ editor }) => {
  if (!editor) return null;

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }: any) => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`p-1.5 rounded-sm transition-colors ${
        isActive 
          ? 'bg-accent text-accent-fg' 
          : 'text-muted-fg hover:bg-muted hover:text-fg'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div 
      className="flex items-center flex-wrap gap-1 p-2 mb-4 border-b border-border sticky top-0 bg-bg/95 backdrop-blur z-10 transition-colors duration-300"
      onMouseDown={(e) => e.preventDefault()} // Prevent toolbar from stealing focus
    >
      <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
        <ToolbarButton 
          onClick={() => editor.chain().focus().undo().run()} 
          icon={Undo} 
          title="Undo" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().redo().run()} 
          icon={Redo} 
          title="Redo" 
        />
      </div>

      <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor.isActive('heading', { level: 1 })} 
          icon={Heading1} 
          title="Heading 1" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor.isActive('heading', { level: 2 })} 
          icon={Heading2} 
          title="Heading 2" 
        />
         <ToolbarButton 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor.isActive('heading', { level: 3 })} 
          icon={Heading3} 
          title="Heading 3" 
        />
      </div>

      <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          isActive={editor.isActive('bold')} 
          icon={Bold} 
          title="Bold" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          isActive={editor.isActive('italic')} 
          icon={Italic} 
          title="Italic" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleStrike().run()} 
          isActive={editor.isActive('strike')} 
          icon={Strikethrough} 
          title="Strike" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleCode().run()} 
          isActive={editor.isActive('code')} 
          icon={Code} 
          title="Code" 
        />
      </div>

      <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          isActive={editor.isActive('bulletList')} 
          icon={List} 
          title="Bullet List" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          isActive={editor.isActive('orderedList')} 
          icon={ListOrdered} 
          title="Ordered List" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleTaskList().run()} 
          isActive={editor.isActive('taskList')} 
          icon={CheckSquare} 
          title="Task List" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().toggleBlockquote().run()} 
          isActive={editor.isActive('blockquote')} 
          icon={Quote} 
          title="Blockquote" 
        />
      </div>
      
       <div className="flex items-center gap-0.5">
         <ToolbarButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()} 
          icon={Minus} 
          title="Horizontal Rule" 
        />
       </div>
    </div>
  );
};

const Editor: React.FC<EditorProps> = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content,
    editable: editable,
    autofocus: false, // Don't autofocus on mount to avoid scroll jumping
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none font-mono text-fg transition-colors duration-300 min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  // Handle external content updates
  // NOTE: We do not check editor.isFocused here because if the user clicks a different note,
  // we need the content to swap immediately. The "double click" issue is usually caused by
  // the click event fighting with a re-render or focus reset.
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      
      // Only update if content is actually different
      if (currentContent !== newContent) {
         editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  // This handler ensures that clicking anywhere in the container focuses the editor
  // if it's not already focused. We use a MouseEvent to ignore clicks that originated
  // from buttons or interactive elements to prevent fighting for focus.
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!editor.isFocused) {
      // Check if the click target is a button or input to avoid stealing focus
      // from toolbar items (though they should have stopPropagation) or bubbling events
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input')) {
        return;
      }
      editor.commands.focus();
    }
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto pb-24 font-mono cursor-text min-h-[60vh] flex flex-col" 
      onClick={handleContainerClick}
    >
      {editable && <EditorToolbar editor={editor} />}

      <EditorContent editor={editor} className="flex-1 min-h-full" />
    </div>
  );
};

export default Editor;