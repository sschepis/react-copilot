/**
 * Interface definition for the unified state adapter
 */

import { StatePath } from '../types/state-path';
import { StateSelector } from '../types/state-selector';
import { StateChangeListener, StateAccessListener } from '../types/state-listeners';
import { StateChangeMetadata } from '../types/state-metadata';
import { StateSubscriptionOptions } from '../types/state-subscription';
import { StateHistoryEntry } from '../types/state-history';
import { StateMiddleware } from '../types/state-middleware';
import { StateOptimizationSuggestion } from '../types/state-optimization';
import { StateSyncIssue } from '../types/state-sync';

/**
 * Enhanced state adapter interface with advanced features
 * This interface provides a superset of functionality beyond the basic StateAdapter
 */
export interface UnifiedStateAdapter {
  /**
   * Unique identifier for the adapter
   */
  id: string;
  
  /**
   * Human-readable name of the adapter
   */
  name: string;
  
  /**
   * Get a value from state using a path string or array path
   * @param path Path to the state value
   * @param defaultValue Default value if path doesn't exist
   */
  getState(path: StatePath, defaultValue?: any): any;
  
  /**
   * Set a value in state using a path string or array path
   * @param path Path to the state value
   * @param value Value to set
   * @param metadata Optional metadata about the change
   */
  setState(path: StatePath, value: any, metadata?: StateChangeMetadata): void;
  
  /**
   * Subscribe to changes at a specific path
   * @param path Path to subscribe to
   * @param listener Callback function for changes
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  subscribe(path: StatePath, listener: StateChangeListener, options?: StateSubscriptionOptions): () => void;
  
  /**
   * Create a memoized selector from state
   * @param selector Selector function
   * @param options Selector options
   * @returns Memoized selector function
   */
  createSelector<T, R>(selector: StateSelector<T, R>, options?: any): () => R;
  
  /**
   * Update state with a transaction (multiple updates as one operation)
   * @param updates Record of path -> value updates
   * @param metadata Optional metadata about the transaction
   */
  transaction(updates: Record<string, any>, metadata?: StateChangeMetadata): void;
  
  /**
   * Get the history of state changes
   * @param limit Maximum number of entries
   * @param path Optional path to filter history
   * @returns Array of history entries
   */
  getHistory(limit?: number, path?: StatePath): StateHistoryEntry[];
  
  /**
   * Enable time-travel debugging mode
   */
  enableTimeTravel(): void;
  
  /**
   * Disable time-travel debugging mode
   */
  disableTimeTravel(): void;
  
  /**
   * Time travel to a specific state in history
   * @param index History index to travel to
   */
  timeTravel(index: number): void;
  
  /**
   * Listen for state access (for tracking dependencies)
   * @param listener Callback for state access
   * @returns Unsubscribe function
   */
  onStateAccess(listener: StateAccessListener): () => void;
  
  /**
   * Add middleware to intercept state changes
   * @param middleware Middleware function
   * @returns Remove middleware function
   */
  addMiddleware(middleware: StateMiddleware): () => void;
  
  /**
   * Reset state to initial values
   * @param paths Optional specific paths to reset
   */
  resetState(paths?: StatePath[]): void;
  
  /**
   * Persist state to storage
   * @param storage Storage to save to ('local', 'session', or custom)
   * @param key Storage key
   * @param paths Optional specific paths to persist
   */
  persistState(storage: 'local' | 'session' | Storage, key: string, paths?: StatePath[]): void;
  
  /**
   * Restore state from storage
   * @param storage Storage to restore from ('local', 'session', or custom)
   * @param key Storage key
   * @returns Whether restoration was successful
   */
  restoreState(storage: 'local' | 'session' | Storage, key: string): boolean;
  
  /**
   * Hydrate state with a new state object
   * @param state State object to hydrate with
   * @param overwrite Whether to completely overwrite existing state
   */
  hydrateState(state: any, overwrite?: boolean): void;
  
  /**
   * Compute derived state that depends on multiple parts of state
   * @param dependencies Array of paths this computation depends on
   * @param compute Function to compute the derived value
   * @param options Computation options
   * @returns Computed value
   */
  computeDerived(
    dependencies: StatePath[],
    compute: (deps: any[]) => any,
    options?: { componentId?: string; memoize?: boolean }
  ): any;
  
  /**
   * Get all component IDs that use a particular state path
   * @param path Path to check dependencies for
   * @returns Array of component IDs
   */
  getComponentDependencies(path: StatePath): string[];
  
  /**
   * Get all state paths that a component depends on
   * @param componentId Component ID to check
   * @returns Array of state paths
   */
  getComponentStateDependencies(componentId: string): string[];
  
  /**
   * Detect state synchronization issues
   * @returns Array of synchronization issues
   */
  detectSyncIssues(): StateSyncIssue[];
  
  /**
   * Optimize state usage for a component
   * @param componentId Component ID to optimize
   * @returns Optimization suggestions
   */
  optimizeComponentStateUsage(componentId: string): StateOptimizationSuggestion[];
}