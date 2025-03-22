/**
 * Type definitions for state synchronization issues
 */

/**
 * State synchronization issue
 * Represents a detected inconsistency or problem in state management
 */
export interface StateSyncIssue {
  /** State path with issue */
  path: string;
  
  /** Description of the issue */
  issue: string;
  
  /** Severity level */
  severity: 'warning' | 'error';
  
  /** Affected components */
  components?: string[];
}