import { ModifiableComponent, ComponentRelationship } from '../../../utils/types';
import { EventBus } from '../../../utils/EventBus';
import { CommonEvents } from '../../../utils/CommonEvents';
import { LoggingSystem, LogCategory } from '../../../utils/LoggingSystem';
import { ErrorHandlingSystem, ErrorCategory, ErrorSeverity } from '../../../utils/ErrorHandling';
import { 
  RelationshipType, 
  ComponentGraphRelationship,
  RelationshipDetectionStrategy,
  VisualizationData
} from './types';
import { createDefaultDetectionStrategies } from './detectionStrategies';

/**
 * Core manager for component relationships
 * Tracks and analyzes relationships between components
 */
export class RelationshipManager {
  private relationships: Map<string, ComponentGraphRelationship[]> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();
  private componentCache: Map<string, ModifiableComponent> = new Map();
  private detectionStrategies: RelationshipDetectionStrategy[] = [];
  private eventBus: EventBus;
  private logger = LoggingSystem.getInstance().getChildLogger(LogCategory.COMPONENT, {
    component: 'RelationshipManager'
  });
  private errorHandling = ErrorHandlingSystem.getInstance();

  /**
   * Create a new relationship manager
   */
  constructor() {
    this.eventBus = EventBus.getInstance();
    this.detectionStrategies = createDefaultDetectionStrategies();
  }

  /**
   * Add a relationship detection strategy
   * @param strategy The detection strategy to add
   */
  addDetectionStrategy(strategy: RelationshipDetectionStrategy): void {
    this.detectionStrategies.push(strategy);
    this.logger.debug(`Added relationship detection strategy: ${strategy.name}`);
  }

  /**
   * Remove a relationship detection strategy
   * @param strategyName The name of the strategy to remove
   */
  removeDetectionStrategy(strategyName: string): boolean {
    const initialLength = this.detectionStrategies.length;
    this.detectionStrategies = this.detectionStrategies.filter(
      s => s.name !== strategyName
    );
    return this.detectionStrategies.length < initialLength;
  }

  /**
   * Add a component to the relationship manager
   * @param component The component to add
   */
  addComponent(component: ModifiableComponent): void {
    this.componentCache.set(component.id, component);
    
    // Initialize adjacency list entry if needed
    if (!this.adjacencyList.has(component.id)) {
      this.adjacencyList.set(component.id, new Set());
    }
    
    // Initialize relationships array if needed
    if (!this.relationships.has(component.id)) {
      this.relationships.set(component.id, []);
    }
    
    this.logger.debug(`Added component to relationship manager: ${component.id}`);
  }

  /**
   * Remove a component from the relationship manager
   * @param componentId The ID of the component to remove
   */
  removeComponent(componentId: string): void {
    // Remove from component cache
    this.componentCache.delete(componentId);
    
    // Remove from adjacency list
    this.adjacencyList.delete(componentId);
    
    // Remove outgoing relationships
    this.relationships.delete(componentId);
    
    // Remove incoming relationships
    for (const [sourceId, relationships] of this.relationships.entries()) {
      const filteredRelationships = relationships.filter(
        r => r.targetId !== componentId
      );
      
      if (filteredRelationships.length !== relationships.length) {
        this.relationships.set(sourceId, filteredRelationships);
      }
    }
    
    // Remove from adjacency list entries
    for (const neighbors of this.adjacencyList.values()) {
      neighbors.delete(componentId);
    }
    
    this.logger.debug(`Removed component from relationship manager: ${componentId}`);
  }

