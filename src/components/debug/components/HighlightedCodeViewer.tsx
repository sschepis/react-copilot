import React from 'react';

interface HighlightedCodeViewerProps {
  code: string;
  language: string;
  highlightedLines?: number[];
}

/**
 * Component for displaying syntax-highlighted code with optional line highlighting
 */
export const HighlightedCodeViewer: React.FC<HighlightedCodeViewerProps> = ({
  code,
  language,
  highlightedLines = []
}) => {
  // If the code is empty, display a message
  if (!code) {
    return (
      <div className="code-viewer code-viewer-empty">
        <p>No code to display</p>
      </div>
    );
  }

  // Split the code into lines for rendering
  const lines = code.split('\n');

  return (
    <div className="code-viewer">
      <pre className={`language-${language}`}>
        <code>
          {lines.map((line, index) => (
            <div
              key={index}
              className={`code-line ${highlightedLines.includes(index + 1) ? 'highlighted' : ''}`}
            >
              <span className="line-number">{index + 1}</span>
              <span className="line-content">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
};