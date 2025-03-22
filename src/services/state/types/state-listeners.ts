/**
 * Type definitions for state listeners and subscribers
 */

import { StateChangeMetadata, StateAccessMetadata } from './state-metadata';

/**
 * State change subscription callback
 * Called when a state value changes
 * 
 * @param path The path of the state that changed
 * @param newValue The new value
 * @param oldValue The previous value
 * @param metadata Additional metadata about the change
 */
export type StateChangeListener = (
  path: string, 
  newValue: any, 
  oldValue: any, 
  metadata?: StateChangeMetadata
) => void;

/**
 * State access tracking callback
 * Called when state is accessed (for dependency tracking)
 * 
 * @param path The path of the state that was accessed
 * @param componentId The ID of the component accessing the state (if applicable)
 * @param metadata Additional metadata about the access
 */
export type StateAccessListener = (
  path: string, 
  componentId?: string, 
  metadata?: StateAccessMetadata
) => void;