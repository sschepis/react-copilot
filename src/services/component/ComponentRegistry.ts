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
import { RelationshipGraph } from './RelationshipGraph';
import { nanoid } from 'nanoid';
import { validateCode } from '../../utils/validation';
import { executeCodeChange } from '../codeExecution';

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

// Default permissions when none are provided
const DEFAULT_PERMISSIONS: Permissions = {
  allowComponentCreation: true,
  allowComponentDeletion: false,
  allowStyleChanges: true,
  allowLogicChanges: true,
  allowDataAccess: true,
  allowNetworkRequests: false,
};

/**
 * Enhanced Component Registry with relationship tracking and version history
 */
export class ComponentRegistry extends EventEmitter {
  private components: Map<string, ModifiableComponent> = new Map();
  private relationshipGraph: RelationshipGraph = new RelationshipGraph();
  private versionHistory: Map<string, ComponentVersion[]> = new Map(); // componentId -> versions
  private permissions: Permissions;

  /**
   * Create a new ComponentRegistry
   * @param permissions Optional permissions for code validation
   */
  constructor(permissions?: Partial<Permissions>) {
    super();
    this.permissions = { ...DEFAULT_PERMISSIONS, ...permissions };
  }

  /**
   * Register a component with the registry
   * @param component The component to register
   */
  registerComponent(component: ModifiableComponent): void {
    // Check if component already exists
    if (this.components.has(component.id)) {
      // Just update it if it exists
      this.updateComponent(component.id, component);
      return;
    }

    // Ensure component has all required fields
    const enhancedComponent: ModifiableComponent = {
      ...component,
      versions: component.versions || [],
      relationships: component.relationships || {
        childrenIds: [],
        siblingIds: [],
        dependsOn: [],
        dependedOnBy: [],
        sharedStateKeys: [],
      }
    };

    // Store the component
    this.components.set(component.id, enhancedComponent);
    
    // Add to relationship graph
    this.relationshipGraph.addComponent(enhancedComponent);
    
    // Initialize version history if component has source code
    if (enhancedComponent.sourceCode) {
      this.createVersion(enhancedComponent.id, enhancedComponent.sourceCode, 'Initial version');
    }

    // Update relationships based on component path if available
    if (enhancedComponent.path && enhancedComponent.path.length > 1) {
      // Last element is the component itself, so get the parent from the path
      const parentPath = enhancedComponent.path.slice(0, -1);
      
      // Find the parent component by path
      for (const [id, comp] of this.components.entries()) {
        if (comp.path && 
            comp.path.length === parentPath.length && 
            comp.path.every((item, index) => item === parentPath[index])) {
          
          // Set parent-child relationship
          this.relationshipGraph.setParentChild(id, enhancedComponent.id);
          break;
        }
      }
    }

    // Track dependencies if available
    if (enhancedComponent.dependencies) {
      for (const [id, comp] of this.components.entries()) {
        if (comp.name && enhancedComponent.dependencies.includes(comp.name)) {
          this.relationshipGraph.addDependency(enhancedComponent.id, id);
        }
      }
    }

    // Emit registration event
    this.emit(ComponentRegistryEvents.COMPONENT_REGISTERED, { componentId: component.id });
  }

  /**
   * Unregister a component from the registry
   * @param componentId The ID of the component to unregister
   */
  unregisterComponent(componentId: string): void {
    if (!this.components.has(componentId)) {
      return;
    }

    // Remove from components map
    this.components.delete(componentId);
    
    // Remove from relationship graph
    this.relationshipGraph.removeComponent(componentId);
    
    // Remove version history
    this.versionHistory.delete(componentId);

    // Emit unregistration event
    this.emit(ComponentRegistryEvents.COMPONENT_UNREGISTERED, { componentId });
  }

