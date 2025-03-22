/**
 * Type definitions for state middleware
 */

import { StateChangeMetadata } from './state-metadata';

/**
 * State middleware function
 * Used to intercept and transform state changes before they're applied
 * 
 * @param path Path of the state being changed
 * @param value New value being set
 * @param next Function to call to continue the middleware chain
 * @param metadata Additional metadata about the change
 */
export type StateMiddleware = (
  path: string,
  value: any,
  next: (path: string, value: any) => void,
  metadata?: StateChangeMetadata
) => void;