/**
 * Type definitions for state history and time-travel debugging
 */

import { StateChangeMetadata } from './state-metadata';

/**
 * History entry for time-travel debugging
 */
export interface StateHistoryEntry {
  /** Timestamp of the change */
  timestamp: number;
  
  /** Path that was changed */
  path: string;
  
  /** Value after the change */
  value: any;
  
  /** Value before the change */
  previousValue: any;
  
  /** Metadata about the change */
  metadata?: StateChangeMetadata;
}