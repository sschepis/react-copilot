import { 
  IRelationshipManager, 
  ComponentGraphVisualization,
  ComponentNode,
  ComponentEdge
} from './types';
import { ComponentRelationship, ModifiableComponent } from '../../../utils/types';

/**
 * Manages relationships between components, tracking dependencies,
 * parent-child relationships, and state usage
 */
export class RelationshipManager implements IRelationshipManager {
  private componentRelationships: Map<string, ComponentRelationship> = new Map();
  private stateUsage: Map<string, Set<string>> = new Map(); // stateKey -> componentIds

  /**
   * Add or update a component in the relationship graph
   * 
   * @param component The component to add or update
   */
  addComponent(component: ModifiableComponent): void {
    // Create a default relationship if one doesn't exist
    if (!this.componentRelationships.has(component.id)) {
      this.componentRelationships.set(component.id, {
        childrenIds: [],
        siblingIds: [],
        dependsOn: [],
        dependedOnBy: [],
        sharedStateKeys: [],
      });
    }

    // If the component has relationships data, use it to update our tracking
    if (component.relationships) {
      const existingRelationship = this.componentRelationships.get(component.id)!;
      const updatedRelationship = {
        ...existingRelationship,
        ...component.relationships,
      };
      this.componentRelationships.set(component.id, updatedRelationship);

      // Update state usage if component has shared state keys
      if (component.relationships.sharedStateKeys) {
        for (const stateKey of component.relationships.sharedStateKeys) {
          this.trackStateUsage(component.id, stateKey);
        }
      }
    }
  }

  /**
   * Remove a component from the relationship graph
   * 
   * @param componentId The ID of the component to remove
   */
  removeComponent(componentId: string): void {
    // Remove the component's relationships
    this.componentRelationships.delete(componentId);

    // Remove the component from other components' relationships
    for (const [id, relationship] of this.componentRelationships.entries()) {
      // Remove from parent relationship
      if (relationship.parentId === componentId) {
        this.componentRelationships.set(id, {
          ...relationship,
          parentId: undefined,
        });
      }

      // Remove from children relationships
      if (relationship.childrenIds.includes(componentId)) {
        this.componentRelationships.set(id, {
          ...relationship,
          childrenIds: relationship.childrenIds.filter(id => id !== componentId),
        });
      }

      // Remove from sibling relationships
      if (relationship.siblingIds.includes(componentId)) {
        this.componentRelationships.set(id, {
          ...relationship,
          siblingIds: relationship.siblingIds.filter(id => id !== componentId),
        });
      }

      // Remove from dependency relationships
      if (relationship.dependsOn.includes(componentId)) {
        this.componentRelationships.set(id, {
          ...relationship,
          dependsOn: relationship.dependsOn.filter(id => id !== componentId),
        });
      }

      if (relationship.dependedOnBy.includes(componentId)) {
        this.componentRelationships.set(id, {
          ...relationship,
          dependedOnBy: relationship.dependedOnBy.filter(id => id !== componentId),
        });
      }
    }

    // Remove component from state usage
    for (const [stateKey, components] of this.stateUsage.entries()) {
      if (components.has(componentId)) {
        components.delete(componentId);
        if (components.size === 0) {
          this.stateUsage.delete(stateKey);
        }
      }
    }
  }

  /**
   * Set parent-child relationship between components
   * 
   * @param parentId The ID of the parent component
   * @param childId The ID of the child component
   */
  setParentChild(parentId: string, childId: string): void {
    // Check if both components exist
    if (!this.componentRelationships.has(parentId)) {
      throw new Error(`Parent component ${parentId} not found in relationship graph`);
    }
    if (!this.componentRelationships.has(childId)) {
      throw new Error(`Child component ${childId} not found in relationship graph`);
    }

    // Update parent's children
    const parentRelationship = this.componentRelationships.get(parentId)!;
    if (!parentRelationship.childrenIds.includes(childId)) {
      this.componentRelationships.set(parentId, {
        ...parentRelationship,
        childrenIds: [...parentRelationship.childrenIds, childId],
      });
    }

    // Update child's parent
    const childRelationship = this.componentRelationships.get(childId)!;
    this.componentRelationships.set(childId, {
      ...childRelationship,
      parentId,
    });

    // Update siblings for all children of the parent
    this.updateSiblings(parentId);
  }

  /**
   * Update sibling relationships for all children of a parent
   * 
   * @param parentId The ID of the parent component
   */
  private updateSiblings(parentId: string): void {
    const parentRelationship = this.componentRelationships.get(parentId);
    if (!parentRelationship) return;

    const { childrenIds } = parentRelationship;
    if (childrenIds.length <= 1) return;

    // For each child, set all other children as siblings
    for (const childId of childrenIds) {
      const childRelationship = this.componentRelationships.get(childId);
      if (!childRelationship) continue;

      const siblingIds = childrenIds.filter(id => id !== childId);
      this.componentRelationships.set(childId, {
        ...childRelationship,
        siblingIds,
      });
    }
  }

