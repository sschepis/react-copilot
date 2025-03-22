import React from 'react';

interface HighlightedCodeViewerProps {
  code: string;
  language: string;
}

/**
 * Component for displaying code with syntax highlighting
 */
export const HighlightedCodeViewer: React.FC<HighlightedCodeViewerProps> = ({ 
  code, 
  language 
}) => {
  // In a real implementation, we would use a library like Prism.js or highlight.js
  // For now, we'll use a simple pre tag with some basic styling
  
  return (
    <div className="highlighted-code">
      <pre className={`language-${language}`}>
        <code>
          {code}
        </code>
      </pre>
    </div>
  );
};