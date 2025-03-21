import React from 'react';
import { ModifiableComponent, ComponentRelationship } from '../../../utils/types';

export interface RelationshipViewProps {
  component: ModifiableComponent;
  components: Record<string, ModifiableComponent>;
  onSelectComponent?: (id: string) => void;
  className?: string;
}

/**
 * Displays the relationships between components
 */
export const RelationshipView: React.FC<RelationshipViewProps> = ({
  component,
  components,
  onSelectComponent,
  className = '',
}) => {
  const relationships = component.relationships || {
    parentId: undefined,
    childrenIds: [],
    siblingIds: [],
    dependsOn: [],
    dependedOnBy: [],
    sharedStateKeys: [],
  };
  
  // Get component name by ID
  const getComponentName = (id: string): string => {
    return components[id]?.name || `Component ${id}`;
  };
  
  // Handle component selection
  const handleSelect = (id: string) => {
    if (onSelectComponent) {
      onSelectComponent(id);
    }
  };
  
  return (
    <div className={`relationship-view ${className}`}>
      <h3 className="relationship-view-title">Component Relationships</h3>
      
      <div className="relationship-view-content">
        {/* Parent component */}
        <div className="relationship-section">
          <h4>Parent</h4>
          {relationships.parentId ? (
            <div 
              className="relationship-item relationship-parent" 
              onClick={() => handleSelect(relationships.parentId!)}
            >
              {getComponentName(relationships.parentId)}
            </div>
          ) : (
            <div className="relationship-empty">No parent component</div>
          )}
        </div>
        
        {/* Child components */}
        <div className="relationship-section">
          <h4>Children</h4>
          {relationships.childrenIds.length > 0 ? (
            <ul className="relationship-list">
              {relationships.childrenIds.map(id => (
                <li 
                  key={id} 
                  className="relationship-item relationship-child"
                  onClick={() => handleSelect(id)}
                >
                  {getComponentName(id)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="relationship-empty">No child components</div>
          )}
        </div>
        
        {/* Siblings */}
        <div className="relationship-section">
          <h4>Siblings</h4>
          {relationships.siblingIds.length > 0 ? (
            <ul className="relationship-list">
              {relationships.siblingIds.map(id => (
                <li 
                  key={id} 
                  className="relationship-item relationship-sibling"
                  onClick={() => handleSelect(id)}
                >
                  {getComponentName(id)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="relationship-empty">No sibling components</div>
          )}
        </div>
        
        {/* Dependencies */}
        <div className="relationship-section">
          <h4>Depends On</h4>
          {relationships.dependsOn.length > 0 ? (
            <ul className="relationship-list">
              {relationships.dependsOn.map(id => (
                <li 
                  key={id} 
                  className="relationship-item relationship-dependency"
                  onClick={() => handleSelect(id)}
                >
                  {getComponentName(id)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="relationship-empty">No dependencies</div>
          )}
        </div>
        
        {/* Depended on by */}
        <div className="relationship-section">
          <h4>Depended On By</h4>
          {relationships.dependedOnBy.length > 0 ? (
            <ul className="relationship-list">
              {relationships.dependedOnBy.map(id => (
                <li 
                  key={id} 
                  className="relationship-item relationship-dependent"
                  onClick={() => handleSelect(id)}
                >
                  {getComponentName(id)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="relationship-empty">No dependent components</div>
          )}
        </div>
        
        {/* Shared state */}
        <div className="relationship-section">
          <h4>Shared State Keys</h4>
          {relationships.sharedStateKeys.length > 0 ? (
            <ul className="relationship-list">
              {relationships.sharedStateKeys.map(key => (
                <li key={key} className="relationship-item relationship-shared-state">
                  {key}
                </li>
              ))}
            </ul>
          ) : (
            <div className="relationship-empty">No shared state</div>
          )}
        </div>
      </div>
    </div>
  );
};