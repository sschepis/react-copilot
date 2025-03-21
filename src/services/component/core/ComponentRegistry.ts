import { EventEmitter } from '../../../utils/EventEmitter';
import {
  IComponentRegistry,
  IComponentStorage,
  IVersionManager,
  IRelationshipManager,
  IRegistryValidator,
  ComponentRegistryEvents,
  ComponentRegistrationOptions,
  VersionCreationOptions,
  VersionRevertOptions,
  CodeChangeOptions
} from './types';
import {
  CodeChangeRequest,
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentRelationship,
  ComponentVersion,
  ModifiableComponent,
  Permissions
} from '../../../utils/types';
import { executeCodeChange } from '../../codeExecution';

/**
 * Enhanced Component Registry with relationship tracking and version history
 * This is the orchestration layer that coordinates all component services
 */
export class ComponentRegistry extends EventEmitter implements IComponentRegistry {
  private componentStorage: IComponentStorage;
  private versionManager: IVersionManager;
  private relationshipManager: IRelationshipManager;
  private validator: IRegistryValidator;

  /**
   * Create a new ComponentRegistry
   * 
   * @param componentStorage Storage for component data
   * @param versionManager Version history management
   * @param relationshipManager Relationship tracking
   * @param validator Code and component validation
   */
  constructor(
    componentStorage: IComponentStorage,
    versionManager: IVersionManager,
    relationshipManager: IRelationshipManager,
    validator: IRegistryValidator
  ) {
    super();
    this.componentStorage = componentStorage;
    this.versionManager = versionManager;
    this.relationshipManager = relationshipManager;
    this.validator = validator;
  }

  /**
   * Register a component with the registry
   * 
   * @param component The component to register
   * @param options Optional registration options
   */
  registerComponent(
    component: ModifiableComponent,
    options?: ComponentRegistrationOptions
  ): void {
    // Default options
    const defaultOptions: ComponentRegistrationOptions = {
      createInitialVersion: true,
      updateRelationships: true
    };
    const effectiveOptions = { ...defaultOptions, ...options };

    // Validate component
    if (!this.validator.validateComponent(component)) {
      throw new Error(`Component validation failed for ${component.id}`);
    }

    // Check if component already exists
    if (this.componentStorage.hasComponent(component.id)) {
      // Just update it if it exists
      this.updateComponent(component.id, component);
      return;
    }

    // Store the component
    this.componentStorage.storeComponent(component);
    
    // Add to relationship graph if requested
    if (effectiveOptions.updateRelationships) {
      this.relationshipManager.addComponent(component);
      
      // Update relationships based on component path if available
      if (component.path && component.path.length > 1) {
        // Last element is the component itself, so get the parent from the path
        const parentPath = component.path.slice(0, -1);
        
        // Find the parent component by path
        const allComponents = this.componentStorage.getAllComponents();
        for (const [id, comp] of Object.entries(allComponents)) {
          if (comp.path && 
              comp.path.length === parentPath.length && 
              comp.path.every((item, index) => item === parentPath[index])) {
            
            // Set parent-child relationship
            this.relationshipManager.setParentChild(id, component.id);
            break;
          }
        }
      }
      
      // Track dependencies if available
      if (component.dependencies) {
        const allComponents = this.componentStorage.getAllComponents();
        for (const [id, comp] of Object.entries(allComponents)) {
          if (comp.name && component.dependencies.includes(comp.name)) {
            this.relationshipManager.addDependency(component.id, id);
          }
        }
      }
    }
    
    // Initialize version history if component has source code and option is enabled
    if (effectiveOptions.createInitialVersion && component.sourceCode) {
      this.createVersion(component.id, component.sourceCode, 'Initial version');
    }

    // Emit registration event
    this.emit(ComponentRegistryEvents.COMPONENT_REGISTERED, { componentId: component.id });
  }

  /**
   * Unregister a component from the registry
   * 
   * @param componentId The ID of the component to unregister
   */
  unregisterComponent(componentId: string): void {
    if (!this.componentStorage.hasComponent(componentId)) {
      return;
    }

    // Remove from relationship manager
    this.relationshipManager.removeComponent(componentId);
    
    // Remove from storage
    this.componentStorage.removeComponent(componentId);

    // Emit unregistration event
    this.emit(ComponentRegistryEvents.COMPONENT_UNREGISTERED, { componentId });
  }

