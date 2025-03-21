/**
 * ChangeExplainer Module
 * 
 * A modular system for analyzing and explaining code changes
 * with different levels of detail and formatting options.
 */

// Export types for external use
export * from './types';

// Export base functionality
export * from './ChangeExplainerBase';
export * from './ChangeExplainerFactory';
export * from './ChangeExplainerManager';

// Export concrete explainers
export * from './explainers/ModificationExplainer';

// Additional explainers will be exported here as they are implemented
// export * from './explainers/AdditionExplainer';
// export * from './explainers/DeletionExplainer';
// export * from './explainers/RefactoringExplainer';
// export * from './explainers/BugFixExplainer';

/**
 * Main functionality for explaining code changes
 */
import { ChangeExplainerManager } from './ChangeExplainerManager';
import { CodeChange, ExplanationOptions, ExplanationResult } from './types';

// Create and export a default manager instance
export const defaultManager = new ChangeExplainerManager();

/**
 * Generate an explanation for a single code change
 * 
 * @param change The code change to explain
 * @param options Options for the explanation
 * @returns The explanation result
 */
export function explainChange(
  change: CodeChange,
  options?: ExplanationOptions
): ExplanationResult {
  return defaultManager.explainChange(change, options);
}

/**
 * Generate explanations for multiple code changes
 * 
 * @param changes The code changes to explain
 * @param options Options for the explanations
 * @returns Array of explanation results
 */
export function explainChanges(
  changes: CodeChange[],
  options?: ExplanationOptions
): ExplanationResult[] {
  return defaultManager.explainChanges(changes, options);
}

/**
 * Generate a consolidated explanation for a set of related changes
 * 
 * @param changes The set of code changes to explain
 * @param options Options for the explanation
 * @returns A consolidated explanation result
 */
export function explainChangeSet(
  changes: CodeChange[],
  options?: ExplanationOptions
): ExplanationResult {
  return defaultManager.explainChangeSet(changes, options);
}

/**
 * Set default options for all explanations
 * 
 * @param options Default options to use
 */
export function setDefaultOptions(options: Partial<ExplanationOptions>): void {
  defaultManager.setDefaultOptions(options);
}

/**
 * Register a custom explainer with the default manager
 * 
 * @param explainer The explainer to register
 */
export function registerExplainer(explainer: any): void {
  defaultManager.registerExplainer(explainer);
}