  /**
   * Update a component in the registry
   * @param componentId The ID of the component to update
   * @param updates Partial component updates to apply
   */
  updateComponent(componentId: string, updates: Partial<ModifiableComponent>): void {
    const currentComponent = this.components.get(componentId);
    if (!currentComponent) {
      throw new Error(`Component with ID ${componentId} not found`);
    }

    // Check if source code is being updated
    const sourceCodeUpdated = updates.sourceCode !== undefined && 
                            updates.sourceCode !== currentComponent.sourceCode;

    // Create updated component
    const updatedComponent = {
      ...currentComponent,
      ...updates,
    };

    // Update in components map
    this.components.set(componentId, updatedComponent);

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
   * @param permissions The permissions to set
   */
  setPermissions(permissions: Partial<Permissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
  }

  /**
   * Get the current permissions
   * @returns The current permissions
   */
  getPermissions(): Permissions {
    return this.permissions;
  }

  /**
   * Get a component by ID
   * @param componentId The ID of the component to get
   * @returns The component or null if not found
   */
  getComponent(componentId: string): ModifiableComponent | null {
    return this.components.get(componentId) || null;
  }

  /**
   * Get all registered components
   * @returns A record of all components by ID
   */
  getAllComponents(): Record<string, ModifiableComponent> {
    return Object.fromEntries(this.components.entries());
  }

  /**
   * Create a new version of a component
   * @param componentId The ID of the component
   * @param sourceCode The source code for the new version
   * @param description A description of the changes
   * @param author Optional author of the changes
   * @returns The newly created version
   */
  createVersion(componentId: string, sourceCode: string, description: string, author?: string): ComponentVersion {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component with ID ${componentId} not found`);
    }

    // Create new version
    const version: ComponentVersion = {
      id: nanoid(),
      timestamp: Date.now(),
      sourceCode,
      description,
      author,
    };

    // Initialize version history for this component if needed
    if (!this.versionHistory.has(componentId)) {
      this.versionHistory.set(componentId, []);
    }

    // Add to version history
    const versions = this.versionHistory.get(componentId)!;
    versions.unshift(version); // Add new version at the beginning
    
    // Update component's versions array
    this.updateComponent(componentId, { versions });

    // Emit version creation event
    this.emit(ComponentRegistryEvents.COMPONENT_VERSION_CREATED, {
      componentId,
      versionId: version.id
    });

    return version;
  }

  /**
   * Get version history for a component
   * @param componentId The ID of the component
   * @returns Array of versions or empty array if component not found
   */
  getVersionHistory(componentId: string): ComponentVersion[] {
    return this.versionHistory.get(componentId) || [];
  }

  /**
   * Revert a component to a specific version
   * @param componentId The ID of the component
   * @param versionId The ID of the version to revert to
   * @returns True if revert was successful
   */
  revertToVersion(componentId: string, versionId: string): boolean {
    const versions = this.versionHistory.get(componentId);
    if (!versions) {
      return false;
    }

    const version = versions.find(v => v.id === versionId);
    if (!version) {
      return false;
    }

    // Update the component with the version's source code
    this.updateComponent(componentId, {
      sourceCode: version.sourceCode
    });

    // Create a new version marking the revert
    this.createVersion(
      componentId,
      version.sourceCode,
      `Reverted to version from ${new Date(version.timestamp).toLocaleString()}`
    );

    // Emit version revert event
    this.emit(ComponentRegistryEvents.COMPONENT_VERSION_REVERTED, {
      componentId,
      versionId
    });

    return true;
  }

  /**
   * Execute a code change request for a single component
   * @param request The code change request
   * @returns The result of the code change
   */
  async executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult> {
    try {
      // Get the target component
      const component = this.getComponent(request.componentId);
      if (!component) {
        return {
          success: false,
          error: `Component with ID ${request.componentId} not found`,
          componentId: request.componentId
        };
      }

      // Validate the code change against permissions
      const validationResult = validateCode(
        request.sourceCode, 
        component.sourceCode || '', 
        this.permissions
      );

      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error || 'Code validation failed',
          componentId: request.componentId
        };
      }

      // Execute the code change
      const result = await executeCodeChange(request);

      if (result.success && result.newSourceCode) {
        // Create a new version with the changes
        this.createVersion(
          request.componentId,
          result.newSourceCode,
          request.description || 'Code updated'
        );

        // Update the component's source code
        this.updateComponent(request.componentId, {
          sourceCode: result.newSourceCode
        });

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
   * @param request The cross-component change request
   * @returns Record of results by component ID
   */
  async executeMultiComponentChange(
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>> {
    const results: Record<string, CodeChangeResult> = {};
    const successfulChanges: string[] = [];

    try {
      // Validate that all components exist
      for (const componentId of request.componentIds) {
        if (!this.components.has(componentId)) {
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

        const result = await this.executeCodeChange(changeRequest);
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
   * @param componentId The ID of the component
   * @returns The component's relationships or null if not found
   */
  getComponentRelationships(componentId: string): ComponentRelationship | null {
    return this.relationshipGraph.getRelationships(componentId);
  }

  /**
   * Get all components that would be affected by changes to the specified components
   * @param componentIds The IDs of the components that are changing
   * @returns Array of component IDs that would be affected by the changes
   */
  getAffectedComponents(componentIds: string | string[]): string[] {
    const ids = Array.isArray(componentIds) ? componentIds : [componentIds];
    return this.relationshipGraph.getAffectedComponents(ids);
  }

  /**
   * Get all state keys that are related to a component
   * @param componentId The ID of the component
   * @returns Array of state keys used by the component or related components
   */
  getRelatedStateKeys(componentId: string): string[] {
    return this.relationshipGraph.getRelatedStateKeys(componentId);
  }

  /**
   * Get a visualization of the component relationship graph
   * @returns A visualization-ready representation of the graph
   */
  visualizeComponentGraph() {
    return this.relationshipGraph.visualizeGraph();
  }
}