  /**
   * Update a component in the registry
   * 
   * @param componentId The ID of the component to update
   * @param updates Partial component updates to apply
   */
  updateComponent(componentId: string, updates: Partial<ModifiableComponent>): void {
    const currentComponent = this.componentStorage.getComponent(componentId);
    if (!currentComponent) {
      throw new Error(`Component with ID ${componentId} not found`);
    }

    // Check if source code is being updated
    const sourceCodeUpdated = updates.sourceCode !== undefined && 
                              updates.sourceCode !== currentComponent.sourceCode;

    // Update in storage
    this.componentStorage.updateComponent(componentId, updates);

    // If relationships are updated, update the relationship manager
    if (updates.relationships) {
      // Get the latest component data
      const updatedComponent = this.componentStorage.getComponent(componentId);
      if (updatedComponent) {
        this.relationshipManager.addComponent(updatedComponent);
      }
    }

    // If source code was updated, create a new version
    if (sourceCodeUpdated && updates.sourceCode) {
      this.createVersion(componentId, updates.sourceCode, 'Updated via updateComponent');
    }

    // Emit update event
    this.emit(ComponentRegistryEvents.COMPONENT_UPDATED, { 
      componentId,
      updates
    });
  }

  /**
   * Set permissions for code validation
   * 
   * @param permissions The permissions to set
   */
  setPermissions(permissions: Partial<Permissions>): void {
    this.validator.setPermissions(permissions);
  }

  /**
   * Get the current permissions
   * 
   * @returns The current permissions
   */
  getPermissions(): Permissions {
    return this.validator.getPermissions();
  }

  /**
   * Get a component by ID
   * 
   * @param componentId The ID of the component to get
   * @returns The component or null if not found
   */
  getComponent(componentId: string): ModifiableComponent | null {
    return this.componentStorage.getComponent(componentId);
  }

  /**
   * Get all registered components
   * 
   * @returns A record of all components by ID
   */
  getAllComponents(): Record<string, ModifiableComponent> {
    return this.componentStorage.getAllComponents();
  }

  /**
   * Create a new version of a component
   * 
   * @param componentId The ID of the component
   * @param sourceCode The source code for the new version
   * @param description A description of the changes
   * @param options Optional settings for version creation
   * @returns The newly created version or null if component not found
   */
  createVersion(
    componentId: string, 
    sourceCode: string, 
    description: string, 
    options?: VersionCreationOptions
  ): ComponentVersion | null {
    // Default options
    const defaultOptions: VersionCreationOptions = {
      emitEvent: true
    };
    const effectiveOptions = { ...defaultOptions, ...options };

    const version = this.versionManager.createVersion(
      componentId,
      sourceCode,
      description,
      options
    );

    if (version && effectiveOptions.emitEvent) {
      // Emit version creation event
      this.emit(ComponentRegistryEvents.COMPONENT_VERSION_CREATED, {
        componentId,
        versionId: version.id
      });
    }

    return version;
  }

  /**
   * Get version history for a component
   * 
   * @param componentId The ID of the component
   * @returns Array of versions or empty array if component not found
   */
  getVersionHistory(componentId: string): ComponentVersion[] {
    return this.versionManager.getVersionHistory(componentId);
  }

  /**
   * Revert a component to a specific version
   * 
   * @param componentId The ID of the component
   * @param versionId The ID of the version to revert to
   * @param options Optional settings for reversion
   * @returns True if revert was successful
   */
  revertToVersion(
    componentId: string, 
    versionId: string, 
    options?: VersionRevertOptions
  ): boolean {
    // Default options
    const defaultOptions: VersionRevertOptions = {
      emitEvent: true,
      createNewVersion: true
    };
    const effectiveOptions = { ...defaultOptions, ...options };

    const success = this.versionManager.revertToVersion(
      componentId,
      versionId,
      options
    );

    if (success && effectiveOptions.emitEvent) {
      // Emit version revert event
      this.emit(ComponentRegistryEvents.COMPONENT_VERSION_REVERTED, {
        componentId,
        versionId
      });
    }

    return success;
  }

