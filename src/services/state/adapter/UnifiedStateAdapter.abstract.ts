/**
 * Abstract base class for the unified state adapter
 */

import { EventEmitter } from '../../../utils/EventEmitter';
import { StatePath } from '../types/state-path';
import { StateChangeListener, StateAccessListener } from '../types/state-listeners';
import { StateChangeMetadata } from '../types/state-metadata';
import { StateSubscriptionOptions } from '../types/state-subscription';
import { StateSelector } from '../types/state-selector';
import { StateHistoryEntry } from '../types/state-history';
import { StateMiddleware } from '../types/state-middleware';
import { StateOptimizationSuggestion } from '../types/state-optimization';
import { StateSyncIssue } from '../types/state-sync';
import { UnifiedStateAdapter } from './UnifiedStateAdapter.interface';

/**
 * Abstract base class providing shared functionality for unified state adapters
 */
export abstract class AbstractUnifiedStateAdapter extends EventEmitter implements UnifiedStateAdapter {
  // Required properties from interface
  public id: string;
  public name: string;
  
  // Internal properties
  protected history: StateHistoryEntry[] = [];
  protected historyEnabled: boolean = false;
  protected historyLimit: number = 100;
  protected stateAccessListeners: Set<StateAccessListener> = new Set();
  protected middlewares: StateMiddleware[] = [];
  
  /**
   * Create a new AbstractUnifiedStateAdapter
   * @param id Unique identifier for this adapter
   * @param name Human-readable name
   */
  constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }
  
  /**
   * Get a value from state using a path
   * @param path Path to the state value
   * @param defaultValue Default value if path doesn't exist
   */
  abstract getState(path: StatePath, defaultValue?: any): any;
  
  /**
   * Set a value in state
   * @param path Path to the state value
   * @param value Value to set
   * @param metadata Optional metadata about the change
   */
  abstract setState(path: StatePath, value: any, metadata?: StateChangeMetadata): void;
  
  /**
   * Subscribe to changes at a specific path
   * @param path Path to subscribe to
   * @param listener Callback function for changes
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  abstract subscribe(path: StatePath, listener: StateChangeListener, options?: StateSubscriptionOptions): () => void;

  /**
   * Create a memoized selector from state
   * @param selector Selector function
   * @param options Selector options
   * @returns Memoized selector function
   */
  abstract createSelector<T, R>(selector: StateSelector<T, R>, options?: any): () => R;
  
  /**
   * Update state with a transaction (multiple updates as one operation)
   * @param updates Record of path -> value updates
   * @param metadata Optional metadata about the transaction
   */
  abstract transaction(updates: Record<string, any>, metadata?: StateChangeMetadata): void;
  
  /**
   * Normalize a path to string format
   * @param path Path to normalize
   * @returns Normalized path string
   */
  protected normalizePath(path: StatePath): string {
    if (Array.isArray(path)) {
      return path.join('.');
    }
    return path;
  }
  
  /**
   * Add an entry to the state history
   * @param path Path that was changed
   * @param value New value
   * @param previousValue Old value
   * @param metadata Additional metadata
   */
  protected addHistoryEntry(path: string, value: any, previousValue: any, metadata?: StateChangeMetadata): void {
    if (!this.historyEnabled) return;
    
    this.history.unshift({
      timestamp: Date.now(),
      path,
      value,
      previousValue,
      metadata
    });
    
    // Trim history if needed
    if (this.history.length > this.historyLimit) {
      this.history = this.history.slice(0, this.historyLimit);
    }
  }
  
  /**
   * Apply middlewares to a state change
   * @param path Path being changed
   * @param value New value
   * @param metadata Change metadata
   * @returns Potentially modified value
   */
  protected applyMiddlewares(path: string, value: any, metadata?: StateChangeMetadata): any {
    if (this.middlewares.length === 0) {
      return value;
    }
    
    let finalValue = value;
    let index = 0;
    
    const executeMiddleware = (path: string, value: any) => {
      if (index >= this.middlewares.length) {
        finalValue = value;
        return;
      }
      
      const currentMiddleware = this.middlewares[index++];
      currentMiddleware(path, value, executeMiddleware, metadata);
    };
    
    executeMiddleware(path, value);
    return finalValue;
  }
  
  /**
   * Notify state access listeners
   * @param path Path that was accessed
   * @param componentId Component ID that accessed the state
   * @param metadata Additional metadata
   */
  protected notifyStateAccess(path: string, componentId?: string, metadata?: StateChangeMetadata): void {
    this.stateAccessListeners.forEach(listener => {
      try {
        listener(path, componentId, metadata);
      } catch (error) {
        console.error('Error in state access listener:', error);
      }
    });
  }
  
  // Abstract methods that must be implemented by concrete adapters
  
  /**
   * Get the history of state changes
   * @param limit Maximum number of entries
   * @param path Optional path to filter by
   * @returns Array of history entries
   */
  abstract getHistory(limit?: number, path?: StatePath): StateHistoryEntry[];
  
  /**
   * Enable time-travel debugging mode
   */
  abstract enableTimeTravel(): void;
  
  /**
   * Disable time-travel debugging mode
   */
  abstract disableTimeTravel(): void;
  
  /**
   * Time travel to a specific state in history
   * @param index History index to travel to
   */
  abstract timeTravel(index: number): void;
  
  /**
   * Register a state access listener
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  abstract onStateAccess(listener: StateAccessListener): () => void;
  
  /**
   * Add middleware to intercept state changes
   * @param middleware Middleware function
   * @returns Remove middleware function
   */
  abstract addMiddleware(middleware: StateMiddleware): () => void;
  
  /**
   * Reset state to initial values
   * @param paths Optional specific paths to reset
   */
  abstract resetState(paths?: StatePath[]): void;
  
  /**
   * Persist state to storage
   * @param storage Storage to save to
   * @param key Storage key
   * @param paths Optional specific paths to persist
   */
  abstract persistState(storage: 'local' | 'session' | Storage, key: string, paths?: StatePath[]): void;
  
  /**
   * Restore state from storage
   * @param storage Storage to restore from
   * @param key Storage key
   * @returns Whether restoration was successful
   */
  abstract restoreState(storage: 'local' | 'session' | Storage, key: string): boolean;
  
  /**
   * Hydrate state with a new state object
   * @param state State object to hydrate with
   * @param overwrite Whether to completely overwrite existing state
   */
  abstract hydrateState(state: any, overwrite?: boolean): void;
  
  /**
   * Compute derived state
   * @param dependencies Array of paths this computation depends on
   * @param compute Function to compute the derived value
   * @param options Computation options
   * @returns Computed value
   */
  abstract computeDerived(
    dependencies: StatePath[],
    compute: (deps: any[]) => any,
    options?: { componentId?: string; memoize?: boolean }
  ): any;
  
  /**
   * Get component dependencies for a state path
   * @param path Path to check
   * @returns Array of component IDs
   */
  abstract getComponentDependencies(path: StatePath): string[];
  
  /**
   * Get state paths that a component depends on
   * @param componentId Component ID to check
   * @returns Array of state paths
   */
  abstract getComponentStateDependencies(componentId: string): string[];
  
  /**
   * Detect state synchronization issues
   * @returns Array of sync issues
   */
  abstract detectSyncIssues(): StateSyncIssue[];
  
  /**
   * Optimize state usage for a component
   * @param componentId Component ID to optimize
   * @returns Optimization suggestions
   */
  abstract optimizeComponentStateUsage(componentId: string): StateOptimizationSuggestion[];
}