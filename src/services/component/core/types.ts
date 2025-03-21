import { EventEmitter } from '../../../utils/EventEmitter';
import {
  CodeChangeRequest,
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentRelationship,
  ComponentVersion,
  ModifiableComponent,
  Permissions
} from '../../../utils/types';

/**
 * Events emitted by the ComponentRegistry
 */
export enum ComponentRegistryEvents {
  COMPONENT_REGISTERED = 'component_registered',
  COMPONENT_UNREGISTERED = 'component_unregistered',
  COMPONENT_UPDATED = 'component_updated',
  COMPONENT_VERSION_CREATED = 'component_version_created',
  COMPONENT_VERSION_REVERTED = 'component_version_reverted',
  CODE_CHANGE_APPLIED = 'code_change_applied',
  CODE_CHANGE_FAILED = 'code_change_failed',
  ERROR = 'error',
}

/**
 * Default permissions when none are provided
 */
export const DEFAULT_PERMISSIONS: Permissions = {
  allowComponentCreation: true,
  allowComponentDeletion: false,
  allowStyleChanges: true,
  allowLogicChanges: true,
  allowDataAccess: true,
  allowNetworkRequests: false,
};

/**
 * Options for registering a component
 */
export interface ComponentRegistrationOptions {
  createInitialVersion?: boolean;
  updateRelationships?: boolean;
}

/**
 * Options for creating a component version
 */
export interface VersionCreationOptions {
  updateComponent?: boolean;
  emitEvent?: boolean;
  author?: string;
}

/**
 * Options for reverting to a component version
 */
export interface VersionRevertOptions {
  createNewVersion?: boolean;
  emitEvent?: boolean;
}

/**
 * Options for executing a code change
 */
export interface CodeChangeOptions {
  createVersion?: boolean;
  updateComponent?: boolean;
  validateCode?: boolean;
}

/**
 * Interface for component storage service
 */
export interface IComponentStorage {
  /**
   * Store a component
   */
  storeComponent(component: ModifiableComponent): void;
  
  /**
   * Get a component by ID
   */
  getComponent(componentId: string): ModifiableComponent | null;
  
  /**
   * Remove a component
   */
  removeComponent(componentId: string): boolean;
  
  /**
   * Update a component
   */
  updateComponent(componentId: string, updates: Partial<ModifiableComponent>): boolean;
  
  /**
   * Get all components
   */
  getAllComponents(): Record<string, ModifiableComponent>;
  
  /**
   * Check if a component exists
   */
  hasComponent(componentId: string): boolean;
}

/**
 * Interface for version management service
 */
export interface IVersionManager {
  /**
   * Create a new version
   */
  createVersion(
    componentId: string, 
    sourceCode: string, 
    description: string, 
    options?: VersionCreationOptions
  ): ComponentVersion | null;
  
  /**
   * Get version history for a component
   */
  getVersionHistory(componentId: string): ComponentVersion[];
  
  /**
   * Revert to a specific version
   */
  revertToVersion(
    componentId: string, 
    versionId: string, 
    options?: VersionRevertOptions
  ): boolean;
}

/**
 * Interface for validation service
 */
export interface IRegistryValidator {
  /**
   * Set permissions
   */
  setPermissions(permissions: Partial<Permissions>): void;
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions;
  
  /**
   * Validate a component
   */
  validateComponent(component: ModifiableComponent): boolean;
  
  /**
   * Validate a code change
   */
  validateCodeChange(
    sourceCode: string, 
    originalCode: string | null
  ): { isValid: boolean; error?: string };
}

/**
 * Interface for relationship management service
 */
export interface IRelationshipManager {
  /**
   * Add a component to the relationship graph
   */
  addComponent(component: ModifiableComponent): void;
  
  /**
   * Remove a component from the relationship graph
   */
  removeComponent(componentId: string): void;
  
  /**
   * Set parent-child relationship
   */
  setParentChild(parentId: string, childId: string): void;
  
  /**
   * Add dependency relationship
   */
  addDependency(dependentId: string, dependencyId: string): void;
  
  /**
   * Track state usage
   */
  trackStateUsage(componentId: string, stateKey: string): void;
  
  /**
   * Get a component's relationship information
   */
  getRelationships(componentId: string): ComponentRelationship | null;
  
  /**
   * Get components affected by changes
   */
  getAffectedComponents(componentIds: string | string[]): string[];
  
  /**
   * Get state keys related to a component
   */
  getRelatedStateKeys(componentId: string): string[];
  
  /**
   * Visualize the component graph
   */
  visualizeGraph(): ComponentGraphVisualization;
}

/**
 * Interface for the component registry
 */
export interface IComponentRegistry extends EventEmitter {
  /**
   * Register a component
   */
  registerComponent(
    component: ModifiableComponent, 
    options?: ComponentRegistrationOptions
  ): void;
  
  /**
   * Unregister a component
   */
  unregisterComponent(componentId: string): void;
  
  /**
   * Update a component
   */
  updateComponent(
    componentId: string, 
    updates: Partial<ModifiableComponent>
  ): void;
  
  /**
   * Set permissions
   */
  setPermissions(permissions: Partial<Permissions>): void;
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions;
  
  /**
   * Get a component by ID
   */
  getComponent(componentId: string): ModifiableComponent | null;
  
  /**
   * Get all components
   */
  getAllComponents(): Record<string, ModifiableComponent>;
  
  /**
   * Create a version
   */
  createVersion(
    componentId: string, 
    sourceCode: string, 
    description: string, 
    options?: VersionCreationOptions
  ): ComponentVersion | null;
  
  /**
   * Get version history
   */
  getVersionHistory(componentId: string): ComponentVersion[];
  
  /**
   * Revert to a version
   */
  revertToVersion(
    componentId: string, 
    versionId: string, 
    options?: VersionRevertOptions
  ): boolean;
  
  /**
   * Execute a code change
   */
  executeCodeChange(
    request: CodeChangeRequest, 
    options?: CodeChangeOptions
  ): Promise<CodeChangeResult>;
  
  /**
   * Execute multi-component change
   */
  executeMultiComponentChange(
    request: CrossComponentChangeRequest, 
    options?: CodeChangeOptions
  ): Promise<Record<string, CodeChangeResult>>;
  
  /**
   * Get component relationships
   */
  getComponentRelationships(componentId: string): ComponentRelationship | null;
  
  /**
   * Get affected components
   */
  getAffectedComponents(componentIds: string | string[]): string[];
  
  /**
   * Get related state keys
   */
  getRelatedStateKeys(componentId: string): string[];

  /**
   * Visualize the component graph
   */
  visualizeComponentGraph(): ComponentGraphVisualization;
}

/**
 * Result of a component graph visualization
 */
export interface ComponentGraphVisualization {
  nodes: ComponentNode[];
  edges: ComponentEdge[];
}

/**
 * Node in the component graph
 */
export interface ComponentNode {
  id: string;
  name: string;
  type: 'component' | 'state' | 'external';
  metadata?: Record<string, any>;
}

/**
 * Edge in the component graph
 */
export interface ComponentEdge {
  source: string;
  target: string;
  type: 'parent-child' | 'depends-on' | 'uses-state' | 'sibling';
  metadata?: Record<string, any>;
}