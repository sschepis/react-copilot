import { ModifiableComponent } from '../../../../utils/types';
import { RelationshipType, ComponentGraphRelationship, RelationshipDetectionStrategy } from '../types';

/**
 * Strategy for detecting parent-child relationships between components
 */
export class ParentChildDetectionStrategy implements RelationshipDetectionStrategy {
  name: string = 'parent-child-detector';

  /**
   * Detect parent-child relationships for a component
   * @param component The component to analyze
   * @param allComponents All available components for context
   */
  detectRelationships(
    component: ModifiableComponent,
    allComponents: Record<string, ModifiableComponent>
  ): ComponentGraphRelationship[] {
    const relationships: ComponentGraphRelationship[] = [];
    
    // If there's an explicit relationship property, use it
    if (component.relationships?.parentId) {
      relationships.push({
        sourceId: component.relationships.parentId,
        targetId: component.id,
        type: RelationshipType.PARENT_CHILD,
        strength: 1.0,
        metadata: {
          description: 'Explicit parent-child relationship'
        }
      });
    }
    
    // If there are explicit children, add those relationships
    if (component.relationships?.childrenIds) {
      for (const childId of component.relationships.childrenIds) {
        relationships.push({
          sourceId: component.id,
          targetId: childId,
          type: RelationshipType.PARENT_CHILD,
          strength: 1.0,
          metadata: {
            description: 'Explicit parent-child relationship'
          }
        });
      }
    }
    
    // Detect nested components from JSX in source code
    if (component.sourceCode) {
      // Simple detection based on component name usage in JSX
      for (const [id, otherComponent] of Object.entries(allComponents)) {
        if (id === component.id) continue;
        
        // Check if component name appears in the source surrounded by < >
        const componentName = otherComponent.name;
        if (componentName && component.sourceCode.includes(`<${componentName}`)) {
          relationships.push({
            sourceId: component.id,
            targetId: id,
            type: RelationshipType.PARENT_CHILD,
            strength: 0.8, // Lower confidence since this is heuristic-based
            metadata: {
              description: 'Detected from JSX usage in parent component'
            }
          });
        }
      }
    }
    
    return relationships;
  }
}