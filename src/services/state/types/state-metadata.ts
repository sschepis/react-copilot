/**
 * Type definitions for state metadata
 */

/**
 * Metadata for state changes
 */
export interface StateChangeMetadata {
  /** Source of the change (component, user action, etc.) */
  source?: string;
  
  /** Component ID if applicable */
  componentId?: string;
  
  /** Transaction ID for grouped changes */
  transactionId?: string;
  
  /** Whether this change is part of a time-travel operation */
  isTimeTravel?: boolean;
  
  /** Custom metadata for extensions */
  [key: string]: any;
}

/**
 * Metadata for state access
 */
export interface StateAccessMetadata {
  /** Component ID if applicable */
  componentId?: string;
  
  /** Access type (read, subscribe, etc.) */
  accessType?: 'read' | 'subscribe' | 'compute';
  
  /** Performance data */
  performance?: {
    /** Time taken to access state (ms) */
    accessTime?: number;
    
    /** Whether the access hit a cache */
    cacheHit?: boolean;
  };
  
  /** Custom metadata for extensions */
  [key: string]: any;
}