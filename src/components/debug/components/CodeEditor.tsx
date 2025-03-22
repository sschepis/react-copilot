import React, { useEffect, useRef } from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  readOnly?: boolean;
}

/**
 * A simple code editor component for editing component source code
 * In a production implementation, this would likely use a more robust
 * editor like Monaco Editor or CodeMirror
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  readOnly = false
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Set initial code value
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.value = code;
    }
  }, [code]);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!readOnly) {
      onChange(e.target.value);
    }
  };

  // Handle tab key to insert spaces instead of changing focus
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !readOnly) {
      e.preventDefault();
      const start = editorRef.current!.selectionStart;
      const end = editorRef.current!.selectionEnd;
      
      // Insert 2 spaces at cursor position
      const newText = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newText);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = start + 2;
          editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className={`code-editor code-editor-${language}`}>
      <textarea
        ref={editorRef}
        className="code-editor-textarea"
        value={code}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        readOnly={readOnly}
        data-language={language}
        aria-label="Code editor"
      />
      
      {/* Line numbers column */}
      <div className="line-numbers">
        {code.split('\n').map((_, i) => (
          <div key={i} className="line-number">
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* Editor controls */}
      <div className="editor-controls">
        {readOnly && (
          <div className="read-only-indicator">Read Only</div>
        )}
        <div className="language-indicator">{language}</div>
      </div>
    </div>
  );
};