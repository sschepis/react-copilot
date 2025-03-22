/**
 * Implementation of the unified state manager
 */

import { EventEmitter } from '../../../utils/EventEmitter';
import { BaseStateAdapter, StateAdapterEvents } from '../StateAdapter';
import { IUnifiedStateManager } from './UnifiedStateManager.interface';
import { StatePath } from '../types/state-path';
import { StateChangeListener, StateAccessListener } from '../types/state-listeners';
import { StateChangeMetadata } from '../types/state-metadata';
import { StateSubscriptionOptions } from '../types/state-subscription';
import { StateHistoryEntry } from '../types/state-history';
import { StateMiddleware } from '../types/state-middleware';
import { StateOptimizationSuggestion } from '../types/state-optimization';
import { StateSyncIssue } from '../types/state-sync';
import { 
    deepClone, 
    deepEqual, 
    normalizeStatePath 
  } from './utils';
  
/**
 * Unified State Manager Implementation
 * 
 * Provides a central point for managing multiple state adapters and
 * facilitates communication and synchronization between them.
 */
export class UnifiedStateManager extends EventEmitter implements IUnifiedStateManager {
  // Private properties
  private adapters: Map<string, BaseStateAdapter> = new Map();
  private defaultAdapter: string | null = null;
  private stateAccessListeners: Set<StateAccessListener> = new Set();
  private history: StateHistoryEntry[] = [];
  private historyEnabled: boolean = false;
  private historyLimit: number = 100;
  private adapterMiddlewares: Map<string, StateMiddleware[]> = new Map();
  private componentStateDependencies: Map<string, Set<string>> = new Map();
  private stateComponentDependencies: Map<string, Set<string>> = new Map();
  
  /**
   * Create a new UnifiedStateManager
   */
  constructor() {
    super();
    this.setupEvents();
  }
  
  /**
   * Set up event listeners for state adapters
   */
  private setupEvents() {
    // Will be set up when adapters are registered
  }
  
  /**
   * Register a state adapter
   * @param adapter State adapter to register
   * @param isDefault Whether this adapter should be the default
   * @returns This manager instance
   */
  registerAdapter(adapter: BaseStateAdapter, isDefault = false): IUnifiedStateManager {
    if (!adapter.type) {
      throw new Error('Adapter must have a type');
    }
    
    const adapterId = `${adapter.type}-${Math.random().toString(36).substring(2, 9)}`;
    this.adapters.set(adapterId, adapter);
    
    // Set up event forwarding
    adapter.on(StateAdapterEvents.STATE_CHANGED, (data) => {
      this.emit('state-changed', { adapterId, ...data });
    });
    
    adapter.on(StateAdapterEvents.ACTION_EXECUTED, (data) => {
      this.emit('action-executed', { adapterId, ...data });
    });
    
    adapter.on(StateAdapterEvents.STATE_MODIFIED, (data) => {
      // Track in history if enabled
      if (this.historyEnabled) {
        this.addHistoryEntry(
          `${adapterId}:${data.path}`,
          data.newValue,
          data.oldValue,
          { source: adapterId }
        );
      }
      
      // Emit the event
      this.emit('state-modified', { adapterId, ...data });
    });
    
    adapter.on(StateAdapterEvents.ERROR, (data) => {
      this.emit('error', { adapterId, ...data });
    });
    
    // Set as default if requested or if this is the first adapter
    if (isDefault || this.defaultAdapter === null) {
      this.defaultAdapter = adapterId;
    }
    
    // Initialize middleware array for this adapter
    this.adapterMiddlewares.set(adapterId, []);
    
    return this;
  }
  
  /**
   * Unregister a state adapter
   * @param adapterId ID of the adapter to unregister
   * @returns Whether the adapter was successfully removed
   */
  unregisterAdapter(adapterId: string): boolean {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) return false;
    
    // Remove event listeners
    adapter.removeAllListeners();
    
    // Remove the adapter
    this.adapters.delete(adapterId);
    this.adapterMiddlewares.delete(adapterId);
    
    // If this was the default adapter, reset the default
    if (this.defaultAdapter === adapterId) {
      this.defaultAdapter = this.adapters.size > 0 ? 
        Array.from(this.adapters.keys())[0] : null;
    }
    
