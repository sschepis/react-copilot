import { ModifiableComponent } from '../../../../utils/types';
import { RelationshipType, ComponentGraphRelationship, RelationshipDetectionStrategy } from '../types';

/**
 * Strategy for detecting state dependencies between components
 */
export class StateDependencyDetectionStrategy implements RelationshipDetectionStrategy {
  name: string = 'state-dependency-detector';

  /**
   * Detect state dependencies for a component
   * @param component The component to analyze
   * @param allComponents All available components for context
   */
  detectRelationships(
    component: ModifiableComponent,
    allComponents: Record<string, ModifiableComponent>
  ): ComponentGraphRelationship[] {
    const relationships: ComponentGraphRelationship[] = [];
    
    // Simple detection based on source code analysis
    if (component.sourceCode) {
      // Look for state patterns like useState, useReducer, etc.
      const statePatterns = [
        {regex: /useState\(([^)]*)\)/g, type: 'useState'},
        {regex: /useReducer\(([^)]*)\)/g, type: 'useReducer'},
        {regex: /useContext\(([^)]*)\)/g, type: 'useContext'}
      ];
      
      // Extract potential state variables
      const stateVars: string[] = [];
      
      for (const pattern of statePatterns) {
        const matches = component.sourceCode.matchAll(pattern.regex);
        for (const match of matches) {
          const stateVarMatch = component.sourceCode.substring(match.index!).match(/const\s+\[([^,]+),/);
          if (stateVarMatch && stateVarMatch[1]) {
            stateVars.push(stateVarMatch[1].trim());
          }
        }
      }
      
      // Look for state variables passed to other components
      for (const stateVar of stateVars) {
        for (const [id, otherComponent] of Object.entries(allComponents)) {
          if (id === component.id) continue;
          
          // Skip components without a name
          if (!otherComponent.name) continue;
          
          // Check if state var is passed to other component
          const propRegExp = new RegExp(
            `<\\s*${otherComponent.name}[^>]*\\s\\w+\\s*=\\s*["'{]?${stateVar}\\b`, 
            'g'
          );
          
          if (propRegExp.test(component.sourceCode)) {
            relationships.push({
              sourceId: component.id,
              targetId: id,
              type: RelationshipType.STATE_DEPENDENCY,
              strength: 0.8,
              metadata: {
                stateKeys: [stateVar],
                description: 'State passed from parent to child'
              }
            });
          }
        }
      }
    }
    
    return relationships;
  }
}