  /**
   * Add a relationship between components
   * @param relationship The relationship to add
   */
  addRelationship(relationship: ComponentGraphRelationship): void {
    const { sourceId, targetId } = relationship;
    
    // Ensure both components exist in the graph
    if (!this.componentCache.has(sourceId) || !this.componentCache.has(targetId)) {
      this.logger.warn(`Cannot add relationship: one or both components do not exist`, {
        sourceId,
        targetId
      });
      return;
    }
    
    // Get existing relationships from source
    const existingRelationships = this.relationships.get(sourceId) || [];
    
    // Check if relationship already exists
    const existing = existingRelationships.find(
      r => r.targetId === targetId && r.type === relationship.type
    );
    
    if (existing) {
      // Update existing relationship
      const index = existingRelationships.indexOf(existing);
      existingRelationships[index] = {
        ...existing,
        ...relationship,
        metadata: {
          ...existing.metadata,
          ...relationship.metadata
        }
      };
    } else {
      // Add new relationship
      existingRelationships.push(relationship);
    }
    
    // Update relationships map
    this.relationships.set(sourceId, existingRelationships);
    
    // Update adjacency list
    const neighbors = this.adjacencyList.get(sourceId) || new Set();
    neighbors.add(targetId);
    this.adjacencyList.set(sourceId, neighbors);
    
    this.logger.debug(`Added relationship: ${sourceId} -> ${targetId} (${relationship.type})`);
    
    // Emit event
    this.eventBus.publish(CommonEvents.RELATIONSHIP_DETECTED, {
      sourceId,
      targetId,
      type: relationship.type,
      metadata: relationship.metadata
    });
  }

  /**
   * Remove a relationship between components
   * @param sourceId The source component ID
   * @param targetId The target component ID
   * @param type Optional relationship type to remove
   */
  removeRelationship(sourceId: string, targetId: string, type?: RelationshipType): void {
    // Get existing relationships
    const existingRelationships = this.relationships.get(sourceId);
    if (!existingRelationships) return;
    
    // Filter relationships
    const filteredRelationships = type
      ? existingRelationships.filter(
          r => r.targetId !== targetId || r.type !== type
        )
      : existingRelationships.filter(
          r => r.targetId !== targetId
        );
    
    if (filteredRelationships.length === existingRelationships.length) {
      // No relationships were removed
      return;
    }
    
    // Update relationships map
    this.relationships.set(sourceId, filteredRelationships);
    
    // Update adjacency list if all relationships were removed
    if (!filteredRelationships.some(r => r.targetId === targetId)) {
      const neighbors = this.adjacencyList.get(sourceId);
      if (neighbors) {
        neighbors.delete(targetId);
      }
    }
    
    this.logger.debug(`Removed relationship: ${sourceId} -> ${targetId}${type ? ` (${type})` : ''}`);
    
    // Emit event
    this.eventBus.publish(CommonEvents.RELATIONSHIP_LOST, {
      sourceId,
      targetId,
      type
    });
  }

  /**
   * Get all relationships for a component
   * @param componentId The component ID
   */
  getRelationships(componentId: string): ComponentGraphRelationship[] {
    // Get outgoing relationships
    const outgoing = this.relationships.get(componentId) || [];
    
    // Get incoming relationships
    const incoming: ComponentGraphRelationship[] = [];
    for (const [sourceId, relationships] of this.relationships.entries()) {
      if (sourceId === componentId) continue;
      
      for (const rel of relationships) {
        if (rel.targetId === componentId) {
          incoming.push(rel);
        }
      }
    }
    
    return [...outgoing, ...incoming];
  }

