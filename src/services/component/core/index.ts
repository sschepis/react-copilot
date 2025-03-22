/**
 * Component Registry Core Module
 *
 * This module provides the core functionality for managing modifiable components
 * through a consistent interface. It handles component storage, version history,
 * relationship tracking, and code validation.
 */

// Export types
export * from './types';

// Export core classes
export { default as ComponentStorage } from './ComponentStorage';
export { default as VersionManager } from './VersionManager';
export { default as RelationshipManager } from './RelationshipManager';
export { default as RegistryValidator } from './RegistryValidator';
export { default as ComponentRegistry } from './ComponentRegistry';

// Export new manager classes
export { default as ComponentLifecycleManager, ComponentLifecycleHook } from './ComponentLifecycleManager';
export { default as ComponentTransformManager } from './ComponentTransformManager';
export { default as ComponentMetadataManager } from './ComponentMetadataManager';
export { default as ComponentDiscoveryManager } from './ComponentDiscoveryManager';

// Create and export factory function
import ComponentStorage from './ComponentStorage';
import VersionManager from './VersionManager';
import RelationshipManager from './RelationshipManager';
import RegistryValidator from './RegistryValidator';
import ComponentRegistry from './ComponentRegistry';
import { Permissions } from '../../../utils/types';

/**
 * Create a new component registry with all required services
 * 
 * @param permissions Optional permissions for code validation
 * @returns A fully configured component registry
 */
export function createComponentRegistry(permissions?: Partial<Permissions>) {
  // Create services
  const storage = new ComponentStorage();
  const validator = new RegistryValidator(permissions);
  const versionManager = new VersionManager(storage);
  const relationshipManager = new RelationshipManager();
  
  // Create and return registry
  return new ComponentRegistry(
    storage,
    versionManager,
    relationshipManager,
    validator
  );
}