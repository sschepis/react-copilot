/**
 * Type definitions for state subscriptions
 */

/**
 * State subscription options
 */
export interface StateSubscriptionOptions {
  /** Whether to notify on the initial value */
  notifyOnInitial?: boolean;
  
  /** Debounce time in ms */
  debounce?: number;
  
  /** Throttle time in ms */
  throttle?: number;
  
  /** Component ID for tracking */
  componentId?: string;
  
  /** Notify only when deep equal returns false */
  onlyOnDeepChange?: boolean;
}