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