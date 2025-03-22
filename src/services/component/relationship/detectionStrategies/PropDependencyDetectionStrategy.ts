import { ModifiableComponent } from '../../../../utils/types';
import { RelationshipType, ComponentGraphRelationship, RelationshipDetectionStrategy } from '../types';

/**
 * Strategy for detecting prop dependencies between components
 */
export class PropDependencyDetectionStrategy implements RelationshipDetectionStrategy {
  name: string = 'prop-dependency-detector';

  /**
   * Detect prop dependencies for a component
   * @param component The component to analyze
   * @param allComponents All available components for context
   */
  detectRelationships(
    component: ModifiableComponent,
    allComponents: Record<string, ModifiableComponent>
  ): ComponentGraphRelationship[] {
    const relationships: ComponentGraphRelationship[] = [];
    
    // If there's an explicit relationship property, use it
    if (component.relationships?.dependsOn) {
      for (const dependencyId of component.relationships.dependsOn) {
        relationships.push({
          sourceId: dependencyId,
          targetId: component.id,
          type: RelationshipType.PROP_DEPENDENCY,
          strength: 1.0,
          metadata: {
            description: 'Explicit prop dependency'
          }
        });
      }
    }
    
    // Detect prop dependencies from source code and props
    if (component.sourceCode && component.props) {
      const propNames = Object.keys(component.props);
      
      // For all other components, check if they pass props to this component
      for (const [id, otherComponent] of Object.entries(allComponents)) {
        if (id === component.id) continue;
        
        // Skip components without source code
        if (!otherComponent.sourceCode) continue;
        
        // Check if other component passes props to this component
        const componentName = component.name;
        if (componentName) {
          // Check for prop passing in JSX
          const foundProps: string[] = [];
          
          for (const propName of propNames) {
            // Look for propName="..." or propName={...} patterns with this component
            const propRegExp = new RegExp(
              `<\\s*${componentName}[^>]*\\s${propName}\\s*=\\s*["'{]`, 
              'g'
            );
            
            if (propRegExp.test(otherComponent.sourceCode)) {
              foundProps.push(propName);
            }
          }
          
          if (foundProps.length > 0) {
            relationships.push({
              sourceId: id,
              targetId: component.id,
              type: RelationshipType.PROP_DEPENDENCY,
              strength: 0.9,
              metadata: {
                propNames: foundProps,
                description: 'Props passed from parent to child'
              }
            });
          }
        }
      }
    }
    
    return relationships;
  }
}