import { ModifiableComponent, ComponentRelationship } from '../../../utils/types';
import { RelationshipType, ComponentGraphRelationship } from './types';
import { RelationshipManager } from './RelationshipManager';
import { LoggingSystem, LogCategory } from '../../../utils/LoggingSystem';

/**
 * Analyzer for component relationships
 * Provides advanced analysis capabilities on top of the relationship graph
 */
export class RelationshipAnalyzer {
  private relationshipManager: RelationshipManager;
  private logger = LoggingSystem.getInstance().getChildLogger(LogCategory.COMPONENT, {
    component: 'RelationshipAnalyzer'
  });

  /**
   * Create a new relationship analyzer
   * @param relationshipManager The relationship manager to use
   */
  constructor(relationshipManager: RelationshipManager) {
    this.relationshipManager = relationshipManager;
  }

  /**
   * Find the shortest path between two components
   * @param sourceId The source component ID
   * @param targetId The target component ID
   */
  findShortestPath(sourceId: string, targetId: string): string[] {
    // Use breadth-first search to find shortest path
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [{ id: sourceId, path: [sourceId] }];

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === targetId) {
        return path;
      }

      if (visited.has(id)) continue;
      visited.add(id);

      // Get all connected components
      const connected = this.relationshipManager.getConnectedComponents(id);
      
      // Add to queue
      for (const nextId of connected) {
        if (!visited.has(nextId)) {
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }

    return []; // No path found
  }