    return true;
  }
  
  /**
   * Get a state adapter by ID
   * @param adapterId ID of the adapter to get
   * @returns The adapter or null if not found
   */
  getAdapter(adapterId: string): BaseStateAdapter | null {
    return this.adapters.get(adapterId) || null;
  }
  
  /**
   * Get the default adapter
   * @returns The default adapter or null if none is registered
   */
  getDefaultAdapter(): BaseStateAdapter | null {
    return this.defaultAdapter ? this.adapters.get(this.defaultAdapter) || null : null;
  }
  
  /**
   * Get all registered adapters
   * @returns Map of adapter IDs to adapters
   */
  getAllAdapters(): Map<string, BaseStateAdapter> {
    return new Map(this.adapters);
  }
  
  /**
   * Set the default adapter
   * @param adapterId ID of the adapter to set as default
   * @returns Whether the adapter was found and set as default
   */
  setDefaultAdapter(adapterId: string): boolean {
    if (!this.adapters.has(adapterId)) return false;
    this.defaultAdapter = adapterId;
    return true;
  }
  
  /**
   * Get the entire state from an adapter
   * @param adapterId ID of the adapter to get state from, or null for default
   * @returns The state from the adapter
   */
  getState(adapterId?: string): any {
    const adapter = adapterId ? 
      this.adapters.get(adapterId) : 
      this.getDefaultAdapter();
    
    if (!adapter) {
      throw new Error(`No adapter found${adapterId ? ` with ID ${adapterId}` : ''}`);
    }
    
    return adapter.getState();
  }
  
  /**
   * Get a specific slice of state by path
   * @param path Path to the state slice
   * @param adapterId ID of the adapter to get state from, or null for default
   * @param defaultValue Default value if the path doesn't exist
   * @returns The state slice value
   */
  getStateSlice(path: string, adapterId?: string, defaultValue?: any): any {
    const adapter = adapterId ? 
      this.adapters.get(adapterId) : 
      this.getDefaultAdapter();
    
    if (!adapter) {
      throw new Error(`No adapter found${adapterId ? ` with ID ${adapterId}` : ''}`);
    }
    
    const value = adapter.getStateSlice(path);
    return value === undefined ? defaultValue : value;
  }
  
  /**
   * Modify a state value by path
   * @param path Path to the state to modify
   * @param value New value to set
   * @param adapterId ID of the adapter to modify state in, or null for default
   * @param metadata Additional metadata about the change
   * @returns Promise resolving when the change is complete
   */
  async modifyState(
    path: string, 
    value: any, 
    adapterId?: string, 
    metadata?: StateChangeMetadata
  ): Promise<void> {
    const adapter = adapterId ? 
      this.adapters.get(adapterId) : 
      this.getDefaultAdapter();
    
    if (!adapter) {
      throw new Error(`No adapter found${adapterId ? ` with ID ${adapterId}` : ''}`);
    }
    
    // Apply middlewares if any
    const finalValue = this.applyMiddlewares(
      adapterId || this.defaultAdapter || '',
      path,
      value,
      metadata
    );
    
    // Track component dependencies if componentId is provided
    if (metadata?.componentId) {
      this.trackComponentStateAccess(metadata.componentId, path);
    }
    
    // Modify the state
    await adapter.modifyState(path, finalValue);
    
    // Track in history if enabled
    if (this.historyEnabled) {
      const oldValue = adapter.getStateSlice(path);
      this.addHistoryEntry(
        `${adapterId || this.defaultAdapter}:${path}`,
        finalValue,
        oldValue,
        metadata
      );
    }
  }
  
  /**
   * Execute an action on an adapter
   * @param actionName Name of the action to execute
   * @param payload Data to pass to the action
   * @param adapterId ID of the adapter to execute the action on, or null for default
   * @returns Promise resolving when the action is complete
   */
  async executeAction(
    actionName: string, 
    payload?: any, 
    adapterId?: string
  ): Promise<void> {
    const adapter = adapterId ? 
      this.adapters.get(adapterId) : 
      this.getDefaultAdapter();
    
    if (!adapter) {
      throw new Error(`No adapter found${adapterId ? ` with ID ${adapterId}` : ''}`);
    }
    
    await adapter.executeAction(actionName, payload);
  }
  
  /**
   * Subscribe to changes on a specific path
   * @param path Path to subscribe to
   * @param listener Callback function to call when the value changes
   * @param options Subscription options
   * @param adapterId ID of the adapter to subscribe to, or null for default
   * @returns Unsubscribe function
   */
  subscribe(
    path: string,
    listener: StateChangeListener,
    options?: StateSubscriptionOptions,
    adapterId?: string
  ): () => void {
    const adapter = adapterId ? 
      this.adapters.get(adapterId) : 
      this.getDefaultAdapter();
    
    if (!adapter) {
      throw new Error(`No adapter found${adapterId ? ` with ID ${adapterId}` : ''}`);
    }
    
    // Track component dependencies if componentId is provided
    if (options?.componentId) {
      this.trackComponentStateAccess(options.componentId, path);
    }
    
    // Subscribe to the adapter's state changes
    let lastValue: any;
    
    const internalListener = (state: any) => {
      const newValue = adapter.getStateSlice(path);
      
      // Skip if the value hasn't changed and we only want to notify on deep changes
      if (options?.onlyOnDeepChange && deepEqual(lastValue, newValue)) {
        return;
      }
      
      // Call the listener with the old and new values
      try {
        listener(
          path, 
          newValue, 
          lastValue, 
          { componentId: options?.componentId }
        );
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
      
      lastValue = deepClone(newValue);
    };
    
    // Get initial value
    lastValue = adapter.getStateSlice(path);
    
    // Notify on initial value if requested
    if (options?.notifyOnInitial) {
      try {
        listener(
          path, 
          lastValue, 
          undefined, 
          { componentId: options?.componentId }
        );
      } catch (error) {
        console.error('Error in state change listener (initial):', error);
      }
    }
    
    // Subscribe to changes
    const unsubscribe = adapter.subscribeToChanges(internalListener);
    
    return () => {
      unsubscribe();
      
      // Remove component dependency tracking if componentId is provided
      if (options?.componentId) {
        this.removeComponentStateAccess(options.componentId, path);
      }
    };
  }
  
  /**
   * Enable time-travel debugging
   * @param limit Maximum number of history entries to keep
   */
  enableTimeTravel(limit: number = 100): void {
    this.historyEnabled = true;
    this.historyLimit = limit;
  }
  
  /**
   * Disable time-travel debugging
   */
  disableTimeTravel(): void {
    this.historyEnabled = false;
  }
  
  /**
   * Get the history of state changes
   * @param limit Maximum number of entries to return
   * @param path Optional path to filter by
   * @returns Array of history entries
   */
  getHistory(limit?: number, path?: string): StateHistoryEntry[] {
    let result = this.history;
    
    // Filter by path if provided
    if (path) {
      result = result.filter(entry => entry.path.endsWith(path));
    }
    
    // Limit if requested
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }
  
  /**
   * Time travel to a specific point in history
   * @param index Index in the history to travel to
   */
  timeTravel(index: number): void {
    if (!this.historyEnabled) {
      console.warn('Time travel is not enabled');
      return;
    }
    
    if (index < 0 || index >= this.history.length) {
      console.warn(`Invalid history index: ${index}`);
      return;
    }
    
    // Get all changes up to the selected index
    const changesMap = new Map<string, { adapterId: string; path: string; value: any }>();
    
    // Work backwards from the selected index
    for (let i = 0; i <= index; i++) {
      const entry = this.history[i];
      const [adapterId, path] = entry.path.split(':', 2);
      
      changesMap.set(entry.path, { adapterId, path, value: entry.value });
    }
    
    // Apply the changes with time travel metadata
    const promises: Promise<void>[] = [];
    changesMap.forEach(({ adapterId, path, value }) => {
      promises.push(
        this.modifyState(path, value, adapterId, { isTimeTravel: true })
      );
    });
    
    // Wait for all changes to be applied
    Promise.all(promises).then(() => {
      this.emit('time-travel-complete', { index });
    }).catch(error => {
      this.emit('error', { error, context: 'time-travel' });
    });
  }
  
  /**
   * Add a middleware function to intercept state changes
   * @param middleware Middleware function
   * @param adapterId ID of the adapter to add middleware to, or null for all adapters
   * @returns Function to remove the middleware
   */
  addMiddleware(middleware: StateMiddleware, adapterId?: string): () => void {
    if (adapterId) {
      // Add to specific adapter
      const middlewares = this.adapterMiddlewares.get(adapterId);
      if (!middlewares) {
        throw new Error(`No adapter found with ID ${adapterId}`);
      }
      
      middlewares.push(middleware);
      return () => {
        const index = middlewares.indexOf(middleware);
        if (index !== -1) {
          middlewares.splice(index, 1);
        }
      };
    } else {
      // Add to all adapters
      this.adapterMiddlewares.forEach(middlewares => {
        middlewares.push(middleware);
      });
      
      return () => {
        this.adapterMiddlewares.forEach(middlewares => {
          const index = middlewares.indexOf(middleware);
          if (index !== -1) {
            middlewares.splice(index, 1);
          }
        });
      };
    }
  }
  
  /**
   * Get all components that depend on a state path
   * @param path Path to check
   * @returns Array of component IDs
   */
  getComponentDependencies(path: string): string[] {
    const deps = this.stateComponentDependencies.get(path);
    return deps ? Array.from(deps) : [];
  }
  
  /**
   * Get all state paths that a component depends on
   * @param componentId Component ID to check
   * @returns Array of paths
   */
  getComponentStateDependencies(componentId: string): string[] {
    const deps = this.componentStateDependencies.get(componentId);
    return deps ? Array.from(deps) : [];
  }
  
  /**
   * Detect synchronization issues between adapters
   * @returns Array of sync issues
   */
  detectSyncIssues(): StateSyncIssue[] {
    const issues: StateSyncIssue[] = [];
    
    // This would be a more complex implementation in a real system
    // For now, we'll return an empty array
    return issues;
  }
  
  /**
   * Generate optimization suggestions for a component's state usage
   * @param componentId Component ID to analyze
   * @returns Array of optimization suggestions
   */
  optimizeComponentStateUsage(componentId: string): StateOptimizationSuggestion[] {
    const suggestions: StateOptimizationSuggestion[] = [];
    const statePaths = this.getComponentStateDependencies(componentId);
    
    // Check for too many dependencies
    if (statePaths.length > 10) {
      suggestions.push({
        issue: 'Component has many state dependencies',
        suggestion: 'Consider breaking the component into smaller components with fewer dependencies',
        impact: 'high'
      });
    }
    
    // Check for deep paths
    const deepPaths = statePaths.filter(path => path.split('.').length > 3);
    if (deepPaths.length > 0) {
      suggestions.push({
        issue: 'Component uses deeply nested state paths',
        suggestion: 'Use selectors or memoization to access deep state paths',
        path: deepPaths[0],
        impact: 'medium'
      });
    }
    
    // This would be a more comprehensive implementation in a real system
    return suggestions;
  }
  
  // Private utility methods
  
  /**
   * Track component state access
   * @param componentId Component ID
   * @param path State path
   */
  private trackComponentStateAccess(componentId: string, path: string): void {
    // Track component -> state dependencies
    if (!this.componentStateDependencies.has(componentId)) {
      this.componentStateDependencies.set(componentId, new Set());
    }
    this.componentStateDependencies.get(componentId)!.add(path);
    
    // Track state -> component dependencies
    if (!this.stateComponentDependencies.has(path)) {
      this.stateComponentDependencies.set(path, new Set());
    }
    this.stateComponentDependencies.get(path)!.add(componentId);
    
    // Notify listeners
    this.stateAccessListeners.forEach(listener => {
      try {
        listener(path, componentId);
      } catch (error) {
        console.error('Error in state access listener:', error);
      }
    });
  }
  
  /**
   * Remove state access tracking for a component
   * @param componentId Component ID
   * @param path State path
   */
  private removeComponentStateAccess(componentId: string, path: string): void {
    // Remove from component -> state dependencies
    const componentDeps = this.componentStateDependencies.get(componentId);
    if (componentDeps) {
      componentDeps.delete(path);
      if (componentDeps.size === 0) {
        this.componentStateDependencies.delete(componentId);
      }
    }
    
    // Remove from state -> component dependencies
    const stateDeps = this.stateComponentDependencies.get(path);
    if (stateDeps) {
      stateDeps.delete(componentId);
      if (stateDeps.size === 0) {
        this.stateComponentDependencies.delete(path);
      }
    }
  }
  
  /**
   * Add an entry to the state history
   * @param path Path that was changed
   * @param value New value
   * @param previousValue Old value
   * @param metadata Additional metadata
   */
  private addHistoryEntry(
    path: string,
    value: any,
    previousValue: any,
    metadata?: StateChangeMetadata
  ): void {
    if (!this.historyEnabled) return;
    
    this.history.unshift({
      timestamp: Date.now(),
      path,
      value: deepClone(value),
      previousValue: deepClone(previousValue),
      metadata
    });
    
    // Trim history if needed
    if (this.history.length > this.historyLimit) {
      this.history = this.history.slice(0, this.historyLimit);
    }
    
    this.emit('history-entry-added', { 
      path, 
      value, 
      previousValue, 
      metadata 
    });
  }
  
  /**
   * Apply middlewares to a state change
   * @param adapterId Adapter ID
   * @param path Path being changed
   * @param value New value
   * @param metadata Change metadata
   * @returns Potentially modified value
   */
  private applyMiddlewares(
    adapterId: string,
    path: string,
    value: any,
    metadata?: StateChangeMetadata
  ): any {
    const middlewares = this.adapterMiddlewares.get(adapterId);
    if (!middlewares || middlewares.length === 0) {
      return value;
    }
    
    let finalValue = value;
    let index = 0;
    
    const executeMiddleware = (p: string, v: any) => {
      if (index >= middlewares.length) {
        finalValue = v;
        return;
      }
      
      const currentMiddleware = middlewares[index++];
      currentMiddleware(p, v, executeMiddleware, metadata);
    };
    
    executeMiddleware(path, value);
    return finalValue;
  }
}