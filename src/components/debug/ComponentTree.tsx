import React from 'react';
import { ModifiableComponent } from '../../utils/types';

interface ComponentTreeProps {
  components: Record<string, ModifiableComponent>;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string) => void;
}

/**
 * Displays a hierarchical tree of components with parent-child relationships
 */
export const ComponentTree: React.FC<ComponentTreeProps> = ({
  components,
  selectedComponentId,
  onSelectComponent,
}) => {
  // Find root components (those without parents)
  const rootComponents = Object.values(components).filter(
    (component) => !component.relationships?.parentId
  );

  // Build component tree recursively
  const renderComponentNode = (component: ModifiableComponent) => {
    // Check if childrenIds exists and has length > 0
    const childrenIds = component.relationships?.childrenIds || [];
    const hasChildren = childrenIds.length > 0;
    const isSelected = component.id === selectedComponentId;
    
    // Find child components
    const childComponents = childrenIds
      .map((childId: string) => components[childId])
      .filter(Boolean) || [];

    return (
      <div key={component.id}>
        <div 
          className={`component-tree-item ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelectComponent(component.id)}
          title={component.sourceCode?.slice(0, 100) || component.name}
        >
          {component.name}
        </div>
        
        {hasChildren && (
          <div className="component-tree-children">
            {childComponents.map(renderComponentNode)}
          </div>
        )}
      </div>
    );
  };

  // Calculate total component count
  const totalComponents = Object.keys(components).length;

  return (
    <div className="component-tree">
      <div className="component-tree-header">
        <small>{totalComponents} components</small>
      </div>
      
      {rootComponents.length > 0 ? (
        rootComponents.map(renderComponentNode)
      ) : (
        <div className="component-tree-empty">
          No components registered
        </div>
      )}
    </div>
  );
};