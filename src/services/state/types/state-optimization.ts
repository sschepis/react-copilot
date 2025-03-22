/**
 * Type definitions for state optimization suggestions
 */

/**
 * Optimization suggestion for component state usage
 */
export interface StateOptimizationSuggestion {
  /** Description of the issue */
  issue: string;
  
  /** Suggested solution */
  suggestion: string;
  
  /** State path involved (if applicable) */
  path?: string;
  
  /** Potential impact of implementing the suggestion */
  impact: 'low' | 'medium' | 'high';
}