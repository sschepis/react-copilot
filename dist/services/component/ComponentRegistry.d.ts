import { EventEmitter } from '../../utils/EventEmitter';
import { CodeChangeRequest, CodeChangeResult, CrossComponentChangeRequest, ComponentRelationship, ComponentVersion, ModifiableComponent, Permissions } from '../../utils/types';
/**
 * Events emitted by the ComponentRegistry
 */
export declare enum ComponentRegistryEvents {
    COMPONENT_REGISTERED = "component_registered",
    COMPONENT_UNREGISTERED = "component_unregistered",
    COMPONENT_UPDATED = "component_updated",
    COMPONENT_VERSION_CREATED = "component_version_created",
    COMPONENT_VERSION_REVERTED = "component_version_reverted",
    CODE_CHANGE_APPLIED = "code_change_applied",
    CODE_CHANGE_FAILED = "code_change_failed",
    ERROR = "error"
}
/**
 * Enhanced Component Registry with relationship tracking and version history
 */
export declare class ComponentRegistry extends EventEmitter {
    private components;
    private relationshipGraph;
    private versionHistory;
    private permissions;
    /**
     * Create a new ComponentRegistry
     * @param permissions Optional permissions for code validation
     */
    constructor(permissions?: Partial<Permissions>);
    /**
     * Register a component with the registry
     * @param component The component to register
     */
    registerComponent(component: ModifiableComponent): void;
    /**
     * Unregister a component from the registry
     * @param componentId The ID of the component to unregister
     */
    unregisterComponent(componentId: string): void;
    /**
     * Update a component in the registry
     * @param componentId The ID of the component to update
     * @param updates Partial component updates to apply
     */
    updateComponent(componentId: string, updates: Partial<ModifiableComponent>): void;
    /**
     * Set permissions for code validation
     * @param permissions The permissions to set
     */
    setPermissions(permissions: Partial<Permissions>): void;
    /**
     * Get the current permissions
     * @returns The current permissions
     */
    getPermissions(): Permissions;
    /**
     * Get a component by ID
     * @param componentId The ID of the component to get
     * @returns The component or null if not found
     */
    getComponent(componentId: string): ModifiableComponent | null;
    /**
     * Get all registered components
     * @returns A record of all components by ID
     */
    getAllComponents(): Record<string, ModifiableComponent>;
    /**
     * Create a new version of a component
     * @param componentId The ID of the component
     * @param sourceCode The source code for the new version
     * @param description A description of the changes
     * @param author Optional author of the changes
     * @returns The newly created version
     */
    createVersion(componentId: string, sourceCode: string, description: string, author?: string): ComponentVersion;
    /**
     * Get version history for a component
     * @param componentId The ID of the component
     * @returns Array of versions or empty array if component not found
     */
    getVersionHistory(componentId: string): ComponentVersion[];
    /**
     * Revert a component to a specific version
     * @param componentId The ID of the component
     * @param versionId The ID of the version to revert to
     * @returns True if revert was successful
     */
    revertToVersion(componentId: string, versionId: string): boolean;
    /**
     * Execute a code change request for a single component
     * @param request The code change request
     * @returns The result of the code change
     */
    executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult>;
    /**
     * Execute a cross-component code change request affecting multiple components
     * @param request The cross-component change request
     * @returns Record of results by component ID
     */
    executeMultiComponentChange(request: CrossComponentChangeRequest): Promise<Record<string, CodeChangeResult>>;
    /**
     * Get component relationships from the relationship graph
     * @param componentId The ID of the component
     * @returns The component's relationships or null if not found
     */
    getComponentRelationships(componentId: string): ComponentRelationship | null;
    /**
     * Get all components that would be affected by changes to the specified components
     * @param componentIds The IDs of the components that are changing
     * @returns Array of component IDs that would be affected by the changes
     */
    getAffectedComponents(componentIds: string | string[]): string[];
    /**
     * Get all state keys that are related to a component
     * @param componentId The ID of the component
     * @returns Array of state keys used by the component or related components
     */
    getRelatedStateKeys(componentId: string): string[];
    /**
     * Get a visualization of the component relationship graph
     * @returns A visualization-ready representation of the graph
     */
    visualizeComponentGraph(): import("./RelationshipGraph").ComponentGraphVisualization;
}
