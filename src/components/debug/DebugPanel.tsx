import React, { useState } from 'react';
import { BaseDebugPanel, BaseDebugPanelProps } from './base/BaseDebugPanel';
import { ComponentTree } from './components/ComponentTree';
import { PropsMonitor } from './components/PropsMonitor';
import { StateMonitor } from './components/StateMonitor';
import { RelationshipView } from './components/RelationshipView';
import { RelationshipGraphView } from './RelationshipGraphView';
import { VersionControlPanel } from './components/VersionControlPanel';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { DebugTabs } from './components/DebugTabs';
import { useComponentContext } from '../../context/ComponentContextProvider';
import './DebugPanel.css';

export interface DebugPanelProps extends Omit<BaseDebugPanelProps, 'mainContent' | 'sidebarContent'> {
  // Additional props specific to DebugPanel
  showRelationships?: boolean;
  showPerformance?: boolean;
  showVersionControl?: boolean;
}

/**
 * Advanced debugging panel that provides visibility into ModifiableComponents.
 * Shows component tree, props, state, and relationships.
 * Leverages BaseDebugPanel for core functionality.
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({
  initialVisible = false,
  position = 'bottom-right',
  width = 600,
  height = 500,
  theme = 'system',
  className = '',
  showRelationships = true,
  showPerformance = false,
  showVersionControl = true,
  ...restProps
}) => {
  const { components, getComponent } = useComponentContext();
  
  return (
    <BaseDebugPanel
      initialVisible={initialVisible}
      position={position}
      width={width}
      height={height}
      theme={theme}
      className={`debug-panel ${className}`}
      headerContent={<h2>React Copilot Debugger</h2>}
      sidebarContent={
        <div className="debug-panel-sidebar-content">
          <h3 className="sidebar-heading">Components</h3>
          <ComponentTree
            components={components}
            selectedComponentId={null} // BaseDebugPanel manages selection state
            onSelectComponent={() => {}} // BaseDebugPanel handles this
          />
        </div>
      }
      mainContent={(selectedComponentId) => 
        selectedComponentId && getComponent(selectedComponentId) ? (
          <DebugTabs
            component={getComponent(selectedComponentId)!}
            tabs={[
              { 
                id: 'props', 
                label: 'Props', 
                content: <PropsMonitor component={getComponent(selectedComponentId)!} /> 
              },
              { 
                id: 'state', 
                label: 'State', 
                content: <StateMonitor component={getComponent(selectedComponentId)!} /> 
              },
              ...(showRelationships ? [
                {
                  id: 'relationships',
                  label: 'Relationships',
                  content: <RelationshipView
                    component={getComponent(selectedComponentId)!}
                    components={components}
                  />
                },
                {
                  id: 'relationship-graph',
                  label: 'Relationship Graph',
                  content: <RelationshipGraphView
                    height={400}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={(id) => {
                      // This would typically be handled by the BaseDebugPanel
                      // The implementation would depend on how the panel manages selection
                    }}
                  />
                }
              ] : []),
              ...(showVersionControl ? [
                {
                  id: 'version-control',
                  label: 'Version Control',
                  content: <VersionControlPanel
                    component={getComponent(selectedComponentId)!}
                  />
                }
              ] : []),
              ...(showPerformance ? [
                {
                  id: 'performance',
                  label: 'Performance',
                  content: <PerformanceMonitor
                    component={getComponent(selectedComponentId)!}
                  />
                }
              ] : []),
              // Additional tabs can be added here conditionally
            ]}
          />
        ) : (
          <div className="debug-panel-empty-state">
            <p>Select a component from the tree to inspect</p>
          </div>
        )
      }
      {...restProps}
    />
  );
};

export default DebugPanel;