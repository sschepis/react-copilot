/**
 * Interface definition for the unified state manager
 */

import { BaseStateAdapter } from '../../state/StateAdapter';
import { StatePath } from '../types/state-path';
import { StateChangeListener } from '../types/state-listeners';
import { StateChangeMetadata } from '../types/state-metadata';
import { StateSubscriptionOptions } from '../types/state-subscription';
import { StateHistoryEntry } from '../types/state-history';
import { StateMiddleware } from '../types/state-middleware';
import { StateOptimizationSuggestion } from '../types/state-optimization';
import { StateSyncIssue } from '../types/state-sync';

/**
 * Interface for the unified state manager
 * Provides a central point for managing multiple state adapters
 */
export interface IUnifiedStateManager {
  /**
   * Register a state adapter
   * @param adapter State adapter to register
   * @param isDefault Whether this adapter should be the default
   * @returns This manager instance
   */
  registerAdapter(adapter: BaseStateAdapter, isDefault?: boolean): IUnifiedStateManager;
  
  /**
   * Unregister a state adapter
   * @param adapterId ID of the adapter to unregister
   * @returns Whether the adapter was successfully removed
   */
  unregisterAdapter(adapterId: string): boolean;
  
  /**
   * Get a state adapter by ID
   * @param adapterId ID of the adapter to get
   * @returns The adapter or null if not found
   */
  getAdapter(adapterId: string): BaseStateAdapter | null;
  
  /**
   * Get the default adapter
   * @returns The default adapter or null if none is registered
   */
  getDefaultAdapter(): BaseStateAdapter | null;
  
  /**
   * Get all registered adapters
   * @returns Map of adapter IDs to adapters
   */
  getAllAdapters(): Map<string, BaseStateAdapter>;
  
  /**
   * Set the default adapter
   * @param adapterId ID of the adapter to set as default
   * @returns Whether the adapter was found and set as default
   */
  setDefaultAdapter(adapterId: string): boolean;
  
  /**
   * Get the entire state from an adapter
   * @param adapterId ID of the adapter to get state from, or null for default
   * @returns The state from the adapter
   */
  getState(adapterId?: string): any;
  
  /**
   * Get a specific slice of state by path
   * @param path Path to the state slice
   * @param adapterId ID of the adapter to get state from, or null for default
   * @param defaultValue Default value if the path doesn't exist
   * @returns The state slice value
   */
  getStateSlice(path: string, adapterId?: string, defaultValue?: any): any;
  
  /**
   * Modify a state value by path
   * @param path Path to the state to modify
   * @param value New value to set
   * @param adapterId ID of the adapter to modify state in, or null for default
   * @param metadata Additional metadata about the change
   * @returns Promise resolving when the change is complete
   */
  modifyState(
    path: string, 
    value: any, 
    adapterId?: string, 
    metadata?: StateChangeMetadata
  ): Promise<void>;
  
  /**
   * Execute an action on an adapter
   * @param actionName Name of the action to execute
   * @param payload Data to pass to the action
   * @param adapterId ID of the adapter to execute the action on, or null for default
   * @returns Promise resolving when the action is complete
   */
  executeAction(
    actionName: string, 
    payload?: any, 
    adapterId?: string
  ): Promise<void>;
  
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
  ): () => void;
  
  /**
   * Enable time-travel debugging
   * @param limit Maximum number of history entries to keep
   */
  enableTimeTravel(limit?: number): void;
  
  /**
   * Disable time-travel debugging
   */
  disableTimeTravel(): void;
  
  /**
   * Get the history of state changes
   * @param limit Maximum number of entries to return
   * @param path Optional path to filter by
   * @returns Array of history entries
   */
  getHistory(limit?: number, path?: string): StateHistoryEntry[];
  
  /**
   * Time travel to a specific point in history
   * @param index Index in the history to travel to
   */
  timeTravel(index: number): void;
  
  /**
   * Add a middleware function to intercept state changes
   * @param middleware Middleware function
   * @param adapterId ID of the adapter to add middleware to, or null for all adapters
   * @returns Function to remove the middleware
   */
  addMiddleware(middleware: StateMiddleware, adapterId?: string): () => void;
  
  /**
   * Get all components that depend on a state path
   * @param path Path to check
   * @returns Array of component IDs
   */
  getComponentDependencies(path: string): string[];
  
  /**
   * Get all state paths that a component depends on
   * @param componentId Component ID to check
   * @returns Array of paths
   */
  getComponentStateDependencies(componentId: string): string[];
  
  /**
   * Detect synchronization issues between adapters
   * @returns Array of sync issues
   */
  detectSyncIssues(): StateSyncIssue[];
  
  /**
   * Generate optimization suggestions for a component's state usage
   * @param componentId Component ID to analyze
   * @returns Array of optimization suggestions
   */
  optimizeComponentStateUsage(componentId: string): StateOptimizationSuggestion[];
}