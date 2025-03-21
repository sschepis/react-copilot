import React from 'react';
import { ModifiableComponent } from '../../utils/types';
import { useComponentContext } from '../../context/ComponentContext';

interface RelationshipViewProps {
  component: ModifiableComponent;
}

/**
 * Displays the relationships between components, including parent-child relationships,
 * dependencies, and components that share state.
 */
export const RelationshipView: React.FC<RelationshipViewProps> = ({ component }) => {
  const { getComponent } = useComponentContext();
  const relationships = component.relationships;
  
  if (!relationships) {
    return <div className="relationship-empty">No relationship data available</div>;
  }
  
  // Get names of related components
  const getComponentName = (id: string): string => {
    const comp = getComponent(id);
    return comp ? comp.name : `Unknown (${id})`;
  };
  
  // Parent component
  const parentComponent = relationships.parentId ? (
    <div className="relationship-section">
      <h3>Parent Component</h3>
      <ul className="relationship-list">
        <li onClick={() => getComponent(relationships.parentId!)}>
          {getComponentName(relationships.parentId!)}
        </li>
      </ul>
    </div>
  ) : (
    <div className="relationship-section">
      <h3>Parent Component</h3>
      <div className="relationship-empty">No parent component (this is a root component)</div>
    </div>
  );
  
  // Child components
  const childComponents = (
    <div className="relationship-section">
      <h3>Child Components ({relationships.childrenIds?.length || 0})</h3>
      {relationships.childrenIds && relationships.childrenIds.length > 0 ? (
        <ul className="relationship-list">
          {relationships.childrenIds.map(id => (
            <li key={id}>
              {getComponentName(id)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="relationship-empty">No child components</div>
      )}
    </div>
  );
  
  // Dependencies
  const dependencies = (
    <div className="relationship-section">
      <h3>Dependencies ({relationships.dependsOn?.length || 0})</h3>
      {relationships.dependsOn && relationships.dependsOn.length > 0 ? (
        <ul className="relationship-list">
          {relationships.dependsOn.map(id => (
            <li key={id}>
              {getComponentName(id)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="relationship-empty">No dependencies</div>
      )}
    </div>
  );
  
  // Components that depend on this component
  const dependents = (
    <div className="relationship-section">
      <h3>Used By ({relationships.dependedOnBy?.length || 0})</h3>
      {relationships.dependedOnBy && relationships.dependedOnBy.length > 0 ? (
        <ul className="relationship-list">
          {relationships.dependedOnBy.map(id => (
            <li key={id}>
              {getComponentName(id)}
            </li>
          ))}
        </ul>
      ) : (
        <div className="relationship-empty">No components depend on this component</div>
      )}
    </div>
  );
  
  // Shared state
  const sharedState = (
    <div className="relationship-section">
      <h3>Shared State Keys ({relationships.sharedStateKeys?.length || 0})</h3>
      {relationships.sharedStateKeys && relationships.sharedStateKeys.length > 0 ? (
        <ul className="relationship-list">
          {relationships.sharedStateKeys.map(key => (
            <li key={key}>
              {key}
            </li>
          ))}
        </ul>
      ) : (
        <div className="relationship-empty">No shared state</div>
      )}
    </div>
  );
  
  return (
    <div className="relationship-view">
      {parentComponent}
      {childComponents}
      {dependencies}
      {dependents}
      {sharedState}
    </div>
  );
};