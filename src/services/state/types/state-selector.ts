/**
 * Type definitions for state selectors
 */

/**
 * Selector function type for extracting derived state
 * @template T The input state type
 * @template R The output (selected) type
 */
export type StateSelector<T = any, R = any> = (state: T) => R;

/**
 * State selector options
 */
export interface StateSelectorOptions {
  /** Whether to memoize the selector (default: true) */
  memoize?: boolean;
  
  /** Component ID for tracking (optional) */
  componentId?: string;
  
  /** Dependencies for memoization */
  dependencies?: any[];
}