  /**
   * Add a dependency relationship between components
   * 
   * @param dependentId The ID of the component that depends on another
   * @param dependencyId The ID of the component being depended on
   */
  addDependency(dependentId: string, dependencyId: string): void {
    // Check if both components exist
    if (!this.componentRelationships.has(dependentId)) {
      throw new Error(`Dependent component ${dependentId} not found in relationship graph`);
    }
    if (!this.componentRelationships.has(dependencyId)) {
      throw new Error(`Dependency component ${dependencyId} not found in relationship graph`);
    }

    // Update dependent's dependencies
    const dependentRelationship = this.componentRelationships.get(dependentId)!;
    if (!dependentRelationship.dependsOn.includes(dependencyId)) {
      this.componentRelationships.set(dependentId, {
        ...dependentRelationship,
        dependsOn: [...dependentRelationship.dependsOn, dependencyId],
      });
    }

    // Update dependency's dependents
    const dependencyRelationship = this.componentRelationships.get(dependencyId)!;
    if (!dependencyRelationship.dependedOnBy.includes(dependentId)) {
      this.componentRelationships.set(dependencyId, {
        ...dependencyRelationship,
        dependedOnBy: [...dependencyRelationship.dependedOnBy, dependentId],
      });
    }
  }

  /**
   * Track state usage by a component
   * 
   * @param componentId The ID of the component using state
   * @param stateKey The state key being used
   */
  trackStateUsage(componentId: string, stateKey: string): void {
    // Check if the component exists
    if (!this.componentRelationships.has(componentId)) {
      throw new Error(`Component ${componentId} not found in relationship graph`);
    }

    // Update component's shared state keys
    const relationship = this.componentRelationships.get(componentId)!;
    if (!relationship.sharedStateKeys.includes(stateKey)) {
      this.componentRelationships.set(componentId, {
        ...relationship,
        sharedStateKeys: [...relationship.sharedStateKeys, stateKey],
      });
    }

    // Update state usage tracking
    if (!this.stateUsage.has(stateKey)) {
      this.stateUsage.set(stateKey, new Set());
    }
    this.stateUsage.get(stateKey)!.add(componentId);
  }

  /**
   * Get a component's relationship information
   * 
   * @param componentId The ID of the component
   * @returns The component's relationships or null if not found
   */
  getRelationships(componentId: string): ComponentRelationship | null {
    return this.componentRelationships.get(componentId) || null;
  }

  /**
   * Get all components that would be affected by changes to the specified components
   * 
   * @param componentIds The IDs of the components that are changing
   * @returns Array of component IDs that would be affected by the changes
   */
  getAffectedComponents(componentIds: string | string[]): string[] {
    const ids = Array.isArray(componentIds) ? componentIds : [componentIds];
    const visited = new Set<string>();
    const result: string[] = [];

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      result.push(id);

      const relationship = this.componentRelationships.get(id);
      if (!relationship) return;

      // Add components that depend on this one
      for (const dependentId of relationship.dependedOnBy) {
        traverse(dependentId);
      }

      // Add parent (changes to a child could affect parent rendering)
      if (relationship.parentId) {
        traverse(relationship.parentId);
      }
    };

    // Start traversal from each component
    for (const id of ids) {
      traverse(id);
    }

    // Also check for shared state
    const stateKeys = new Set<string>();
    for (const id of ids) {
      const relationship = this.componentRelationships.get(id);
      if (relationship) {
        for (const key of relationship.sharedStateKeys) {
          stateKeys.add(key);
        }
      }
    }

    // Add components affected by shared state
    for (const key of stateKeys) {
      const components = this.stateUsage.get(key);
      if (components) {
        for (const id of components) {
          if (!visited.has(id)) {
            traverse(id);
          }
        }
      }
    }

    return result.filter(id => !ids.includes(id)); // Exclude the original components
  }

  /**
   * Get all state keys that are related to a component
   * 
   * @param componentId The ID of the component
   * @returns Array of state keys used by the component or related components
   */
  getRelatedStateKeys(componentId: string): string[] {
    const relationship = this.componentRelationships.get(componentId);
    if (!relationship) return [];

    // Start with the component's own state keys
    const stateKeys = new Set(relationship.sharedStateKeys);

    // Add state keys from dependencies
    for (const depId of relationship.dependsOn) {
      const depRelationship = this.componentRelationships.get(depId);
      if (depRelationship) {
        for (const key of depRelationship.sharedStateKeys) {
          stateKeys.add(key);
        }
      }
    }

    // Add state keys from dependents
    for (const depId of relationship.dependedOnBy) {
      const depRelationship = this.componentRelationships.get(depId);
      if (depRelationship) {
        for (const key of depRelationship.sharedStateKeys) {
          stateKeys.add(key);
        }
      }
    }

    return Array.from(stateKeys);
  }

  /**
   * Generate a visualization of the component relationship graph
   * 
   * @returns A visualization-ready representation of the graph
   */
  visualizeGraph(): ComponentGraphVisualization {
    const nodes: ComponentNode[] = [];
    const edges: ComponentEdge[] = [];
    const stateNodes: Set<string> = new Set();

    // Create component nodes
    for (const [id, relationship] of this.componentRelationships.entries()) {
      nodes.push({
        id,
        name: id, // Use ID as name for now
        type: 'component',
      });

      // Add parent-child edges
      if (relationship.parentId) {
        edges.push({
          source: relationship.parentId,
          target: id,
          type: 'parent-child',
        });
      }

      // Add dependency edges
      for (const depId of relationship.dependsOn) {
        edges.push({
          source: id,
          target: depId,
          type: 'depends-on',
        });
      }

      // Add state nodes and edges
      for (const stateKey of relationship.sharedStateKeys) {
        if (!stateNodes.has(stateKey)) {
          stateNodes.add(stateKey);
          nodes.push({
            id: `state:${stateKey}`,
            name: stateKey,
            type: 'state',
          });
        }

        edges.push({
          source: id,
          target: `state:${stateKey}`,
          type: 'uses-state',
        });
      }
    }

    return { nodes, edges };
  }
}

export default RelationshipManager;