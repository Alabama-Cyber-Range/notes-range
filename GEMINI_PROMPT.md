# Prompt for Gemini: Fix Tiptap Terminal Node Enter Key Handler

## Problem Description

I have a Tiptap custom node extension that creates a terminal block component. When a user presses Enter inside the terminal block, the newline is created but the cursor immediately jumps back to the first line instead of staying on the newly created line. The user wants:

1. When Enter is pressed inside the terminal, create a new line with "$ " prompt
2. The cursor should stay on the new line (after "$ "), not jump back to the first line
3. All new lines should stay INSIDE the terminal node, not create paragraphs outside

## Current Architecture

### Tech Stack
- **Tiptap** (rich text editor framework)
- **React** with TypeScript
- **NodeView** pattern using `ReactNodeViewRenderer`
- Terminal node has `content: 'text*'` (only text content, no block nodes)

### File Structure

1. **`extensions/Terminal.tsx`** - Tiptap extension definition
   - Defines the terminal node type
   - Has `addKeyboardShortcuts()` with Enter handler
   - Uses `ReactNodeViewRenderer` to render React component

2. **`components/TerminalBlock.tsx`** - React component for terminal UI
   - Uses `NodeViewWrapper` and `NodeViewContent` from `@tiptap/react`
   - Renders MacOS-style terminal window
   - `NodeViewContent` is the editable area

3. **`components/Editor.tsx`** - Main editor component
   - Registers Terminal extension in `useEditor` extensions array

## Current Implementation

### Extension Enter Handler (extensions/Terminal.tsx, lines 78-106)

```typescript
Enter: ({ editor }) => {
  const { state } = editor;
  const { selection } = state;
  
  // Check if we're inside a terminal node by walking up the node hierarchy
  for (let depth = selection.$anchor.depth; depth >= 0; depth--) {
    const node = selection.$anchor.node(depth);
    if (node.type.name === 'terminal') {
      // We're in a terminal - insert newline with "$ "
      const currentPos = selection.$anchor.pos;
      const textToInsert = '\n$ ';
      
      // Use transaction to insert text
      const tr = state.tr;
      tr.insertText(textToInsert, currentPos);
      
      // Set cursor after inserted text
      const newPos = currentPos + textToInsert.length;
      tr.setSelection(TextSelection.create(tr.doc, newPos));
      
      // Apply transaction
      editor.view.dispatch(tr);
      
      return true; // Handled - prevent default
    }
  }
  
  return false; // Not in terminal - use default behavior
}
```

### Terminal Node Configuration

```typescript
export const Terminal = Node.create<TerminalOptions>({
  name: 'terminal',
  group: 'block',
  content: 'text*',  // Only text content allowed
  selectable: true,
  atom: false,
  
  addNodeView() {
    return ReactNodeViewRenderer((props) => {
      return <TerminalBlock {...props} />;
    }, {
      contentDOMElementTag: 'div',
    });
  },
  // ... other config
});
```

### TerminalBlock Component Structure

```typescript
const TerminalBlock: React.FC<TerminalBlockProps> = ({ 
  node,
  updateAttributes,
  editor,
  getPos
}) => {
  return (
    <NodeViewWrapper>
      <div> {/* Terminal window frame */}
        <div> {/* Title bar with traffic lights */}
        <div> {/* Content area */}
          <NodeViewContent /> {/* This is the editable area */}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
```

## The Problem

**Current Behavior:**
1. User types in terminal: `$ command1`
2. User presses Enter
3. New line is created: `$ command1\n$ `
4. **BUG**: Cursor jumps back to first line instead of staying after `$ ` on the new line
5. When user types, text appears on first line instead of new line

**Expected Behavior:**
1. User types in terminal: `$ command1`
2. User presses Enter
3. New line is created: `$ command1\n$ `
4. Cursor should stay positioned after `$ ` on the new line
5. When user types, text should appear on the new line

## What Needs to Be Fixed

The issue appears to be with cursor positioning after the transaction is applied. The `TextSelection.create(tr.doc, newPos)` might not be working correctly, or the position calculation might be wrong.

### Key Requirements:

1. **Position Calculation**: Need to ensure `newPos` is calculated correctly relative to the terminal node's content area
2. **Selection Creation**: The `TextSelection.create()` might need to use `tr.doc.resolve(newPos)` to ensure valid position
3. **Transaction Timing**: May need to ensure the transaction is applied atomically
4. **NodeView Sync**: The React NodeView might be re-rendering and resetting cursor position

### Potential Issues to Investigate:

1. **Position Calculation**: 
   - `currentPos` might be relative to document, but we need to ensure it's within terminal node
   - After `tr.insertText()`, document structure changes, so `newPos` calculation might be off

2. **Selection Validity**:
   - `TextSelection.create(tr.doc, newPos)` might fail if `newPos` is invalid
   - Should use `tr.doc.resolve(newPos)` to get a valid ResolvedPos first

3. **NodeView Re-render**:
   - After transaction, NodeView might re-render and reset cursor
   - May need to use `requestAnimationFrame` or ensure selection persists

4. **Content DOM Element**:
   - The `NodeViewContent` creates a contentEditable div
   - Cursor might be getting reset by browser or Tiptap's content sync

## Suggested Approach

1. **Verify Position Calculation**:
   - Log `currentPos`, `newPos`, and terminal node boundaries
   - Ensure `newPos` is within terminal content bounds

2. **Use ResolvedPos for Selection**:
   ```typescript
   const resolvedPos = tr.doc.resolve(newPos);
   tr.setSelection(TextSelection.create(tr.doc, resolvedPos.pos));
   ```

3. **Add Validation**:
   - Check if `newPos` is valid before creating selection
   - Ensure it's within terminal node content area

4. **Consider Using Commands Instead**:
   - Try using `editor.commands.insertContent()` and `editor.commands.setTextSelection()` instead of raw transactions
   - Commands might handle position updates better

5. **Debug NodeView Updates**:
   - Check if NodeView's `update()` method is being called and resetting selection
   - May need to preserve selection in NodeView update

## Files to Modify

1. **`extensions/Terminal.tsx`** - Fix the Enter keyboard shortcut handler
2. **`components/TerminalBlock.tsx`** - May need to add selection preservation in update method

## Testing

After fix:
1. Create terminal block
2. Type: `$ test`
3. Press Enter
4. Verify: New line appears with `$ ` and cursor is positioned after it
5. Type: `command2`
6. Verify: Text appears on the new line, not the first line

## Additional Context

- Tiptap version: Using `@tiptap/react` and `@tiptap/core`
- The terminal node uses `content: 'text*'` which means it can only contain text nodes, not block nodes
- The `NodeViewContent` component from `@tiptap/react` handles the editable content area
- The extension's `addKeyboardShortcuts()` should run before Tiptap's default Enter handler

Please provide a working solution that ensures the cursor stays on the newly created line after pressing Enter inside the terminal block.

