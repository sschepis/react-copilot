import { EventEmitter } from '../../../utils/EventEmitter';
import { eventBus } from '../../../utils/EventBus';
import { CommonEvents } from '../../../utils/CommonEvents';
import { logger, LogCategory } from '../../../utils/LoggingSystem';
import { errorHandling, ErrorCategory, ErrorSeverity } from '../../../utils/ErrorHandling';
import {
  CodeChangeRequest,
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentRelationship,
  ComponentVersion,
  ModifiableComponent,
  Permissions
} from '../../../utils/types';
import { ComponentRegistryEvents, DEFAULT_PERMISSIONS } from './types';
import { IComponentStorage } from './types';
import { IVersionManager } from './types';
import { IRelationshipManager } from './types';
import { IRegistryValidator } from './types';
import { ComponentTransformManager } from './ComponentTransformManager';
import { ComponentLifecycleManager, ComponentLifecycleHook } from './ComponentLifecycleManager';
import { ComponentMetadataManager } from './ComponentMetadataManager';
import { ComponentDiscoveryManager, ComponentDiscoveryOptions, ComponentDiscoveryResult } from './ComponentDiscoveryManager';

/**
 * Component registry with advanced features
 */
export class ComponentRegistry extends EventEmitter {
  private components: Map<string, ModifiableComponent> = new Map();
  private transformManager: ComponentTransformManager;
  private lifecycleManager: ComponentLifecycleManager;
  private metadataManager: ComponentMetadataManager;
  private discoveryManager: ComponentDiscoveryManager;
  private permissions: Permissions;
  private log = logger.getChildLogger(LogCategory.COMPONENT);
  
  /**
   * Create a new ComponentRegistry
   * @param storage Component storage service
   * @param versionManager Version management service
   * @param relationshipManager Relationship management service
   * @param validator Registry validation service
   * @param permissions Optional permissions configuration
   */
  constructor(
    private storage: IComponentStorage,
    private versionManager: IVersionManager,
    private relationshipManager: IRelationshipManager,
    private validator: IRegistryValidator,
    permissions?: Partial<Permissions>
  ) {
    super();
    this.permissions = { ...DEFAULT_PERMISSIONS, ...permissions };
    this.transformManager = new ComponentTransformManager();
    this.lifecycleManager = new ComponentLifecycleManager();
    this.metadataManager = new ComponentMetadataManager();
    this.discoveryManager = new ComponentDiscoveryManager();
    
    // Add default transforms
    this.addDefaultTransforms();
  }
  
  /**
   * Add default component transforms
   */
  private addDefaultTransforms(): void {
    // Add metadata extraction transform
    this.transformManager.registerTransform({
      name: 'metadata-extractor',
      priority: 100,
      beforeRegister: async (component) => {
        // Update metadata before registration
        this.metadataManager.updateComponentMetadata(component);
        return component;
      },
      afterRegister: async (component) => {
        // Update metadata after registration
        this.metadataManager.updateComponentMetadata(component);
      },
      afterUpdate: async (component) => {
        // Update metadata after component update
        this.metadataManager.updateComponentMetadata(component);
      }
    });
    
    // Add relationship detection transform
    this.transformManager.registerTransform({
      name: 'relationship-detector',
      priority: 90,
      afterRegister: async (component) => {
        // Add component to relationship manager
        this.relationshipManager.addComponent(component);
        
        // Detect relationships with other components
        this.detectRelationships(component);
      },
      afterUpdate: async (component) => {
        // Re-detect relationships after update
        this.detectRelationships(component);
      }
    });
  }
  
  /**
   * Detect relationships between this component and others
   * @param component The component to detect relationships for
   */
  private detectRelationships(component: ModifiableComponent): void {
    const metadata = this.metadataManager.getComponentMetadata(component.id);
    if (!metadata) return;
    
    const sourceCode = component.sourceCode;
    if (!sourceCode) return;
    
    // Find explicit component references
    for (const [otherComponentId, otherComponent] of this.components.entries()) {
      if (otherComponentId === component.id) continue;
      
      // Check if this component references the other component
      const reference = new RegExp(`<\\s*${otherComponent.name}\\s*[\\/>]|<\\s*${otherComponent.name}\\s+`);
      
      if (reference.test(sourceCode)) {
        // Add dependency relationship
        this.relationshipManager.addDependency(component.id, otherComponentId);
      }
    }
  }
  
