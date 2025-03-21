/**
 * Conflict Resolution Module
 * 
 * A modular approach to detecting and resolving code conflicts
 * between different changes.
 */

// Export types for external use
export * from './types';

// Export base functionality
export * from './ConflictDetectorBase';
export * from './ConflictResolverBase';
export * from './ConflictManager';

// Export concrete detectors
export * from './detectors/OverlappingConflictDetector';

// Export concrete resolvers
export * from './resolvers/MergeResolver';

// Additional detectors and resolvers will be exported here as they are implemented
// export * from './detectors/AdjacentConflictDetector';
// export * from './detectors/RelatedConflictDetector';
// export * from './detectors/ImportConflictDetector';
// export * from './resolvers/TakeFirstResolver';
// export * from './resolvers/SequentialResolver';

// Create and export a default manager instance
import { ConflictManager } from './ConflictManager';

/**
 * Default conflict manager instance
 * Pre-configured with standard detectors and resolvers
 */
export const defaultConflictManager = new ConflictManager();

/**
 * Detect conflicts between two sets of code changes using the default manager
 */
export function detectConflicts(changes1: any[], changes2: any[]) {
  return defaultConflictManager.detectConflicts(changes1, changes2);
}

/**
 * Resolve a conflict using the default manager
 */
export function resolveConflict(conflict: any) {
  return defaultConflictManager.resolveConflict(conflict);
}

/**
 * Process changes to detect and resolve conflicts using the default manager
 */
export function processChanges(changes1: any[], changes2: any[]) {
  return defaultConflictManager.processChanges(changes1, changes2);
}

/**
 * Register a custom detector with the default manager
 */
export function registerDetector(detector: any) {
  defaultConflictManager.registerDetector(detector);
}

/**
 * Register a custom resolver with the default manager
 */
export function registerResolver(resolver: any) {
  defaultConflictManager.registerResolver(resolver);
}

/**
 * Configure detection options for the default manager
 */
export function configureDetection(options: any) {
  defaultConflictManager.configureDetection(options);
}

/**
 * Configure resolution options for the default manager
 */
export function configureResolution(options: any) {
  defaultConflictManager.configureResolution(options);
}