  /**
   * Detect relationships for a component
   * @param component The component to analyze
   * @param forceRedetect Whether to force relationship redetection
   */
  detectRelationships(
    component: ModifiableComponent,
    forceRedetect: boolean = false
  ): void {
    try {
      // Add component to cache if needed
      if (!this.componentCache.has(component.id)) {
        this.addComponent(component);
      } else if (!forceRedetect) {
        // Update cache
        this.componentCache.set(component.id, component);
      }
      
      // Get all components for context
      const allComponents: Record<string, ModifiableComponent> = {};
      for (const [id, cachedComponent] of this.componentCache.entries()) {
        allComponents[id] = cachedComponent;
      }
      
      // If force redetect, clear existing relationships
      if (forceRedetect) {
        // Clear outgoing relationships
        this.relationships.set(component.id, []);
        
        // Clear incoming relationships
        for (const [sourceId, relationships] of this.relationships.entries()) {
          if (sourceId === component.id) continue;
          
          const filteredRelationships = relationships.filter(
            r => r.targetId !== component.id
          );
          
          if (filteredRelationships.length !== relationships.length) {
            this.relationships.set(sourceId, filteredRelationships);
          }
        }
      }
      
      // Run all detection strategies
      for (const strategy of this.detectionStrategies) {
        try {
          const detectedRelationships = strategy.detectRelationships(
            component,
            allComponents
          );
          
          // Add detected relationships
          for (const rel of detectedRelationships) {
            this.addRelationship(rel);
          }
        } catch (strategyError) {
          this.logger.error(`Error in relationship detection strategy: ${strategy.name}`, strategyError);
          
          this.errorHandling.handleError(
            strategyError instanceof Error ? strategyError : new Error(String(strategyError)),
            ErrorSeverity.ERROR,
            ErrorCategory.COMPONENT,
            {
              message: `Error detecting relationships for component: ${component.id}`,
              componentId: component.id,
              metadata: {
                strategyName: strategy.name
              }
            }
          );
        }
      }
      
      this.logger.debug(`Detected relationships for component: ${component.id}`);
      
      // Emit event about relationship changes
      this.eventBus.publish(CommonEvents.RELATIONSHIP_CHANGED, {
        componentId: component.id,
        relationships: this.getComponentRelationship(component.id)
      });
    } catch (error) {
      this.logger.error(`Failed to detect relationships for component: ${component.id}`, error);
      
      this.errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.COMPONENT,
        {
          message: `Failed to detect relationships for component: ${component.id}`,
          componentId: component.id
        }
      );
    }
  }

  /**
   * Get relationships for a component in the standard format
   * @param componentId The component ID
   */
  getComponentRelationship(componentId: string): ComponentRelationship {
    const relationships = this.getRelationships(componentId);
    
    // Initialize default relationship structure
    const result: ComponentRelationship = {
      childrenIds: [],
      siblingIds: [],
      dependsOn: [],
      dependedOnBy: [],
      sharedStateKeys: []
    };
    
    // Parent-child relationships
    for (const rel of relationships) {
      if (rel.type === RelationshipType.PARENT_CHILD) {
        if (rel.sourceId === componentId) {
          // This component is the parent
          result.childrenIds.push(rel.targetId);
        } else {
          // This component is the child, find siblings
          const parentRelationships = this.relationships.get(rel.sourceId) || [];
          for (const parentRel of parentRelationships) {
            if (parentRel.type === RelationshipType.PARENT_CHILD &&
                parentRel.targetId !== componentId) {
              result.siblingIds.push(parentRel.targetId);
            }
          }
        }
      }
    }
    
    // Dependency relationships
    for (const rel of relationships) {
      if (rel.type === RelationshipType.PROP_DEPENDENCY ||
          rel.type === RelationshipType.STATE_DEPENDENCY ||
          rel.type === RelationshipType.CONTEXT_DEPENDENCY) {
        
        if (rel.sourceId === componentId) {
          // Others depend on this component
          result.dependedOnBy.push(rel.targetId);
        } else {
          // This component depends on others
          result.dependsOn.push(rel.sourceId);
        }
      }
      
      // Extract shared state keys
      if (rel.type === RelationshipType.STATE_DEPENDENCY && rel.metadata?.stateKeys) {
        result.sharedStateKeys = [
          ...result.sharedStateKeys,
          ...(rel.metadata.stateKeys as string[])
        ];
      }
    }
    
    // Remove duplicates
    result.childrenIds = [...new Set(result.childrenIds)];
    result.siblingIds = [...new Set(result.siblingIds)];
    result.dependsOn = [...new Set(result.dependsOn)];
    result.dependedOnBy = [...new Set(result.dependedOnBy)];
    result.sharedStateKeys = [...new Set(result.sharedStateKeys)];
    
    return result;
  }

  /**
   * Get all components directly connected to a component
   * @param componentId The component ID
   */
  getConnectedComponents(componentId: string): string[] {
    const connected = new Set<string>();
    
    // Get outgoing connections
    const outgoing = this.adjacencyList.get(componentId);
    if (outgoing) {
      for (const target of outgoing) {
        connected.add(target);
      }
    }
    
    // Get incoming connections
    for (const [sourceId, neighbors] of this.adjacencyList.entries()) {
      if (neighbors.has(componentId)) {
        connected.add(sourceId);
      }
    }
    
    return [...connected];
  }

  /**
   * Get a graph representation for visualization
   */
  getVisualizationData(): VisualizationData {
    const nodes = [];
    const edges = [];
    
    // Add nodes
    for (const [componentId, component] of this.componentCache.entries()) {
      const neighbors = this.getConnectedComponents(componentId).length;
      
      nodes.push({
        id: componentId,
        name: component.name,
        type: component.componentType || 'unknown',
        neighbors
      });
    }
    
    // Add edges
    for (const [sourceId, relationships] of this.relationships.entries()) {
      for (const rel of relationships) {
        edges.push({
          source: sourceId,
          target: rel.targetId,
          type: rel.type,
          strength: rel.strength
        });
      }
    }
    
    return { nodes, edges };
  }

  /**
   * Get all components affected by a change to a component
   * @param componentId The component ID
   * @param recursive Whether to include recursive dependencies
   */
  getAffectedComponents(
    componentId: string,
    recursive: boolean = true
  ): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();
    
    // Helper function for recursive traversal
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      // Get outgoing relationships
      const relationships = this.relationships.get(id) || [];
      
      for (const rel of relationships) {
        affected.add(rel.targetId);
        
        if (recursive) {
          traverse(rel.targetId);
        }
      }
      
      // Also check for incoming relationships (dependency direction)
      for (const [sourceId, sourceRels] of this.relationships.entries()) {
        if (sourceId === id) continue;
        
        for (const rel of sourceRels) {
          if (rel.targetId === id) {
            // Found an incoming dependency
            affected.add(sourceId);
            
            if (recursive) {
              traverse(sourceId);
            }
          }
        }
      }
    };
    
    // Start traversal
    traverse(componentId);
    
    // Remove the component itself from the result
    affected.delete(componentId);
    
    return [...affected];
  }

  /**
   * Get related state keys for a component (for backward compatibility)
   * @param componentId The component ID
   */
  getRelatedStateKeys(componentId: string): string[] {
    // Get all relationships for the component
    const relationships = this.getRelationships(componentId);
    
    // Extract state keys from relationship metadata
    const stateKeys: string[] = [];
    
    for (const rel of relationships) {
      if (rel.type === RelationshipType.STATE_DEPENDENCY && rel.metadata?.stateKeys) {
        stateKeys.push(...(rel.metadata.stateKeys as string[]));
      }
    }
    
    // Remove duplicates
    return [...new Set(stateKeys)];
  }

  /**
   * Reset the relationship manager
   */
  reset(): void {
    this.relationships.clear();
    this.adjacencyList.clear();
    this.componentCache.clear();
    this.logger.info('Relationship manager reset');
  }

  // Compatibility methods for ComponentRegistry

  /**
   * Add a dependency relationship (backward compatibility)
   * @param sourceId The component that is depended on
   * @param targetId The component that depends on the source
   */
  addDependency(sourceId: string, targetId: string): void {
    this.addRelationship({
      sourceId,
      targetId,
      type: RelationshipType.PROP_DEPENDENCY,
      strength: 1.0,
      metadata: {
        description: 'Explicit dependency'
      }
    });
  }
  
  /**
   * Set a parent-child relationship (backward compatibility)
   * @param parentId The parent component ID
   * @param childId The child component ID
   */
  setParentChild(parentId: string, childId: string): void {
    this.addRelationship({
      sourceId: parentId,
      targetId: childId,
      type: RelationshipType.PARENT_CHILD,
      strength: 1.0,
      metadata: {
        description: 'Explicit parent-child relationship'
      }
    });
  }
  
  /**
   * Get visualization data for backward compatibility
   */
  visualizeGraph(): VisualizationData {
    return this.getVisualizationData();
  }
}