import { BaseStateAdapter } from './StateAdapter';
import { get, set } from 'lodash'; // For path-based state access

/**
 * State adapter for Redux state management
 */
export class ReduxAdapter extends BaseStateAdapter {
  type = 'redux' as const;
  private store: any; // Redux store
  private actionCreators: Record<string, Function>;
  private unsubscribeFromStore: () => void = () => {};

  /**
   * Create a new Redux adapter
   * @param store Redux store instance
   * @param actionCreators Object mapping action names to action creator functions
   */
  constructor(store: any, actionCreators: Record<string, Function> = {}) {
    super();
    this.store = store;
    this.actionCreators = actionCreators;
  }

  /**
   * Get the entire Redux state tree
   */
  getState(): any {
    return this.store.getState();
  }

  /**
   * Get a specific slice of the Redux state by path
   * @param path Path to the state slice (e.g., 'user.profile.name')
   */
  getStateSlice(path: string): any {
    const state = this.getState();
    return get(state, path);
  }

  /**
   * Subscribe to Redux state changes
   * @param callback Function called when state changes
   * @returns Unsubscribe function
   */
  subscribeToChanges(callback: (state: any) => void): () => void {
    // Clean up any existing subscription
    this.unsubscribeFromStore();

    let currentState = this.getState();
    
    // Subscribe to store changes
    this.unsubscribeFromStore = this.store.subscribe(() => {
      const nextState = this.getState();
      
      // Only call callback if state actually changed
      if (nextState !== currentState) {
        callback(nextState);
        currentState = nextState;
        
        // Emit state changed event
        this.emitStateChanged(nextState);
      }
    });
    
    return this.unsubscribeFromStore;
  }

  /**
   * Get all registered Redux action creators
   * @returns Record of action names and their creator functions
   */
  getActions(): Record<string, Function> {
    return this.actionCreators;
  }

  /**
   * Execute a Redux action by name with optional payload
   * @param name Name of the action to execute
   * @param payload Optional data to pass to the action creator
   * @throws Error if action creator not found
   */
  async executeAction(name: string, payload?: any): Promise<void> {
    const actionCreator = this.actionCreators[name];
    
    if (!actionCreator) {
      const error = new Error(`Action creator '${name}' not found`);
      this.emitError(error);
      throw error;
    }
    
    try {
      // Create and dispatch the action
      const action = actionCreator(payload);
      const result = this.store.dispatch(action);
      
      // Emit action executed event
      this.emitActionExecuted(name, payload, result);
      
      // If the result is a promise (redux-thunk or similar), await it
      if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      this.emitError(error as Error, { actionName: name, payload });
      throw error;
    }
  }

  /**
   * Directly modify Redux state using a reducer action
   * @param path Path to the state to modify
   * @param value New value to set
   */
  async modifyState(path: string, value: any): Promise<void> {
    try {
      // Get the current value at the path
      const oldValue = this.getStateSlice(path);
      
      // Dispatch a generic SET_STATE action
      // The reducer needs to handle this action type
      const action = {
        type: 'SET_STATE',
        payload: {
          path,
          value
        }
      };
      
      this.store.dispatch(action);
      
      // Emit state modified event
      this.emitStateModified(path, oldValue, value);
    } catch (error) {
      this.emitError(error as Error, { path, value });
      throw error;
    }
  }

  /**
   * Register new action creators
   * @param actionCreators Action creators to register
   */
  registerActionCreators(actionCreators: Record<string, Function>): void {
    this.actionCreators = {
      ...this.actionCreators,
      ...actionCreators
    };
  }

  /**
   * Clean up the adapter
   */
  destroy(): void {
    this.unsubscribeFromStore();
  }
}