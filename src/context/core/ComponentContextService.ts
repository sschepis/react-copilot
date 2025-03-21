import { EventEmitter } from '../../utils/EventEmitter';
import { 
  ModifiableComponent, 
  Permissions, 
  CodeChangeRequest, 
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentVersion,
  ComponentRelationship
} from '../../utils/types';
import {
  IComponentContextService,
  ComponentContextEvents,
  DEFAULT_PERMISSIONS,
  ILLMContextService
} from './types';
import { 
  ComponentRegistry, 
  createComponentRegistry 
} from '../../services/component/core';

/**
 * Service for managing component context
 * Handles component registration, versions, and code execution
 */
export class ComponentContextService extends EventEmitter implements IComponentContextService {
  private registry: ComponentRegistry;
  private permissions: Permissions;
  private llmContextService?: ILLMContextService;

  /**
   * Create a new ComponentContextService
   * 
   * @param llmContextService Optional LLM context service for permissions
   * @param permissions Optional component permissions
   */
  constructor(
    llmContextService?: ILLMContextService,
    permissions?: Partial<Permissions>
  ) {
    super();
    
    // Get permissions from LLM context if available
    if (llmContextService) {
      this.llmContextService = llmContextService;
      this.permissions = llmContextService.getPermissions();
    } else {
      this.permissions = { ...DEFAULT_PERMISSIONS, ...permissions };
    }
    
    // Create component registry with permissions
    this.registry = createComponentRegistry(this.permissions);
    
    // Set up event forwarding
    this.setupEventForwarding();
  }
  
  /**
   * Set up event forwarding from registry to this service
   */
  private setupEventForwarding(): void {
    const eventMapping = {
      'component_registered': ComponentContextEvents.COMPONENT_REGISTERED,
      'component_unregistered': ComponentContextEvents.COMPONENT_UNREGISTERED,
      'component_updated': ComponentContextEvents.COMPONENT_UPDATED,
      'code_change_applied': ComponentContextEvents.CODE_CHANGE_APPLIED,
      'code_change_failed': ComponentContextEvents.CODE_CHANGE_FAILED,
      'component_version_created': ComponentContextEvents.VERSION_CREATED,
      'component_version_reverted': ComponentContextEvents.VERSION_REVERTED,
      'error': ComponentContextEvents.ERROR
    };
    
    // Set up forwarding for each event
    for (const [registryEvent, contextEvent] of Object.entries(eventMapping)) {
      this.registry.on(registryEvent, (data: any) => {
        this.emit(contextEvent, data);
      });
    }
  }
  
  /**
   * Get all registered components
   */
  getComponents(): Record<string, ModifiableComponent> {
    return this.registry.getAllComponents();
  }
  
  /**
   * Register a component
   */
  registerComponent(component: ModifiableComponent): void {
    this.registry.registerComponent(component);
  }
  
  /**
   * Unregister a component
   */
  unregisterComponent(id: string): void {
    this.registry.unregisterComponent(id);
  }
  
  /**
   * Update a component
   */
  updateComponent(id: string, updates: Partial<ModifiableComponent>): void {
    this.registry.updateComponent(id, updates);
  }
  
  /**
   * Get a component by ID
   */
  getComponent(id: string): ModifiableComponent | null {
    return this.registry.getComponent(id);
  }
  
  /**
   * Execute a code change request
   */
  async executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult> {
    return this.registry.executeCodeChange(request);
  }
  
  /**
   * Execute changes across multiple components
   */
  async executeMultiComponentChange(
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>> {
    return this.registry.executeMultiComponentChange(request);
  }
  
  /**
   * Get version history for a component
   */
  getComponentVersions(id: string): ComponentVersion[] {
    return this.registry.getVersionHistory(id);
  }
  
  /**
   * Revert a component to a specific version
   */
  async revertToVersion(componentId: string, versionId: string): Promise<boolean> {
    return this.registry.revertToVersion(componentId, versionId);
  }
  
  /**
   * Get component relationships
   */
  getComponentRelationships(id: string): ComponentRelationship {
    const relationships = this.registry.getComponentRelationships(id);
    
    // Return a default relationship if none exists
    if (!relationships) {
      return {
        childrenIds: [],
        siblingIds: [],
        dependsOn: [],
        dependedOnBy: [],
        sharedStateKeys: []
      };
    }
    
    return relationships;
  }
  
  /**
   * Get components that would be affected by changes
   */
  getAffectedComponents(componentId: string): string[] {
    return this.registry.getAffectedComponents(componentId);
  }
  
  /**
   * Get state keys related to a component
   */
  getRelatedStateKeys(componentId: string): string[] {
    return this.registry.getRelatedStateKeys(componentId);
  }
  
  /**
   * Get a visualization of the component graph
   */
  visualizeComponentGraph(): any {
    return this.registry.visualizeComponentGraph();
  }
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions {
    return this.permissions;
  }
  
  /**
   * Update permissions
   */
  updatePermissions(permissions: Partial<Permissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
    this.registry.setPermissions(this.permissions);
    
    // Update permissions from LLM context if present
    if (this.llmContextService) {
      this.llmContextService.updatePermissions(this.permissions);
    }
  }
  
  /**
   * Clean up resources and event listeners
   */
  dispose(): void {
    // Remove all event listeners
    this.removeAllListeners();
    
    // Release the registry
    // No explicit disposal method needed for the registry
  }
}

export default ComponentContextService;