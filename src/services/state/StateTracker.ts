import { ModifiableComponent } from '../../utils/types';
import { EventEmitter } from '../../utils/EventEmitter';
import { logger, LogCategory } from '../../utils/LoggingSystem';
import { getStateManager, StateManager, StateManagerEvents } from './StateManager';

/**
 * State usage information for a component
 */
export interface StateUsage {
  componentId: string;
  adapterId: string;
  paths: Set<string>;
  lastAccessed: number;
  accessCount: number;
}

/**
 * State dependency information
 */
export interface StateDependency {
  componentId: string;
  stateAdapter: string;
  path: string;
  dependentComponents: Set<string>;
}

/**
 * Events emitted by the StateTracker
 */
export enum StateTrackerEvents {
  STATE_ACCESSED = 'state_accessed',
  STATE_DEPENDENCY_CHANGED = 'state_dependency_changed',
  COMPONENT_STATE_USAGE_CHANGED = 'component_state_usage_changed'
}

/**
 * Tracks which components use which state
 * Used for dependency analysis and optimization
 */
export class StateTracker extends EventEmitter {
  private stateUsage: Map<string, Map<string, StateUsage>> = new Map();
  private stateDependencies: Map<string, StateDependency> = new Map();
  private stateManager: StateManager;
  private log = logger.getChildLogger(LogCategory.STATE);

  /**
   * Create a new state tracker
   * @param stateManager Optional state manager instance
   */
  constructor(stateManager?: StateManager) {
    super();
    this.stateManager = stateManager || getStateManager();
    
    // Listen for state changes
    this.stateManager.on(StateManagerEvents.STATE_CHANGED, this.handleStateChanged.bind(this));
  }
  
  /**
   * Track state access by a component
   * @param componentId ID of the component
   * @param adapterId ID of the state adapter
   * @param path Path to the state being accessed
   */
  trackStateAccess(componentId: string, adapterId: string, path: string): void {
    // Get or create component state usage map
    if (!this.stateUsage.has(componentId)) {
      this.stateUsage.set(componentId, new Map());
    }
    
    const componentUsage = this.stateUsage.get(componentId)!;
    
    // Get or create usage for this adapter
    if (!componentUsage.has(adapterId)) {
      componentUsage.set(adapterId, {
        componentId,
        adapterId,
        paths: new Set(),
        lastAccessed: Date.now(),
        accessCount: 0
      });
    }
    
    const usage = componentUsage.get(adapterId)!;
    
    // Update usage information
    usage.paths.add(path);
    usage.lastAccessed = Date.now();
    usage.accessCount++;
    
    // Update dependency information
    const dependencyKey = `${adapterId}:${path}`;
    if (!this.stateDependencies.has(dependencyKey)) {
      this.stateDependencies.set(dependencyKey, {
        componentId,
        stateAdapter: adapterId,
        path,
        dependentComponents: new Set([componentId])
      });
    } else {
      const dependency = this.stateDependencies.get(dependencyKey)!;
      dependency.dependentComponents.add(componentId);
    }
    
    // Emit state accessed event
    this.emit(StateTrackerEvents.STATE_ACCESSED, {
      componentId,
      adapterId,
      path,
      timestamp: usage.lastAccessed
    });
    
    this.log.debug(`Component ${componentId} accessed state ${adapterId}.${path}`);
  }
  
  /**
   * Get state usage for a component
   * @param componentId ID of the component
   */
  getComponentStateUsage(componentId: string): StateUsage[] {
    const componentUsage = this.stateUsage.get(componentId);
    if (!componentUsage) {
      return [];
    }
    
    return Array.from(componentUsage.values());
  }
  
  /**
   * Get all components that depend on a specific state path
   * @param adapterId ID of the state adapter
   * @param path Path to the state
   */
  getDependentComponents(adapterId: string, path: string): string[] {
    const dependencyKey = `${adapterId}:${path}`;
    const dependency = this.stateDependencies.get(dependencyKey);
    
    if (!dependency) {
      return [];
    }
    
    return Array.from(dependency.dependentComponents);
  }
  
  /**
   * Handle state change events
   * @param event State change event
   */
  private handleStateChanged(event: any): void {
    const { adapterId, state } = event;
    
    // For now, we're just logging the change
    this.log.debug(`State changed in adapter ${adapterId}`);
    
    // In a more advanced implementation, we could trigger component updates
    // based on their dependencies
  }
  
  /**
   * Clear state usage for a component
   * @param componentId ID of the component
   */
  clearComponentUsage(componentId: string): void {
    // Remove from component usage map
    this.stateUsage.delete(componentId);
    
    // Remove from dependencies
    for (const [key, dependency] of this.stateDependencies.entries()) {
      dependency.dependentComponents.delete(componentId);
      
      // Remove empty dependencies
      if (dependency.dependentComponents.size === 0) {
        this.stateDependencies.delete(key);
      }
    }
  }
  
  /**
   * Get all component state dependencies
   */
  getAllStateDependencies(): StateDependency[] {
    return Array.from(this.stateDependencies.values());
  }
  
  /**
   * Find components with similar state usage patterns
   * @param componentId ID of the component to find similar patterns for
   * @param threshold Similarity threshold (0-1)
   */
  findSimilarStateUsage(componentId: string, threshold: number = 0.5): {
    componentId: string;
    similarity: number;
  }[] {
    const componentUsage = this.stateUsage.get(componentId);
    if (!componentUsage) {
      return [];
    }
    
    // Get all paths used by this component
    const componentPaths = new Set<string>();
    for (const usage of componentUsage.values()) {
      for (const path of usage.paths) {
        componentPaths.add(`${usage.adapterId}:${path}`);
      }
    }
    
    // Calculate similarity with other components
    const similarities: Array<{
      componentId: string;
      similarity: number;
    }> = [];
    
    for (const [otherComponentId, otherUsage] of this.stateUsage.entries()) {
      // Skip comparison with self
      if (otherComponentId === componentId) {
        continue;
      }
      
      // Get all paths used by the other component
      const otherPaths = new Set<string>();
      for (const usage of otherUsage.values()) {
        for (const path of usage.paths) {
          otherPaths.add(`${usage.adapterId}:${path}`);
        }
      }
      
      // Calculate Jaccard similarity
      const intersection = new Set<string>();
      for (const path of componentPaths) {
        if (otherPaths.has(path)) {
          intersection.add(path);
        }
      }
      
      const union = new Set<string>([...componentPaths, ...otherPaths]);
      const similarity = intersection.size / union.size;
      
      // Add to results if above threshold
      if (similarity >= threshold) {
        similarities.push({
          componentId: otherComponentId,
          similarity
        });
      }
    }
    
    // Sort by similarity (descending)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
}

// Singleton instance
let instance: StateTracker | null = null;

/**
 * Get the singleton instance of the StateTracker
 */
export function getStateTracker(): StateTracker {
  if (!instance) {
    instance = new StateTracker();
  }
  return instance;
}