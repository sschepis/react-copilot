import { EventEmitter } from '../../utils/EventEmitter';
import { StateAdapter as StateAdapterInterface } from '../../utils/types';

/**
 * Events emitted by state adapters
 */
export enum StateAdapterEvents {
  STATE_CHANGED = 'state_changed',
  ACTION_EXECUTED = 'action_executed',
  STATE_MODIFIED = 'state_modified',
  ERROR = 'error',
}

/**
 * Base class for state management adapters
 * Provides common functionality and implements the StateAdapter interface
 */
export abstract class BaseStateAdapter extends EventEmitter implements StateAdapterInterface {
  /**
   * The type of state adapter
   */
  abstract type: 'redux' | 'zustand' | 'mobx' | 'react-query' | 'context' | 'custom';
  
  /**
   * Get the entire state tree
   */
  abstract getState(): any;
  
  /**
   * Get a specific slice of the state by path
   * Path format depends on adapter implementation
   * @param path Path to the state slice (e.g., 'user.profile.name')
   */
  abstract getStateSlice(path: string): any;
  
  /**
   * Subscribe to state changes
   * @param callback Function called when state changes
   * @returns Unsubscribe function
   */
  abstract subscribeToChanges(callback: (state: any) => void): () => void;
  
  /**
   * Get a list of available actions
   * @returns Record of action names and their functions
   */
  abstract getActions(): Record<string, Function>;
  
  /**
   * Execute a named action with optional payload
   * @param name Name of the action to execute
   * @param payload Optional data to pass to the action
   */
  abstract executeAction(name: string, payload?: any): Promise<void>;
  
  /**
   * Directly modify a part of the state
   * @param path Path to the state to modify
   * @param value New value to set
   */
  abstract modifyState(path: string, value: any): Promise<void>;
  
  /**
   * Utility method to emit a state change event
   * @param state The new state
   */
  protected emitStateChanged(state: any): void {
    this.emit(StateAdapterEvents.STATE_CHANGED, { state });
  }
  
  /**
   * Utility method to emit an action executed event
   * @param actionName The name of the executed action
   * @param payload The payload that was passed to the action
   * @param result The result of the action
   */
  protected emitActionExecuted(actionName: string, payload: any, result?: any): void {
    this.emit(StateAdapterEvents.ACTION_EXECUTED, {
      actionName,
      payload,
      result
    });
  }
  
  /**
   * Utility method to emit a state modified event
   * @param path The path that was modified
   * @param oldValue The previous value
   * @param newValue The new value
   */
  protected emitStateModified(path: string, oldValue: any, newValue: any): void {
    this.emit(StateAdapterEvents.STATE_MODIFIED, {
      path,
      oldValue,
      newValue
    });
  }
  
  /**
   * Utility method to emit an error event
   * @param error The error that occurred
   * @param context Additional context about the error
   */
  protected emitError(error: Error, context?: any): void {
    this.emit(StateAdapterEvents.ERROR, {
      error,
      context
    });
  }
}