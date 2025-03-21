import React, { useState, useEffect } from 'react';
import { useComponentContext } from '../../context/ComponentContext';
import { ComponentTree } from './ComponentTree';
import { PropsMonitor } from './PropsMonitor';
import { StateMonitor } from './StateMonitor';
import { RelationshipView } from './RelationshipView';
import './DebugPanel.css';

export interface DebugPanelProps {
  initialVisible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  width?: number | string;
  height?: number | string;
}

/**
 * A debugging panel that provides visibility into ModifiableComponents.
 * Shows component tree, props, state, and relationships.
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({
  initialVisible = false,
  position = 'bottom-right',
  width = 400,
  height = 500,
}) => {
  const [visible, setVisible] = useState(initialVisible);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'props' | 'state' | 'relationships'>('props');
  const { components, getComponent } = useComponentContext();
  
  // Toggle visibility with keyboard shortcut (Alt+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'd') {
        setVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!visible) {
    return (
      <button 
        className="debug-panel-toggle"
        onClick={() => setVisible(true)}
        title="Open Debug Panel (Alt+D)"
      >
        Debug
      </button>
    );
  }
  
  return (
    <div 
      className={`debug-panel debug-panel-${position}`}
      style={{ width, height }}
    >
      <div className="debug-panel-header">
        <h2>Component Debugger</h2>
        <div className="debug-panel-controls">
          <button 
            className="debug-panel-minimize"
            onClick={() => setVisible(false)}
            title="Close Debug Panel (Alt+D)"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="debug-panel-content">
        <div className="debug-panel-sidebar">
          <ComponentTree 
            components={components} 
            selectedComponentId={selectedComponent}
            onSelectComponent={setSelectedComponent} 
          />
        </div>
        
        <div className="debug-panel-main">
          {selectedComponent ? (
            <>
              <div className="debug-panel-tabs">
                <button 
                  className={activeTab === 'props' ? 'active' : ''}
                  onClick={() => setActiveTab('props')}
                >
                  Props
                </button>
                <button 
                  className={activeTab === 'state' ? 'active' : ''}
                  onClick={() => setActiveTab('state')}
                >
                  State
                </button>
                <button 
                  className={activeTab === 'relationships' ? 'active' : ''}
                  onClick={() => setActiveTab('relationships')}
                >
                  Relationships
                </button>
              </div>
              
              <div className="debug-panel-tab-content">
                {activeTab === 'props' && (
                  <PropsMonitor component={getComponent(selectedComponent)!} />
                )}
                {activeTab === 'state' && (
                  <StateMonitor component={getComponent(selectedComponent)!} />
                )}
                {activeTab === 'relationships' && (
                  <RelationshipView component={getComponent(selectedComponent)!} />
                )}
              </div>
            </>
          ) : (
            <div className="debug-panel-empty-state">
              <p>Select a component from the tree to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};