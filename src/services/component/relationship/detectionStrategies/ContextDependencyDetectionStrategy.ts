import { ModifiableComponent } from '../../../../utils/types';
import { RelationshipType, ComponentGraphRelationship, RelationshipDetectionStrategy } from '../types';

/**
 * Strategy for detecting context dependencies between components
 */
export class ContextDependencyDetectionStrategy implements RelationshipDetectionStrategy {
  name: string = 'context-dependency-detector';

  /**
   * Detect context dependencies for a component
   * @param component The component to analyze
   * @param allComponents All available components for context
   */
  detectRelationships(
    component: ModifiableComponent,
    allComponents: Record<string, ModifiableComponent>
  ): ComponentGraphRelationship[] {
    const relationships: ComponentGraphRelationship[] = [];
    
    // Detect shared context usage
    if (component.sourceCode) {
      // Look for useContext usage
      const contextMatches = component.sourceCode.match(/useContext\((\w+)\)/g);
      if (!contextMatches) return relationships;
      
      // Extract context names
      const contextNames = contextMatches.map(match => {
        const nameMatch = match.match(/useContext\((\w+)\)/);
        return nameMatch ? nameMatch[1] : null;
      }).filter(Boolean) as string[];
      
      // Find other components using the same contexts
      for (const [id, otherComponent] of Object.entries(allComponents)) {
        if (id === component.id) continue;
        
        // Skip components without source code
        if (!otherComponent.sourceCode) continue;
        
        const sharedContexts: string[] = [];
        
        for (const contextName of contextNames) {
          if (otherComponent.sourceCode.includes(`useContext(${contextName})`)) {
            sharedContexts.push(contextName);
          }
        }
        
        if (sharedContexts.length > 0) {
          relationships.push({
            sourceId: component.id,
            targetId: id,
            type: RelationshipType.CONTEXT_DEPENDENCY,
            strength: 0.7,
            metadata: {
              contextNames: sharedContexts,
              description: 'Components share React context'
            }
          });
        }
      }
    }
    
    return relationships;
  }
}