  /**
   * Find components that form a cycle
   * @param startComponentId The component ID to start from
   */
  findCycles(startComponentId: string): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];
    const pathSet = new Set<string>();

    // DFS function to detect cycles
    const dfs = (currentId: string) => {
      if (pathSet.has(currentId)) {
        // Found a cycle
        const cycleStart = path.indexOf(currentId);
        cycles.push(path.slice(cycleStart).concat(currentId));
        return;
      }

      if (visited.has(currentId)) return;

      visited.add(currentId);
      path.push(currentId);
      pathSet.add(currentId);

      // Get all connections
      const connected = this.relationshipManager.getConnectedComponents(currentId);

      for (const nextId of connected) {
        dfs(nextId);
      }

      path.pop();
      pathSet.delete(currentId);
    };

    dfs(startComponentId);
    return cycles;
  }

  /**
   * Identify highly connected components (hub components)
   * @param threshold Minimum number of connections to be considered a hub
   */
  findHubComponents(threshold: number = 5): Array<{ id: string; connectionCount: number }> {
    const hubs: Array<{ id: string; connectionCount: number }> = [];
    
    // Check all components
    const visualizationData = this.relationshipManager.getVisualizationData();
    
    for (const node of visualizationData.nodes) {
      if (node.neighbors >= threshold) {
        hubs.push({
          id: node.id,
          connectionCount: node.neighbors
        });
      }
    }
    
    // Sort by connection count (descending)
    return hubs.sort((a, b) => b.connectionCount - a.connectionCount);
  }

  /**
   * Identify isolated components (components with no/few connections)
   * @param threshold Maximum number of connections to be considered isolated
   */
  findIsolatedComponents(threshold: number = 1): string[] {
    const isolated: string[] = [];
    const visualizationData = this.relationshipManager.getVisualizationData();
    
    for (const node of visualizationData.nodes) {
      if (node.neighbors <= threshold) {
        isolated.push(node.id);
      }
    }
    
    return isolated;
  }

  /**
   * Analyze dependency depth (how deeply nested the component dependencies are)
   * @param componentId The component ID to analyze
   */
  analyzeDependencyDepth(componentId: string): {
    maxDepth: number;
    dependencyPaths: { [key: string]: string[] };
  } {
    const visited = new Set<string>();
    const dependencyPaths: { [key: string]: string[] } = {};
    let maxDepth = 0;

    // Recursive function to explore dependencies
    const exploreDependencies = (id: string, currentPath: string[] = []) => {
      if (visited.has(id)) return;
      visited.add(id);

      const newPath = [...currentPath, id];
      
      // Update max depth
      if (newPath.length > maxDepth) {
        maxDepth = newPath.length;
      }

      // Store path to this component
      if (id !== componentId) {
        dependencyPaths[id] = newPath;
      }

      // Get component relationships
      const relationship = this.relationshipManager.getComponentRelationship(id);
      
      // Explore dependencies
      for (const depId of relationship.dependsOn) {
        exploreDependencies(depId, newPath);
      }
    };

    exploreDependencies(componentId);

    return {
      maxDepth: Math.max(0, maxDepth - 1), // Subtract 1 to exclude the component itself
      dependencyPaths
    };
  }

  /**
   * Find common dependencies between components
   * @param componentIds Array of component IDs to analyze
   */
  findCommonDependencies(componentIds: string[]): string[] {
    if (componentIds.length === 0) return [];
    
    // Get dependencies for each component
    const dependencySets = componentIds.map(id => {
      const relationship = this.relationshipManager.getComponentRelationship(id);
      return new Set(relationship.dependsOn);
    });
    
    // Find intersection of all dependency sets
    const commonDependencies = [...dependencySets[0]].filter(depId => 
      dependencySets.every(set => set.has(depId))
    );
    
    return commonDependencies;
  }

  /**
   * Analyze prop usage patterns across components
   * @param componentId The component ID to analyze
   */
  analyzePropUsage(componentId: string): Array<{
    propName: string;
    sourceComponents: string[];
    targetComponents: string[];
    usageCount: number;
  }> {
    const propUsage = new Map<string, {
      sourceComponents: Set<string>;
      targetComponents: Set<string>;
      usageCount: number;
    }>();
    
    // Get all relationships for the component
    const relationships = this.relationshipManager['getRelationships'](componentId);
    
    for (const rel of relationships) {
      if (rel.type === RelationshipType.PROP_DEPENDENCY && rel.metadata?.propNames) {
        const propNames = rel.metadata.propNames as string[];
        
        for (const propName of propNames) {
          if (!propUsage.has(propName)) {
            propUsage.set(propName, {
              sourceComponents: new Set(),
              targetComponents: new Set(),
              usageCount: 0
            });
          }
          
          const usage = propUsage.get(propName)!;
          
          if (rel.sourceId === componentId) {
            usage.targetComponents.add(rel.targetId);
          } else {
            usage.sourceComponents.add(rel.sourceId);
          }
          
          usage.usageCount++;
        }
      }
    }
    
    // Convert map to array result
    return Array.from(propUsage.entries()).map(([propName, usage]) => ({
      propName,
      sourceComponents: [...usage.sourceComponents],
      targetComponents: [...usage.targetComponents],
      usageCount: usage.usageCount
    }));
  }

  /**
   * Get components in dependency order (topological sort)
   * Useful for understanding initialization or rendering order
   */
  getComponentsInDependencyOrder(): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    const visualizationData = this.relationshipManager.getVisualizationData();
    const nodeIds = visualizationData.nodes.map(n => n.id);
    
    // Topological sort with cycle detection
    const visit = (id: string): boolean => {
      if (temp.has(id)) {
        this.logger.warn(`Cycle detected involving component: ${id}`);
        return false; // Cycle detected
      }
      
      if (visited.has(id)) return true;
      
      temp.add(id);
      
      // Get component relationships
      const relationship = this.relationshipManager.getComponentRelationship(id);
      
      // Visit all dependencies
      for (const depId of relationship.dependsOn) {
        if (!visit(depId)) return false;
      }
      
      temp.delete(id);
      visited.add(id);
      result.push(id);
      
      return true;
    };
    
    // Try to build topological ordering
    for (const id of nodeIds) {
      if (!visited.has(id)) {
        if (!visit(id)) {
          this.logger.warn('Could not determine a clean dependency order due to cycles');
          break;
        }
      }
    }
    
    return result.reverse();
  }
}