  /**
   * Register a component with the registry
   * @param component The component to register
   */
  async registerComponent(component: ModifiableComponent): Promise<void> {
    if (this.components.has(component.id)) {
      this.log.warn(`Component with ID ${component.id} already registered, updating instead`);
      await this.updateComponent(component.id, component);
      return;
    }
    
    try {
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.BEFORE_REGISTER, component);
      
      // Apply transforms
      let processedComponent = await this.transformManager.applyBeforeRegisterTransforms(component);
      
      // Add the component
      this.components.set(processedComponent.id, processedComponent);
      this.storage.storeComponent(processedComponent);
      
      // Create initial version
      if (processedComponent.sourceCode) {
        this.versionManager.createVersion(
          processedComponent.id,
          processedComponent.sourceCode,
          'Initial version',
          { author: processedComponent.metadata?.author as string | undefined }
        );
      }
      
      // Run post-registration transforms
      await this.transformManager.applyAfterRegisterTransforms(processedComponent);
      
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.AFTER_REGISTER, processedComponent);
      
      this.log.info(`Component registered: ${processedComponent.name} (${processedComponent.id})`);
      
      // Emit event
      this.emit(ComponentRegistryEvents.COMPONENT_REGISTERED, { component: processedComponent });
      eventBus.publish(CommonEvents.COMPONENT_REGISTERED, { component: processedComponent });
      
    } catch (error) {
      this.log.error(`Failed to register component: ${component.name}`, error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.COMPONENT,
        {
          message: `Failed to register component: ${component.name}`,
          componentId: component.id
        }
      );
      throw error;
    }
  }
  
  /**
   * Unregister a component from the registry
   * @param componentId The ID of the component to unregister
   */
  async unregisterComponent(componentId: string): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      this.log.warn(`Cannot unregister component with ID ${componentId} - not found`);
      return;
    }
    
    try {
      // Run lifecycle hooks
      const shouldProceed = await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.BEFORE_UNREGISTER, component);
      if (shouldProceed === false) {
        this.log.info(`Unregistration of component ${componentId} was cancelled by a lifecycle hook`);
        return;
      }
      
      // Run pre-unregister transforms
      const canProceed = await this.transformManager.applyBeforeUnregisterTransforms(component);
      if (canProceed === false) {
        this.log.info(`Unregistration of component ${componentId} was cancelled by a transform`);
        return;
      }
      
      // Remove from components map
      this.components.delete(componentId);
      this.storage.removeComponent(componentId);
      
      // Remove from metadata
      this.metadataManager.removeComponentMetadata(componentId);
      
      // Remove from relationship graph
      this.relationshipManager.removeComponent(componentId);
      
      this.log.info(`Component unregistered: ${component.name} (${componentId})`);
      
      // Emit event
      this.emit(ComponentRegistryEvents.COMPONENT_UNREGISTERED, { 
        componentId,
        componentName: component.name
      });
      eventBus.publish(CommonEvents.COMPONENT_UNREGISTERED, { 
        componentId,
        componentName: component.name
      });
      
    } catch (error) {
      this.log.error(`Failed to unregister component: ${componentId}`, error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.COMPONENT,
        {
          message: `Failed to unregister component: ${componentId}`,
          componentId
        }
      );
      throw error;
    }
  }
  
  /**
   * Update a component in the registry
   * @param componentId The ID of the component to update
   * @param updates Partial component updates to apply
   */
  async updateComponent(
    componentId: string, 
    updates: Partial<ModifiableComponent>
  ): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Cannot update component with ID ${componentId} - not found`);
    }
    
    try {
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.BEFORE_UPDATE, component, { updates });
      
      // Apply transforms to updates
      const processedUpdates = await this.transformManager.applyBeforeUpdateTransforms(component, updates);
      
      // Create new component by merging existing with updates
      const updatedComponent: ModifiableComponent = {
        ...component,
        ...processedUpdates
      };
      
      // Update the component
      this.components.set(componentId, updatedComponent);
      this.storage.updateComponent(componentId, updatedComponent);
      
      // Create a new version if source code changed
      if (processedUpdates.sourceCode && processedUpdates.sourceCode !== component.sourceCode) {
        await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.BEFORE_VERSION_CREATE, updatedComponent);
        
        // Store description in a local variable
        const versionDesc = processedUpdates.metadata?.versionDescription || 'Update component';
        const author = processedUpdates.metadata?.author || undefined;
        
        const version = this.versionManager.createVersion(
          componentId,
          processedUpdates.sourceCode,
          versionDesc,
          author
        );
        
        await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.AFTER_VERSION_CREATE, updatedComponent, { version });
      }
      
      // Run post-update transforms
      await this.transformManager.applyAfterUpdateTransforms(updatedComponent);
      
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.AFTER_UPDATE, updatedComponent);
      
      this.log.info(`Component updated: ${updatedComponent.name} (${componentId})`);
      
      // Emit event
      this.emit(ComponentRegistryEvents.COMPONENT_UPDATED, { 
        component: updatedComponent,
        previousComponent: component
      });
      eventBus.publish(CommonEvents.COMPONENT_UPDATED, {
        componentId,
        componentName: updatedComponent.name
      });
      
    } catch (error) {
      this.log.error(`Failed to update component: ${componentId}`, error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.COMPONENT,
        {
          message: `Failed to update component: ${componentId}`,
          componentId
        }
      );
      throw error;
    }
  }
  
  /**
   * Get a component by ID
   * @param componentId The ID of the component to get
   */
  getComponent(componentId: string): ModifiableComponent | null {
    return this.components.get(componentId) || this.storage.getComponent(componentId);
  }
  
  /**
   * Get component metadata
   * @param componentId The ID of the component
   */
  getComponentMetadata(componentId: string): any {
    return this.metadataManager.getComponentMetadata(componentId);
  }
  
  /**
   * Get all registered components
   */
  getAllComponents(): Record<string, ModifiableComponent> {
    const result: Record<string, ModifiableComponent> = {};
    for (const [id, component] of this.components.entries()) {
      result[id] = component;
    }
    return result;
  }
  
  /**
   * Get all component metadata
   */
  getAllComponentMetadata(): Record<string, any> {
    return this.metadataManager.getAllComponentMetadata();
  }
  
  /**
   * Create a new version of a component
   * @param componentId The ID of the component
   * @param sourceCode The source code for the new version
   * @param description A description of the changes
   * @param author Optional author of the changes
   */
  async createVersion(
    componentId: string,
    sourceCode: string,
    description: string,
    author?: string
  ): Promise<ComponentVersion | null> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Cannot create version for component with ID ${componentId} - not found`);
    }
    
    try {
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.BEFORE_VERSION_CREATE, component, {
        sourceCode,
        description,
        author
      });
      
      // Create version
      const version = this.versionManager.createVersion(
        componentId,
        sourceCode,
        description,
        { author }
      );
      
      // Update component with new source code
      await this.updateComponent(componentId, { sourceCode });
      
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.AFTER_VERSION_CREATE, component, { version });
      
      // Emit event
      this.emit(ComponentRegistryEvents.COMPONENT_VERSION_CREATED, {
        componentId,
        componentName: component.name,
        version
      });
      eventBus.publish(CommonEvents.COMPONENT_VERSION_CREATED, {
        componentId,
        versionId: version?.id
      });
      
      return version;
    } catch (error) {
      this.log.error(`Failed to create version for component: ${componentId}`, error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.COMPONENT,
        {
          message: `Failed to create version for component: ${componentId}`,
          componentId
        }
      );
      throw error;
    }
  }
  
  /**
   * Get version history for a component
   * @param componentId The ID of the component
   */
  getVersionHistory(componentId: string): ComponentVersion[] {
    return this.versionManager.getVersionHistory(componentId);
  }
  
  /**
   * Revert to a specific version
   * @param componentId The ID of the component
   * @param versionId The ID of the version to revert to
   */
  async revertToVersion(componentId: string, versionId: string): Promise<boolean> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Cannot revert component with ID ${componentId} - not found`);
    }
    
    try {
      // Try to revert to the specified version
      const success = this.versionManager.revertToVersion(componentId, versionId, {
        createNewVersion: false // Don't create a new version yet, we'll handle that manually
      });
      
      if (success) {
        // The revert was successful, so update the component metadata
        // Get the latest version of the component after reversion
        const updatedComponent = this.getComponent(componentId);
        
        if (updatedComponent && updatedComponent.sourceCode) {
          // Update component metadata
          await this.updateComponent(componentId, {
            metadata: { versionDescription: `Reverted to version: ${versionId}` }
          });
          
          // Emit event
          this.emit(ComponentRegistryEvents.COMPONENT_VERSION_REVERTED, {
            componentId,
            componentName: component.name,
            versionId
          });
          eventBus.publish(CommonEvents.COMPONENT_VERSION_REVERTED, {
            componentId,
            versionId
          });
        }
      }
      return success;
    } catch (error) {
      this.log.error(`Failed to revert component: ${componentId} to version: ${versionId}`, error);
      errorHandling.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorSeverity.ERROR,
        ErrorCategory.COMPONENT,
        {
          message: `Failed to revert component: ${componentId} to version: ${versionId}`,
          componentId
        }
      );
      throw error;
    }
  }
  
  /**
   * Execute a code change for a component
   * @param request The code change request
   */
  async executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult> {
    const { componentId, sourceCode: newCode, description } = request;
    const component = this.components.get(componentId);
    
    if (!component) {
      return {
        success: false,
        error: `Component with ID ${componentId} not found`,
        componentId  // Add required property
      };
    }
    
    try {
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.BEFORE_CODE_CHANGE, component, { request });
      
      // Use sourceCode or newCode property - CodeChangeRequest may have either
      const sourceCode = newCode || request.sourceCode;
      
      if (!sourceCode) {
        throw new Error('No source code provided in the request');
      }
      
      // Create new version with the updated code
      const version = await this.createVersion(
        componentId,
        sourceCode,
        description || 'Code change',
        component.metadata?.author as string | undefined
      );
      
      // Update the component
      await this.updateComponent(componentId, {
        sourceCode,
        metadata: {
          ...(component.metadata || {}),
          versionDescription: description
        }
      });
      
      // Run lifecycle hooks
      await this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.AFTER_CODE_CHANGE, component, {
        request,
        version
      });
      
      // Emit event
      this.emit(ComponentRegistryEvents.CODE_CHANGE_APPLIED, {
        componentId,
        componentName: component.name,
        sourceCode
      });
      eventBus.publish(CommonEvents.CODE_CHANGE_APPLIED, {
        componentId,
        componentName: component.name
      });
      
      return {
        success: true,
        componentId,
        versionId: version?.id
      };
    } catch (error) {
      this.log.error(`Failed to execute code change for component: ${componentId}`, error);
      
      // Emit event
      this.emit(ComponentRegistryEvents.CODE_CHANGE_FAILED, {
        componentId,
        componentName: component.name,
        error
      });
      eventBus.publish(CommonEvents.CODE_CHANGE_FAILED, {
        componentId,
        componentName: component.name,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        componentId  // Add required property
      };
    }
  }
  
  /**
   * Execute a cross-component code change
   * @param request The cross-component change request
   */
  async executeMultiComponentChange(
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>> {
    const results: Record<string, CodeChangeResult> = {};
    const { changes, description } = request;
    
    // Get all affected components
    const affectedComponentIds = Object.keys(changes);
    
    try {
      // Execute changes for each component
      for (const componentId of affectedComponentIds) {
        const sourceCode = changes[componentId];
        
        // Get the component for metadata reference
        const component = this.components.get(componentId);
        
        const result = await this.executeCodeChange({
          componentId,
          sourceCode,
          newCode: sourceCode, // Include required newCode property
          description: description || 'Multi-component change',
          metadata: {
            ...(component?.metadata || {}),
            source: 'multi-component-change'
          }
        });
        
        results[componentId] = result;
        
        // If any change fails, stop processing
        if (!result.success) {
          break;
        }
      }
      
      return results;
    } catch (error) {
      this.log.error('Failed to execute multi-component change', error);
      
      // For any components not yet processed, add error result
      for (const componentId of affectedComponentIds) {
        if (!results[componentId]) {
          results[componentId] = {
            success: false,
            error: 'Processing stopped due to earlier error',
            componentId
          };
        }
      }
      
      return results;
    }
  }
  
  /**
   * Get a component's relationships
   * @param componentId The ID of the component
   */
  getComponentRelationships(componentId: string): ComponentRelationship | null {
    return this.relationshipManager.getRelationships(componentId);
  }
  
  /**
   * Get all components that would be affected by changes to the specified components
   * @param componentIds The IDs of the components that are changing
   */
  getAffectedComponents(componentIds: string | string[]): string[] {
    return this.relationshipManager.getAffectedComponents(componentIds);
  }
  
  /**
   * Get all state keys related to a component
   * @param componentId The ID of the component
   */
  getRelatedStateKeys(componentId: string): string[] {
    return this.relationshipManager.getRelatedStateKeys(componentId);
  }
  
  /**
   * Visualize the component graph
   */
  visualizeComponentGraph() {
    return this.relationshipManager.visualizeGraph();
  }
  
  /**
   * Set permissions for code validation
   * @param permissions The permissions to set
   */
  setPermissions(permissions: Partial<Permissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
    this.validator.setPermissions(this.permissions);
  }
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions {
    return { ...this.permissions };
  }
  
  /**
   * Register a component transform
   * @param transform The transform to register
   */
  registerTransform(transform: any): void {
    this.transformManager.registerTransform(transform);
  }
  
  /**
   * Unregister a component transform
   * @param name The name of the transform to unregister
   */
  unregisterTransform(name: string): boolean {
    return this.transformManager.unregisterTransform(name);
  }
  
  /**
   * Get all registered transforms
   */
  getTransforms(): any[] {
    return this.transformManager.getTransforms();
  }
  
  /**
   * Register a lifecycle hook
   * @param hook The lifecycle hook to register for
   * @param callback The callback function
   */
  registerLifecycleHook(hook: ComponentLifecycleHook, callback: any): void {
    this.lifecycleManager.registerLifecycleHook(hook, callback);
  }
  
  /**
   * Unregister a lifecycle hook
   * @param hook The lifecycle hook to unregister from
   * @param callback The callback function to remove
   */
  unregisterLifecycleHook(hook: ComponentLifecycleHook, callback: any): boolean {
    return this.lifecycleManager.unregisterLifecycleHook(hook, callback);
  }
  
  /**
   * Track a component render
   * @param componentId The ID of the component
   * @param renderTime Render duration in milliseconds
   */
  trackComponentRender(componentId: string, renderTime?: number): void {
    this.metadataManager.trackComponentRender(componentId, renderTime);
    
    // Run render lifecycle hook
    const component = this.components.get(componentId);
    if (component) {
      this.lifecycleManager.runLifecycleHook(ComponentLifecycleHook.RENDER, component, { renderTime });
    }
  }
  
  /**
   * Add a tag to a component
   * @param componentId The ID of the component
   * @param tag The tag to add
   */
  addComponentTag(componentId: string, tag: string): boolean {
    return this.metadataManager.addComponentTag(componentId, tag);
  }
  
  /**
   * Remove a tag from a component
   * @param componentId The ID of the component
   * @param tag The tag to remove
   */
  removeComponentTag(componentId: string, tag: string): boolean {
    return this.metadataManager.removeComponentTag(componentId, tag);
  }
  
  /**
   * Find components by tags
   * @param tags Tags to search for
   * @param matchAll Whether to require all tags (AND) or any tag (OR)
   */
  findComponentsByTags(tags: string[], matchAll = true): ModifiableComponent[] {
    return this.metadataManager.findComponentsByTags(tags, matchAll, this.components);
  }
  
  /**
   * Set component metadata value
   * @param componentId The ID of the component
   * @param key The key to set
   * @param value The value to set
   */
  setComponentMetadataValue(componentId: string, key: string, value: any): boolean {
    return this.metadataManager.setComponentMetadataValue(componentId, key, value);
  }
  
  /**
   * Get component metadata value
   * @param componentId The ID of the component
   * @param key The key to get
   */
  getComponentMetadataValue(componentId: string, key: string): any {
    return this.metadataManager.getComponentMetadataValue(componentId, key);
  }
  
  /**
   * Discover components from source code
   * @param sourceCode The source code to analyze
   * @param options Discovery options
   */
  discoverComponentsFromSource(
    sourceCode: string,
    options: ComponentDiscoveryOptions = {}
  ): ComponentDiscoveryResult {
    return this.discoveryManager.discoverComponentsFromSource(sourceCode, options);
  }
}

export default ComponentRegistry;