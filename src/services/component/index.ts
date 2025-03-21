/**
 * Component Module
 * 
 * This module provides functionalities for managing modifiable components
 * including registration, version history, relationship tracking, and code execution.
 */

// Export from core module (new architecture)
export * from './core';

// Export adapters for backward compatibility
export { default as ComponentRegistry } from './ComponentRegistryAdapter';
export { RelationshipGraph } from './RelationshipGraph';

// Re-export useful types
import {
  ComponentRegistryEvents,
  ComponentRegistrationOptions,
  VersionCreationOptions,
  VersionRevertOptions,
  CodeChangeOptions,
  ComponentGraphVisualization,
  ComponentNode,
  ComponentEdge
} from './core/types';

export {
  ComponentRegistryEvents,
  ComponentRegistrationOptions,
  VersionCreationOptions,
  VersionRevertOptions,
  CodeChangeOptions,
  ComponentGraphVisualization,
  ComponentNode,
  ComponentEdge
};

/**
 * Factory function to create a new component registry
 * 
 * @param permissions Optional permissions for code validation
 * @returns A new component registry instance
 */
export { createComponentRegistry } from './core';