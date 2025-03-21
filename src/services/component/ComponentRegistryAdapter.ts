import { EventEmitter } from '../../utils/EventEmitter';
import {
  CodeChangeRequest,
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentRelationship,
  ComponentVersion,
  ModifiableComponent,
  Permissions
} from '../../utils/types';
import {
  ComponentRegistryEvents,
  IComponentRegistry,
  VersionCreationOptions,
  VersionRevertOptions,
  CodeChangeOptions
} from './core/types';
import { createComponentRegistry } from './core';

/**
 * @deprecated Use ComponentRegistry from core module directly
 * 
 * Adapter for backward compatibility with the old ComponentRegistry API
 */
export class ComponentRegistryAdapter extends EventEmitter {
  private registry: IComponentRegistry;

  /**
   * Create a new ComponentRegistryAdapter
   * 
   * @param permissions Optional permissions for code validation
   */
  constructor(permissions?: Partial<Permissions>) {
    super();
    
    console.warn(
      'ComponentRegistry is deprecated. Use createComponentRegistry from core module instead.'
    );
    
    // Create new registry with core implementation
    this.registry = createComponentRegistry(permissions);
    
    // Forward events from core registry
    this.setupEventForwarding();
  }

  /**
   * Register a component with the registry
   * 
   * @param component The component to register
   */
  registerComponent(component: ModifiableComponent): void {
    this.registry.registerComponent(component);
  }

  /**
   * Unregister a component from the registry
   * 
   * @param componentId The ID of the component to unregister
   */
  unregisterComponent(componentId: string): void {
    this.registry.unregisterComponent(componentId);
  }

  /**
   * Update a component in the registry
   * 
   * @param componentId The ID of the component to update
   * @param updates Partial component updates to apply
   */
  updateComponent(componentId: string, updates: Partial<ModifiableComponent>): void {
    this.registry.updateComponent(componentId, updates);
  }

  /**
   * Set permissions for code validation
   * 
   * @param permissions The permissions to set
   */
  setPermissions(permissions: Partial<Permissions>): void {
    this.registry.setPermissions(permissions);
  }

  /**
   * Get the current permissions
   * 
   * @returns The current permissions
   */
  getPermissions(): Permissions {
    return this.registry.getPermissions();
  }

  /**
   * Get a component by ID
   * 
   * @param componentId The ID of the component to get
   * @returns The component or null if not found
   */
  getComponent(componentId: string): ModifiableComponent | null {
    return this.registry.getComponent(componentId);
  }

  /**
   * Get all registered components
   * 
   * @returns A record of all components by ID
   */
  getAllComponents(): Record<string, ModifiableComponent> {
    return this.registry.getAllComponents();
  }

  /**
   * Create a new version of a component
   * 
   * @param componentId The ID of the component
   * @param sourceCode The source code for the new version
   * @param description A description of the changes
   * @param author Optional author of the changes
   * @returns The newly created version
   */
  createVersion(
    componentId: string, 
    sourceCode: string, 
    description: string, 
    author?: string
  ): ComponentVersion | null {
    return this.registry.createVersion(componentId, sourceCode, description, { author });
  }

  /**
   * Get version history for a component
   * 
   * @param componentId The ID of the component
   * @returns Array of versions or empty array if component not found
   */
  getVersionHistory(componentId: string): ComponentVersion[] {
    return this.registry.getVersionHistory(componentId);
  }

  /**
   * Revert a component to a specific version
   * 
   * @param componentId The ID of the component
   * @param versionId The ID of the version to revert to
   * @returns True if revert was successful
   */
  revertToVersion(componentId: string, versionId: string): boolean {
    return this.registry.revertToVersion(componentId, versionId);
  }

  /**
   * Execute a code change request for a single component
   * 
   * @param request The code change request
   * @returns The result of the code change
   */
  async executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult> {
    return this.registry.executeCodeChange(request);
  }

  /**
   * Execute a cross-component code change request affecting multiple components
   * 
   * @param request The cross-component change request
   * @returns Record of results by component ID
   */
  async executeMultiComponentChange(
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>> {
    return this.registry.executeMultiComponentChange(request);
  }

  /**
   * Get component relationships from the relationship graph
   * 
   * @param componentId The ID of the component
   * @returns The component's relationships or null if not found
   */
  getComponentRelationships(componentId: string): ComponentRelationship | null {
    return this.registry.getComponentRelationships(componentId);
  }

  /**
   * Get all components that would be affected by changes to the specified components
   * 
   * @param componentIds The IDs of the components that are changing
   * @returns Array of component IDs that would be affected by the changes
   */
  getAffectedComponents(componentIds: string | string[]): string[] {
    return this.registry.getAffectedComponents(componentIds);
  }

  /**
   * Get all state keys that are related to a component
   * 
   * @param componentId The ID of the component
   * @returns Array of state keys used by the component or related components
   */
  getRelatedStateKeys(componentId: string): string[] {
    return this.registry.getRelatedStateKeys(componentId);
  }

  /**
   * Get a visualization of the component graph
   * 
   * @returns The visualization data
   */
  visualizeComponentGraph() {
    return this.registry.visualizeComponentGraph();
  }

  /**
   * Set up forwarding of events from core registry to this adapter
   */
  private setupEventForwarding(): void {
    // Forward all events from the registry to this adapter
    Object.values(ComponentRegistryEvents).forEach(eventName => {
      this.registry.on(eventName, (data: any) => {
        this.emit(eventName, data);
      });
    });
  }
}

export default ComponentRegistryAdapter;