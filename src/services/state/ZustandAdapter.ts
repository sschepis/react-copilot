import { BaseStateAdapter } from './StateAdapter';
import { get } from 'lodash'; // For path-based state access

/**
 * State adapter for Zustand state management
 */
export class ZustandAdapter extends BaseStateAdapter {
  type = 'zustand' as const;
  private useStore: any; // Zustand hook
  private actionMap: Record<string, Function>;
  private unsubscribeCallbacks: Array<() => void> = [];

  /**
   * Create a new Zustand adapter
   * @param useStore Zustand store hook
   * @param actionMap Object mapping action names to store setter functions
   */
  constructor(useStore: any, actionMap: Record<string, Function> = {}) {
    super();
    this.useStore = useStore;
    this.actionMap = actionMap;
  }

  /**
   * Get the entire Zustand state tree
   */
  getState(): any {
    return this.useStore.getState();
  }

  /**
   * Get a specific slice of the Zustand state by path
   * @param path Path to the state slice (e.g., 'user.profile.name')
   */
  getStateSlice(path: string): any {
    const state = this.getState();
    return get(state, path);
  }

  /**
   * Subscribe to Zustand state changes
   * @param callback Function called when state changes
   * @returns Unsubscribe function
   */
  subscribeToChanges(callback: (state: any) => void): () => void {
    const unsubscribe = this.useStore.subscribe(callback);
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Get all registered Zustand actions
   * @returns Record of action names and their functions
   */
  getActions(): Record<string, Function> {
    return this.actionMap;
  }

  /**
   * Execute a Zustand action by name with optional payload
   * @param name Name of the action to execute
   * @param payload Optional data to pass to the action
   * @throws Error if action not found
   */
  async executeAction(name: string, payload?: any): Promise<void> {
    const action = this.actionMap[name];
    
    if (!action) {
      const error = new Error(`Action '${name}' not found in Zustand store`);
      this.emitError(error);
      throw error;
    }
    
    try {
      // Get state before the action
      const stateBefore = this.getState();
      
      // Execute the action
      const result = action(payload);
      
      // Emit action executed event
      this.emitActionExecuted(name, payload, result);
      
      // Wait for any promises
      if (result && typeof result.then === 'function') {
        await result;
      }
      
      // Get state after the action
      const stateAfter = this.getState();
      
      // Emit state changed event if the state actually changed
      if (stateAfter !== stateBefore) {
        this.emitStateChanged(stateAfter);
      }
    } catch (error) {
      this.emitError(error as Error, { actionName: name, payload });
      throw error;
    }
  }

  /**
   * Directly modify Zustand state
   * @param path Path to the state to modify
   * @param value New value to set
   */
  async modifyState(path: string, value: any): Promise<void> {
    try {
      // Get the current value at the path
      const oldValue = this.getStateSlice(path);
      
      // Create a setter function based on the path
      const setState = this.useStore.setState;
      
      // For nested paths, we need to create the appropriate update object
      if (path.includes('.')) {
        const segments = path.split('.');
        let updateObj: any = {};
        let current = updateObj;
        
        // Build the nested structure
        for (let i = 0; i < segments.length - 1; i++) {
          current[segments[i]] = {};
          current = current[segments[i]];
        }
        
        // Set the final value
        current[segments[segments.length - 1]] = value;
        
        // Update the state (preserving other fields)
        setState(updateObj, true);
      } else {
        // For top-level paths, we can set directly
        setState({ [path]: value });
      }
      
      // Emit state modified event
      this.emitStateModified(path, oldValue, value);
    } catch (error) {
      this.emitError(error as Error, { path, value });
      throw error;
    }
  }

  /**
   * Register new action creators
   * @param actionMap Actions to register
   */
  registerActions(actionMap: Record<string, Function>): void {
    this.actionMap = {
      ...this.actionMap,
      ...actionMap
    };
  }

  /**
   * Clean up the adapter
   */
  destroy(): void {
    // Unsubscribe from all subscriptions
    this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    this.unsubscribeCallbacks = [];
  }
}