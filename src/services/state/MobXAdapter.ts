import { BaseStateAdapter } from './StateAdapter';
import { get, set } from 'lodash';
import { reaction, toJS, configure } from 'mobx';

// Configure mobx for max safety and predictability
configure({
  enforceActions: 'always',
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true
});

/**
 * State adapter for MobX state management
 */
export class MobXAdapter extends BaseStateAdapter {
  type = 'mobx' as const;
  private store: any; // MobX store
  private actions: Record<string, Function>;
  private disposers: Array<() => void> = [];

  /**
   * Create a new MobX adapter
   * @param store MobX store instance
   * @param actions Object mapping action names to action functions
   */
  constructor(store: any, actions: Record<string, Function> = {}) {
    super();
    this.store = store;
    this.actions = actions;
  }

  /**
   * Get the entire MobX state tree, converted to plain JS objects
   */
  getState(): any {
    return toJS(this.store);
  }

  /**
   * Get a specific slice of the MobX state by path
   * @param path Path to the state slice (e.g., 'user.profile.name')
   */
  getStateSlice(path: string): any {
    if (!path) {
      return toJS(this.store);
    }

    // Handle direct property access
    if (!path.includes('.')) {
      return toJS(this.store[path]);
    }

    // Handle nested path
    const state = this.getState();
    return get(state, path);
  }

  /**
   * Subscribe to MobX state changes
   * @param callback Function called when state changes
   * @returns Unsubscribe function
   */
  subscribeToChanges(callback: (state: any) => void): () => void {
    // Create a reaction to watch the entire store
    const disposer = reaction(
      // Data function that returns what we're tracking
      () => this.getState(),
      // Effect function that is triggered on changes
      (data) => {
        callback(data);
        this.emitStateChanged(data);
      },
      // Options
      {
        fireImmediately: false,
        delay: 0
      }
    );

    this.disposers.push(disposer);
    return disposer;
  }

  /**
   * Get all registered MobX actions
   * @returns Record of action names and their functions
   */
  getActions(): Record<string, Function> {
    return this.actions;
  }

  /**
   * Execute a MobX action by name with optional payload
   * @param name Name of the action to execute
   * @param payload Optional data to pass to the action
   * @throws Error if action not found
   */
  async executeAction(name: string, payload?: any): Promise<void> {
    const action = this.actions[name];
    
    if (!action) {
      const error = new Error(`Action '${name}' not found in MobX store`);
      this.emitError(error);
      throw error;
    }
    
    try {
      // Execute the action
      const result = action.call(this.store, payload);
      
      // Emit action executed event
      this.emitActionExecuted(name, payload, result);
      
      // If the result is a promise, await it
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      this.emitError(error as Error, { actionName: name, payload });
      throw error;
    }
  }

  /**
   * Directly modify MobX state
   * @param path Path to the state to modify
   * @param value New value to set
   */
  async modifyState(path: string, value: any): Promise<void> {
    try {
      // Get the current value at the path
      const oldValue = this.getStateSlice(path);
      
      // Direct property access
      if (!path.includes('.')) {
        // Use the appropriate MobX action for setting state
        if (typeof this.store.set === 'function') {
          this.store.set(path, value);
        } else {
          this.store[path] = value;
        }
      } else {
        // Split path into segments for nested state
        const segments = path.split('.');
        let current = this.store;
        
        // Navigate to the parent object
        for (let i = 0; i < segments.length - 1; i++) {
          current = current[segments[i]];
          if (!current) {
            throw new Error(`Cannot access path ${path}: ${segments[i]} is undefined`);
          }
        }
        
        // Set the property on the parent object
        const lastSegment = segments[segments.length - 1];
        if (typeof current.set === 'function') {
          current.set(lastSegment, value);
        } else {
          current[lastSegment] = value;
        }
      }
      
      // Emit state modified event
      this.emitStateModified(path, oldValue, value);
    } catch (error) {
      this.emitError(error as Error, { path, value });
      throw error;
    }
  }

  /**
   * Register new actions
   * @param actions Actions to register
   */
  registerActions(actions: Record<string, Function>): void {
    this.actions = {
      ...this.actions,
      ...actions
    };
  }

  /**
   * Clean up the adapter
   */
  destroy(): void {
    // Dispose all reactions
    this.disposers.forEach(dispose => dispose());
    this.disposers = [];
  }
}