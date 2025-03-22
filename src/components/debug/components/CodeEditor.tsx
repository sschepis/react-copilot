import React, { useState, useEffect } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
}

/**
 * Simple code editor component with basic editing capabilities
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  language 
}) => {
  // Track cursor position
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  
  // In a production implementation, we would use a proper code editor like
  // Monaco Editor, CodeMirror, or Ace Editor for features like:
  // - Syntax highlighting
  // - Line numbers
  // - Code completion
  // - Error highlighting
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Save cursor position for undo/redo operations
    setCursorPosition(e.target.selectionStart);
  };
  
  // Focus management
  useEffect(() => {
    const textarea = document.querySelector('.code-editor textarea');
    if (textarea) {
      (textarea as HTMLTextAreaElement).focus();
      (textarea as HTMLTextAreaElement).setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [code, cursorPosition]);

  return (
    <div className="code-editor">
      <textarea
        value={code}
        onChange={handleTextChange}
        spellCheck={false}
        data-language={language}
        aria-label="Code editor"
      />
    </div>
  );
};