  /**
   * Execute a code change request for a single component
   * 
   * @param request The code change request
   * @param options Optional settings for the code change
   * @returns The result of the code change
   */
  async executeCodeChange(
    request: CodeChangeRequest,
    options?: CodeChangeOptions
  ): Promise<CodeChangeResult> {
    try {
      // Default options
      const defaultOptions: CodeChangeOptions = {
        createVersion: true,
        updateComponent: true,
        validateCode: true
      };
      const effectiveOptions = { ...defaultOptions, ...options };

      // Get the target component
      const component = this.getComponent(request.componentId);
      if (!component) {
        return {
          success: false,
          error: `Component with ID ${request.componentId} not found`,
          componentId: request.componentId
        };
      }

      // Validate the code change if requested
      if (effectiveOptions.validateCode) {
        const validationResult = this.validator.validateCodeChange(
          request.sourceCode, 
          component.sourceCode || ''
        );

        if (!validationResult.isValid) {
          return {
            success: false,
            error: validationResult.error || 'Code validation failed',
            componentId: request.componentId
          };
        }
      }

      // Execute the code change
      const result = await executeCodeChange(request);

      if (result.success && result.newSourceCode) {
        // Create a new version if requested
        if (effectiveOptions.createVersion) {
          this.createVersion(
            request.componentId,
            result.newSourceCode,
            request.description || 'Code updated'
          );
        }

        // Update the component's source code if requested
        if (effectiveOptions.updateComponent) {
          this.updateComponent(request.componentId, {
            sourceCode: result.newSourceCode
          });
        }

        // Emit code change applied event
        this.emit(ComponentRegistryEvents.CODE_CHANGE_APPLIED, {
          componentId: request.componentId,
          description: request.description
        });
      } else {
        // Emit code change failed event
        this.emit(ComponentRegistryEvents.CODE_CHANGE_FAILED, {
          componentId: request.componentId,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Emit error event
      this.emit(ComponentRegistryEvents.ERROR, {
        componentId: request.componentId,
        error
      });
      
      return {
        success: false,
        error: errorMessage,
        componentId: request.componentId
      };
    }
  }

  /**
   * Execute a cross-component code change request affecting multiple components
   * 
   * @param request The cross-component change request
   * @param options Optional settings for the code change
   * @returns Record of results by component ID
   */
  async executeMultiComponentChange(
    request: CrossComponentChangeRequest,
    options?: CodeChangeOptions
  ): Promise<Record<string, CodeChangeResult>> {
    const results: Record<string, CodeChangeResult> = {};
    const successfulChanges: string[] = [];

    try {
      // Validate that all components exist
      for (const componentId of request.componentIds) {
        if (!this.componentStorage.hasComponent(componentId)) {
          return {
            [componentId]: {
              success: false,
              error: `Component with ID ${componentId} not found`,
              componentId
            }
          };
        }
      }

      // Execute changes for each component
      for (const componentId of request.componentIds) {
        const sourceCode = request.changes[componentId];
        if (!sourceCode) continue;

        const changeRequest: CodeChangeRequest = {
          componentId,
          sourceCode,
          description: request.description
        };

        const result = await this.executeCodeChange(changeRequest, options);
        results[componentId] = result;

        if (result.success) {
          successfulChanges.push(componentId);
        } else {
          // If any component fails, revert all successful changes
          for (const id of successfulChanges) {
            const versions = this.getVersionHistory(id);
            if (versions.length > 1) {
              // Revert to previous version (index 1 since newest is at index 0)
              this.revertToVersion(id, versions[1].id);
            }
          }

          // Return results with error
          return results;
        }
      }

      return results;
    } catch (error) {
      // Handle errors and revert any successful changes
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during multi-component change';

      // Revert all successful changes
      for (const id of successfulChanges) {
        const versions = this.getVersionHistory(id);
        if (versions.length > 1) {
          this.revertToVersion(id, versions[1].id);
        }
      }

      // Log error
      console.error('Error executing multi-component change:', error);

      // Emit error event
      this.emit(ComponentRegistryEvents.ERROR, {
        componentIds: request.componentIds,
        error
      });

      // Return results with error for all components
      for (const componentId of request.componentIds) {
        if (!results[componentId]) {
          results[componentId] = {
            success: false,
            error: errorMessage,
            componentId
          };
        }
      }

      return results;
    }
  }

  /**
   * Get component relationships from the relationship graph
   * 
   * @param componentId The ID of the component
   * @returns The component's relationships or null if not found
   */
  getComponentRelationships(componentId: string): ComponentRelationship | null {
    return this.relationshipManager.getRelationships(componentId);
  }

  /**
   * Get all components that would be affected by changes to the specified components
   * 
   * @param componentIds The IDs of the components that are changing
   * @returns Array of component IDs that would be affected by the changes
   */
  getAffectedComponents(componentIds: string | string[]): string[] {
    return this.relationshipManager.getAffectedComponents(componentIds);
  }

  /**
   * Get all state keys that are related to a component
   * 
   * @param componentId The ID of the component
   * @returns Array of state keys used by the component or related components
   */
  getRelatedStateKeys(componentId: string): string[] {
    return this.relationshipManager.getRelatedStateKeys(componentId);
  }

  /**
   * Get a visualization of the component graph
   * 
   * @returns The visualization data
   */
  visualizeComponentGraph() {
    return this.relationshipManager.visualizeGraph();
  }
}

export default ComponentRegistry;