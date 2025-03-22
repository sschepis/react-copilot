import { BaseStateAdapter } from './StateAdapter';
import { EventEmitter } from '../../utils/EventEmitter';
import { logger, LogCategory } from '../../utils/LoggingSystem';

/**
 * Events emitted by the StateManager
 */
export enum StateManagerEvents {
  ADAPTER_REGISTERED = 'adapter_registered',
  ADAPTER_REMOVED = 'adapter_removed',
  STATE_CHANGED = 'state_changed',
  ACTION_EXECUTED = 'action_executed',
  ERROR = 'error'
}

/**
 * Safe state change request
 */
export interface StateChangeRequest {
  adapterId: string;
  path: string;
  value: any;
  metadata?: Record<string, any>;
}

/**
 * Safe state modification result
 */
export interface StateModificationResult {
  success: boolean;
  adapterId: string;
  path: string;
  oldValue: any;
  newValue: any;
  error?: Error;
}

/**
 * Central manager for all state adapters
 * Provides unified access to different state management libraries
 */
export class StateManager extends EventEmitter {
  private adapters: Map<string, BaseStateAdapter> = new Map();
  private log = logger.getChildLogger(LogCategory.STATE);
  
  /**
   * Register a state adapter
   * @param id Unique identifier for the adapter
   * @param adapter The state adapter to register
   */
  registerAdapter(id: string, adapter: BaseStateAdapter): void {
    if (this.adapters.has(id)) {
      this.log.warn(`Replacing existing adapter with ID: ${id}`);
      
      // Clean up the existing adapter
      const existingAdapter = this.adapters.get(id);
      if (existingAdapter && typeof (existingAdapter as any).destroy === 'function') {
        (existingAdapter as any).destroy();
      }
    }
    
    // Store the adapter
    this.adapters.set(id, adapter);
    
    // Subscribe to adapter events
    adapter.on('state_changed', (data) => {
      this.emit(StateManagerEvents.STATE_CHANGED, {
        adapterId: id,
        state: data.state
      });
    });
    
    adapter.on('action_executed', (data) => {
      this.emit(StateManagerEvents.ACTION_EXECUTED, {
        adapterId: id,
        actionName: data.actionName,
        payload: data.payload,
        result: data.result
      });
    });
    
    adapter.on('error', (data) => {
      this.emit(StateManagerEvents.ERROR, {
        adapterId: id,
        error: data.error,
        context: data.context
      });
    });
    
    // Emit adapter registered event
    this.emit(StateManagerEvents.ADAPTER_REGISTERED, { adapterId: id });
    
    this.log.info(`Registered state adapter: ${id}`);
  }
  
  /**
   * Remove a state adapter
   * @param id ID of the adapter to remove
   */
  removeAdapter(id: string): boolean {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      return false;
    }
    
    // Clean up the adapter if it has a destroy method
    if (typeof (adapter as any).destroy === 'function') {
      (adapter as any).destroy();
    }
    
    // Remove the adapter
    this.adapters.delete(id);
    
    // Emit adapter removed event
    this.emit(StateManagerEvents.ADAPTER_REMOVED, { adapterId: id });
    
    this.log.info(`Removed state adapter: ${id}`);
    return true;
  }
  
  /**
   * Get a state adapter by ID
   * @param id ID of the adapter
   */
  getAdapter(id: string): BaseStateAdapter | null {
    return this.adapters.get(id) || null;
  }
  
  /**
   * Get all registered state adapters
   */
  getAllAdapters(): Record<string, BaseStateAdapter> {
    const result: Record<string, BaseStateAdapter> = {};
    for (const [id, adapter] of this.adapters.entries()) {
      result[id] = adapter;
    }
    return result;
  }
  
  /**
   * Get state from a specific adapter
   * @param adapterId ID of the adapter
   * @param path Optional path to a specific slice of state
   */
  getState(adapterId: string, path?: string): any {
    const adapter = this.getAdapter(adapterId);
    if (!adapter) {
      throw new Error(`State adapter not found: ${adapterId}`);
    }
    
    return path ? adapter.getStateSlice(path) : adapter.getState();
  }
  
  /**
   * Safely modify state through validation and event emission
   * @param request State change request
   */
  async safeModifyState(request: StateChangeRequest): Promise<StateModificationResult> {
    const { adapterId, path, value, metadata } = request;
    
    try {
      // Get the adapter
      const adapter = this.getAdapter(adapterId);
      if (!adapter) {
        throw new Error(`State adapter not found: ${adapterId}`);
      }
      
      // Get the current value for comparison
      const oldValue = adapter.getStateSlice(path);
      
      // Apply the state change
      await adapter.modifyState(path, value);
      
      // Get the new value
      const newValue = adapter.getStateSlice(path);
      
      // Return success result
      return {
        success: true,
        adapterId,
        path,
        oldValue,
        newValue
      };
    } catch (error) {
      // Log the error
      this.log.error(`Failed to modify state: ${adapterId}.${path}`, error);
      
      // Emit error event
      this.emit(StateManagerEvents.ERROR, {
        adapterId,
        path,
        value,
        error,
        metadata
      });
      
      // Return error result
      return {
        success: false,
        adapterId,
        path,
        oldValue: null,
        newValue: null,
        error: error as Error
      };
    }
  }
  
  /**
   * Execute an action on a specific adapter
   * @param adapterId ID of the adapter
   * @param actionName Name of the action to execute
   * @param payload Optional payload for the action
   */
  async executeAction(adapterId: string, actionName: string, payload?: any): Promise<any> {
    // Get the adapter
    const adapter = this.getAdapter(adapterId);
    if (!adapter) {
      throw new Error(`State adapter not found: ${adapterId}`);
    }
    
    // Execute the action
    return adapter.executeAction(actionName, payload);
  }
  
  /**
   * Subscribe to state changes from a specific adapter
   * @param adapterId ID of the adapter
   * @param callback Function called when state changes
   */
  subscribeToAdapter(adapterId: string, callback: (state: any) => void): () => void {
    // Get the adapter
    const adapter = this.getAdapter(adapterId);
    if (!adapter) {
      throw new Error(`State adapter not found: ${adapterId}`);
    }
    
    // Subscribe to the adapter
    return adapter.subscribeToChanges(callback);
  }
}

// Singleton instance
let instance: StateManager | null = null;

/**
 * Get the singleton instance of the StateManager
 */
export function getStateManager(): StateManager {
  if (!instance) {
    instance = new StateManager();
  }
  return instance;
}