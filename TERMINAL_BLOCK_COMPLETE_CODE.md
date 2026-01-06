# Terminal Block Component - Complete Code Reference

This document contains all the code needed to implement the macOS-style terminal block component with CodeMirror integration for Tiptap editor.

## 📦 Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@codemirror/lang-javascript": "^6.2.4",
    "@codemirror/state": "^6.5.3",
    "@codemirror/view": "^6.39.9",
    "@uiw/codemirror-theme-vscode": "^4.25.4",
    "@uiw/react-codemirror": "^4.25.4",
    "@tiptap/core": "^2.2.4",
    "@tiptap/react": "^2.2.4",
    "lucide-react": "^0.294.0"
  }
}
```

## 📁 File Structure

```
components/
  └── TerminalBlock.tsx
extensions/
  └── Terminal.tsx
components/
  └── Editor.tsx (updated)
index.html (updated)
package.json (updated)
```

---

## 1. TerminalBlock Component

**File:** `components/TerminalBlock.tsx`

```tsx
import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { Terminal as TerminalIcon } from 'lucide-react';
import { keymap } from '@codemirror/view';

interface TerminalBlockProps {
  node: {
    attrs: {
      content?: string;
    };
  };
  updateAttributes: (attrs: { content: string }) => void;
  editor?: any;
  getPos?: () => number | undefined;
}

const TerminalBlock: React.FC<TerminalBlockProps> = ({ node, updateAttributes, editor, getPos }) => {
  const content = node.attrs.content || '$ ';
  const containerRef = useRef<HTMLDivElement>(null);
  const codeMirrorViewRef = useRef<any>(null);

  const focusCodeMirror = useCallback(() => {
    // Find CodeMirror editor element and focus it
    // CodeMirror 6 uses .cm-editor as the focusable element
    const cmEditor = containerRef.current?.querySelector('.cm-editor') as HTMLElement;
    if (cmEditor) {
      // Make it focusable if it isn't already
      if (!cmEditor.hasAttribute('tabindex')) {
        cmEditor.setAttribute('tabindex', '0');
      }
      // Focus the editor
      cmEditor.focus();
    }
  }, []);

  // Auto-focus CodeMirror when terminal is created
  useEffect(() => {
    // Small delay to ensure CodeMirror is mounted
    const timer = setTimeout(() => {
      focusCodeMirror();
    }, 200);
    return () => clearTimeout(timer);
  }, [focusCodeMirror]);

  const handleChange = useCallback((value: string) => {
    // Ensure each line starts with "$ " if it doesn't already
    const lines = value.split('\n');
    const processedLines = lines.map((line, index) => {
      // First line should always start with "$ "
      if (index === 0 && !line.startsWith('$ ')) {
        return '$ ' + line;
      }
      // Other lines should start with "$ " if they're empty or don't have it
      if (index > 0 && line.trim() !== '' && !line.startsWith('$ ')) {
        return '$ ' + line;
      }
      return line;
    });
    
    updateAttributes({ content: processedLines.join('\n') });
  }, [updateAttributes]);

  // Extension to handle Enter key to add "$ " prompt
  const enterHandler = useMemo(() => {
    return keymap.of([
      {
        key: 'Enter',
        run: (view) => {
          const { state } = view;
          const { selection } = state;
          const insertPos = selection.main.head;
          const insertText = '\n$ ';
          
          // Insert newline with "$ " prompt
          const transaction = state.update({
            changes: {
              from: insertPos,
              insert: insertText,
            },
            selection: {
              anchor: insertPos + insertText.length,
            },
          });
          
          view.dispatch(transaction);
          
          return true; // Handled - prevent default
        },
      },
    ]);
  }, []);

  return (
    <NodeViewWrapper className="terminal-node-wrapper my-6" contentEditable={false}>
      <div className="rounded-lg overflow-hidden border border-[#333] shadow-2xl bg-[#1e1e1e]">
        {/* MacOS Window Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#1a1a1a]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c940]" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#888] font-mono uppercase tracking-widest">
            <TerminalIcon size={12} />
            <span>System Terminal</span>
          </div>
          <div className="w-10" />
        </div>

        {/* CodeMirror Editor */}
        <div 
          ref={containerRef}
          className="p-2"
          onClick={(e) => {
            // Stop propagation to prevent Editor's handleContainerClick from stealing focus
            e.stopPropagation();
            // Focus CodeMirror
            focusCodeMirror();
          }}
          onMouseDown={(e) => {
            // Prevent Tiptap from handling the click
            e.stopPropagation();
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <CodeMirror
              value={content}
              theme={vscodeDark}
              height="150px"
              editable={true}
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
              }}
              extensions={[enterHandler]}
              onChange={handleChange}
              style={{ 
                fontSize: '14px', 
                fontFamily: 'Consolas, "Lucida Console", "Courier New", monospace',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default memo(TerminalBlock);
```

---

## 2. Terminal Extension

**File:** `extensions/Terminal.tsx`

```tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import TerminalBlock from '../components/TerminalBlock';

export interface TerminalOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    terminal: {
      /**
       * Insert a terminal block
       */
      setTerminal: (options?: { content?: string }) => ReturnType;
    };
  }
}

export const Terminal = Node.create<TerminalOptions>({
  name: 'terminal',
  group: 'block',
  atom: true, // Treat as one single unit so Tiptap doesn't try to split it
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      content: { 
        default: '$ ',
        parseHTML: element => element.getAttribute('data-content') || '$ ',
        renderHTML: attributes => {
          if (!attributes.content) {
            return {};
          }
          return {
            'data-content': attributes.content,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ 
      tag: 'div[data-type="terminal"]',
      getAttrs: (node) => {
        const element = node as HTMLElement;
        return {
          content: element.getAttribute('data-content') || '$ ',
        };
      },
    }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div', 
      mergeAttributes(
        this.options.HTMLAttributes, 
        HTMLAttributes, 
        { 
          'data-type': 'terminal',
          'data-content': node.attrs.content || '$ ',
        }
      )
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TerminalBlock);
  },

  addCommands() {
    return {
      setTerminal:
        (options = {}) =>
        ({ commands, chain }) => {
          const initialContent = options.content || '$ ';
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                content: initialContent,
              },
            })
            .focus()
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-t': () => this.editor.commands.setTerminal(),
    };
  },
});
```

---

## 3. Updated Editor Component

**File:** `components/Editor.tsx`

**Key changes:**
1. Import `TerminalExtension` and `TerminalIcon`
2. Add `TerminalExtension` to extensions array
3. Add terminal button to toolbar

```tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Terminal as TerminalExtension } from '../extensions/Terminal';
import { 
  Bold, Italic, Strikethrough, Code, List, ListOrdered, 
  Quote, Heading1, Heading2, Heading3, CheckSquare, 
  Undo, Redo, Minus, Terminal as TerminalIcon
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
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* ... existing toolbar buttons ... */}
      
      <div className="flex items-center gap-0.5">
        <ToolbarButton 
          onClick={() => editor.chain().focus().setHorizontalRule().run()} 
          icon={Minus} 
          title="Horizontal Rule" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().setTerminal().run()} 
          icon={TerminalIcon} 
          title="Insert Terminal Block" 
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
      TerminalExtension, // Add this line
    ],
    content: content,
    editable: editable,
    autofocus: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none focus:outline-none font-mono text-fg transition-colors duration-300 min-h-[500px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  // ... rest of component remains the same ...
};

