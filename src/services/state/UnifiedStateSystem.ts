/**
 * Unified State System
 * 
 * Top-level API for the unified state management system that provides
 * a simplified interface for consumers.
 */

import { EventEmitter } from '../../utils/EventEmitter';
import { BaseStateAdapter } from './StateAdapter';
import { UnifiedStateManager } from './manager/UnifiedStateManager';
import { StatePath } from './types/state-path';
import { StateChangeListener } from './types/state-listeners';
import { StateChangeMetadata } from './types/state-metadata';
import { StateSubscriptionOptions } from './types/state-subscription';
import { StateMiddleware } from './types/state-middleware';

/**
 * Main entry point for the unified state management system
 * Provides a simplified API that abstracts away the complexity
 * of working with multiple state adapters.
 */
export class UnifiedStateSystem extends EventEmitter {
  private manager: UnifiedStateManager;
  private isInitialized: boolean = false;
  
  /**
   * Create a new UnifiedStateSystem
   */
  constructor() {
    super();
    this.manager = new UnifiedStateManager();
    
    // Forward events from the manager
    this.manager.on('state-changed', (data) => this.emit('state-changed', data));
    this.manager.on('state-modified', (data) => this.emit('state-modified', data));
    this.manager.on('action-executed', (data) => this.emit('action-executed', data));
    this.manager.on('error', (data) => this.emit('error', data));
    this.manager.on('time-travel-complete', (data) => this.emit('time-travel-complete', data));
  }
  
  /**
   * Initialize the state system with adapters
   * @param adapters Array of state adapters to register
   * @param defaultAdapterIndex Index of the default adapter (default: 0)
   * @returns This instance for chaining
   */
  initialize(adapters: BaseStateAdapter[], defaultAdapterIndex: number = 0): UnifiedStateSystem {
    if (this.isInitialized) {
      console.warn('UnifiedStateSystem already initialized. Call reset() first to reinitialize.');
      return this;
    }
    
    // Register all adapters
    adapters.forEach((adapter, index) => {
      this.manager.registerAdapter(adapter, index === defaultAdapterIndex);
    });
    
    this.isInitialized = true;
    this.emit('initialized', { adaptersCount: adapters.length });
    
    return this;
  }
  
  /**
   * Reset the state system
   * @returns This instance for chaining
   */
  reset(): UnifiedStateSystem {
    // Get all adapter IDs
    const adapters = this.manager.getAllAdapters();
    
    // Unregister all adapters
    adapters.forEach((_, id) => {
      this.manager.unregisterAdapter(id);
    });
    
    this.isInitialized = false;
    this.emit('reset');
    
    return this;
  }
  
  /**
   * Get a value from state
   * @param path Path to the state value
   * @param defaultValue Default value if the path doesn't exist
   * @param adapterId Optional ID of the adapter to use
   * @returns The state value
   */
  get(path: StatePath, defaultValue?: any, adapterId?: string): any {
    this.ensureInitialized();
    const normalizedPath = this.normalizePath(path);
    return this.manager.getStateSlice(normalizedPath, adapterId, defaultValue);
  }
  
  /**
   * Set a value in state
   * @param path Path to the state value
   * @param value Value to set
   * @param metadata Optional metadata about the change
   * @param adapterId Optional ID of the adapter to use
   * @returns Promise that resolves when the value is set
   */
  async set(path: StatePath, value: any, metadata?: StateChangeMetadata, adapterId?: string): Promise<void> {
    this.ensureInitialized();
    const normalizedPath = this.normalizePath(path);
    await this.manager.modifyState(normalizedPath, value, adapterId, metadata);
  }
  
  /**
   * Subscribe to changes on a state path
   * @param path Path to subscribe to
   * @param listener Callback for changes
   * @param options Subscription options
   * @param adapterId Optional ID of the adapter to use
   * @returns Unsubscribe function
   */
  subscribe(
    path: StatePath,
    listener: StateChangeListener,
    options?: StateSubscriptionOptions,
    adapterId?: string
  ): () => void {
    this.ensureInitialized();
    const normalizedPath = this.normalizePath(path);
    return this.manager.subscribe(normalizedPath, listener, options, adapterId);
  }
  
  /**
   * Execute a batch of updates as a single transaction
   * @param updates Record of path -> value updates
   * @param metadata Optional metadata about the transaction
   * @param adapterId Optional ID of the adapter to use
   */
  async transaction(
    updates: Record<string, any>,
    metadata?: StateChangeMetadata,
    adapterId?: string
  ): Promise<void> {
    this.ensureInitialized();
    
    // Get the adapter
    const adapter = adapterId 
      ? this.manager.getAdapter(adapterId) 
      : this.manager.getDefaultAdapter();
    
    if (!adapter) {
      throw new Error('No adapter available for transaction');
    }
    
    // Execute the transaction
    for (const [path, value] of Object.entries(updates)) {
      await this.manager.modifyState(path, value, adapterId, {
        ...metadata,
        transactionId: metadata?.transactionId || `txn-${Date.now()}`
      });
    }
  }
  
  /**
   * Enable time-travel debugging
   * @param limit Maximum history entries to keep
   */
  enableTimeTravel(limit: number = 100): void {
    this.manager.enableTimeTravel(limit);
  }
  
  /**
   * Disable time-travel debugging
   */
  disableTimeTravel(): void {
    this.manager.disableTimeTravel();
  }
  
  /**
   * Time travel to a specific point in history
   * @param index History index to travel to
   */
  timeTravel(index: number): void {
    this.manager.timeTravel(index);
  }
  
  /**
   * Add middleware to intercept state changes
   * @param middleware Middleware function
   * @param adapterId Optional adapter ID to target specific adapter
   * @returns Function to remove the middleware
   */
  addMiddleware(middleware: StateMiddleware, adapterId?: string): () => void {
    return this.manager.addMiddleware(middleware, adapterId);
  }
  
  /**
   * Get the state manager
   * @returns The unified state manager
   */
  getManager(): UnifiedStateManager {
    return this.manager;
  }
  
  /**
   * Ensure the system is initialized
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('UnifiedStateSystem not initialized. Call initialize() first.');
    }
  }
  
  /**
   * Normalize a path to string format
   * @param path Path to normalize
   * @returns Normalized path string
   */
  private normalizePath(path: StatePath): string {
    if (Array.isArray(path)) {
      return path.join('.');
    }
    return path;
  }
}

// Create singleton instance
export const stateSystem = new UnifiedStateSystem();