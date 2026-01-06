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