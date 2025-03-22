import React, { useState, useEffect } from 'react';
import { ModifiableComponent } from '../../utils/types';
// These imports may need adjustment based on actual file structure
import { HighlightedCodeViewer } from './components/HighlightedCodeViewer';
import { CodeEditor } from './components/CodeEditor';
import { useLLM } from '../../hooks/useLLM';
import { useComponentContext } from '../../context/ComponentContextProvider';

interface CodeInspectorProps {
  component: ModifiableComponent;
}

/**
 * Component that allows viewing and editing a component's source code
 * directly in the debug panel.
 */
export const CodeInspector: React.FC<CodeInspectorProps> = ({ component }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [editHistory, setEditHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { updateComponent } = useComponentContext();
  const { generateComponentCode } = useLLM();

  // Load component source code
  useEffect(() => {
    if (component?.sourceCode) {
      setCode(component.sourceCode);
      setOriginalCode(component.sourceCode);
      setEditHistory([component.sourceCode]);
      setHistoryIndex(0);
    }
  }, [component]);

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  // Save code changes
  const handleSaveChanges = async () => {
    if (!component || !code) return;

    try {
      await updateComponent(component.id, { sourceCode: code });
      
      // Update history
      const newHistory = [...editHistory.slice(0, historyIndex + 1), code];
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update component source:', error);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setCode(editHistory[historyIndex]);
    setIsEditing(false);
  };

  // Time travel through edit history
  const timeTravel = (step: number) => {
    const newIndex = Math.max(0, Math.min(editHistory.length - 1, historyIndex + step));
    if (newIndex !== historyIndex) {
      setHistoryIndex(newIndex);
      setCode(editHistory[newIndex]);
    }
  };

  // Format code
  const formatCode = async () => {
    try {
      // A simple way to format the code - in a real implementation,
      // we would use a proper formatter like prettier
      const formatted = code
        .replace(/\s+/g, ' ')
        .replace(/{/g, '{\n  ')
        .replace(/}/g, '\n}')
        .replace(/;/g, ';\n  ')
        .replace(/\n\s+\n/g, '\n\n');
      
      setCode(formatted);
    } catch (error) {
      console.error('Failed to format code:', error);
    }
  };

  // Generate optimized code using LLM
  const optimizeCode = async () => {
    if (!component) return;
    
    try {
      const optimized = await generateComponentCode({
        componentId: component.id,
        instruction: 'Optimize this component for performance',
        currentCode: code
      });
      
      if (optimized) {
        setCode(optimized);
      }
    } catch (error) {
      console.error('Failed to optimize code:', error);
    }
  };

  if (!component?.sourceCode) {
    return (
      <div className="code-inspector">
        <p className="inspector-empty">No source code available for this component</p>
      </div>
    );
  }

  return (
    <div className="code-inspector">
      <div className="code-inspector-header">
        <h3>Code Inspector</h3>
        <div className="inspector-controls">
          {isEditing ? (
            <>
              <button className="save-button" onClick={handleSaveChanges}>
                Save Changes
              </button>
              <button className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="format-button" onClick={formatCode}>
                Format
              </button>
              <button className="optimize-button" onClick={optimizeCode}>
                Optimize
              </button>
            </>
          ) : (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              Edit Code
            </button>
          )}
          
          {/* Time travel controls */}
          <div className="time-travel-controls">
            <button 
              className="history-button" 
              onClick={() => timeTravel(-1)}
              disabled={historyIndex <= 0}
            >
              ← Previous
            </button>
            <span className="history-indicator">
              {historyIndex + 1} / {editHistory.length}
            </span>
            <button 
              className="history-button" 
              onClick={() => timeTravel(1)}
              disabled={historyIndex >= editHistory.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
      
      <div className="code-inspector-content">
        {isEditing ? (
          <CodeEditor
            code={code}
            onChange={handleCodeChange}
            language="typescript"
          />
        ) : (
          <HighlightedCodeViewer
            code={code}
            language="typescript"
          />
        )}
      </div>
      
      {/* Code metadata */}
      <div className="code-metadata">
        <div className="metadata-item">
          <span className="metadata-label">File:</span>
          <span className="metadata-value">{component.metadata?.filePath || 'Unknown'}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Lines:</span>
          <span className="metadata-value">{code.split('\n').length}</span>
        </div>
        <div className="metadata-item">
          <span className="metadata-label">Last Modified:</span>
          <span className="metadata-value">
            {component.metadata?.lastModified 
              ? new Date(component.metadata.lastModified).toLocaleString() 
              : 'Unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};