export default Editor;
```

---

## 4. Updated index.html Styles

**File:** `index.html`

Add these styles to the `<style>` section:

```css
/* Terminal Block Styles */
.terminal-content {
  color: #d4d4d4;
}
.terminal-content [data-node-view-content] {
  outline: none;
  min-height: 100px;
  display: block;
  width: 100%;
}
.terminal-content [data-node-view-content]:focus {
  outline: none;
}
.terminal-node-wrapper {
  position: relative;
}
.content-editable-area {
  white-space: pre-wrap !important;
  word-break: break-all;
}

/* CodeMirror Terminal Styles */
.terminal-node-wrapper .cm-editor {
  outline: none !important;
}
.terminal-node-wrapper .cm-editor.cm-focused {
  outline: none !important;
}
.terminal-node-wrapper .cm-content {
  padding: 8px !important;
  min-height: 120px;
}
.terminal-node-wrapper .cm-scroller {
  overflow: auto;
}
```

---

## 5. Updated package.json

**File:** `package.json`

Add these dependencies:

```json
{
  "dependencies": {
    "@codemirror/lang-javascript": "^6.2.4",
    "@codemirror/state": "^6.5.3",
    "@codemirror/view": "^6.39.9",
    "@uiw/codemirror-theme-vscode": "^4.25.4",
    "@uiw/react-codemirror": "^4.25.4"
  }
}
```

---

## 🚀 Installation Steps

1. **Install dependencies:**
   ```bash
   npm install @codemirror/lang-javascript @codemirror/state @codemirror/view @uiw/codemirror-theme-vscode @uiw/react-codemirror
   ```

2. **Create the files:**
   - Create `components/TerminalBlock.tsx` with the code from section 1
   - Create `extensions/Terminal.tsx` with the code from section 2
   - Update `components/Editor.tsx` with the changes from section 3
   - Update `index.html` with the styles from section 4
   - Update `package.json` with dependencies from section 5

3. **Usage:**
   - Click the terminal icon in the editor toolbar
   - Or use keyboard shortcut: `Cmd/Ctrl + Alt + T`
   - Type in the terminal - each new line will automatically start with `$ `

---

## ✨ Features

- ✅ macOS-style window frame with traffic light controls
- ✅ CodeMirror editor for terminal input
- ✅ Automatic `$ ` prompt on each new line
- ✅ Enter key handler for new lines
- ✅ Focus management to prevent Tiptap from stealing focus
- ✅ Fully integrated with Tiptap as a custom node
- ✅ Dark theme matching the app design

---

## 📝 Notes

- The terminal block is stored as an atomic node in Tiptap
- Content is stored in the `content` attribute of the node
- The component uses CodeMirror 6 for the editor functionality
- All styling uses Tailwind CSS classes
- The terminal automatically focuses when created

---

**Last Updated:** Based on `feature/add-terminal-block-v2` branch

