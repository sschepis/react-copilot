import React from 'react';
import { TreeItem } from './TreeItem';
import { ModifiableComponent } from '../../../utils/types';

export interface ComponentTreeProps {
  components: Record<string, ModifiableComponent>;
  selectedComponentId: string | null;
  onSelectComponent: (id: string) => void;
  className?: string;
}

export const ComponentTree: React.FC<ComponentTreeProps> = ({
  components,
  selectedComponentId,
  onSelectComponent,
  className = '',
}) => {
  // Build a tree structure from the components
  const buildComponentTree = () => {
    const componentIds = Object.keys(components);
    if (componentIds.length === 0) {
      return (
        <div className="component-tree-empty">
          No components registered
        </div>
      );
    }

    // Create a map of parent to children relationships
    const childrenMap: Record<string, string[]> = {};
    const rootComponents: string[] = [];

    // First pass: determine parent-child relationships
    componentIds.forEach(id => {
      const component = components[id];
      const parentId = component.relationships?.parentId;

      if (parentId && componentIds.includes(parentId)) {
        if (!childrenMap[parentId]) {
          childrenMap[parentId] = [];
        }
        childrenMap[parentId].push(id);
      } else {
        rootComponents.push(id);
      }
    });

    // Render tree items recursively
    const renderTreeItems = (componentIds: string[], depth = 0) => {
      return componentIds.map(id => {
        const component = components[id];
        const hasChildren = childrenMap[id] && childrenMap[id].length > 0;
        
        return (
          <TreeItem
            key={id}
            id={id}
            label={component.name || `Component ${id}`}
            depth={depth}
            isSelected={selectedComponentId === id}
            isExpandable={hasChildren}
            initialExpanded={hasChildren && (selectedComponentId === id || isParentOfSelected(id, selectedComponentId))}
            onSelect={onSelectComponent}
          >
            {hasChildren && renderTreeItems(childrenMap[id], depth + 1)}
          </TreeItem>
        );
      });
    };

    // Check if a component is a parent of the selected component
    const isParentOfSelected = (parentId: string, selectedId: string | null): boolean => {
      if (!selectedId) return false;
      
      let currentId = selectedId;
      while (true) {
        const component = components[currentId];
        const currentParentId = component.relationships?.parentId;
        
        if (!currentParentId) return false;
        if (currentParentId === parentId) return true;
        
        // Move up to the parent
        currentId = currentParentId;
      }
    };

    return renderTreeItems(rootComponents);
  };

  return (
    <div className={`component-tree ${className}`}>
      <div className="component-tree-header">
        <h3>Components</h3>
      </div>
      <div className="component-tree-content">
        {buildComponentTree()}
      </div>
    </div>
  );
};