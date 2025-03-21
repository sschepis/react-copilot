import { ComponentRelationship, ModifiableComponent } from '../../utils/types';
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
/**
 * Manages relationships between components, tracking dependencies,
 * parent-child relationships, and state usage
 */
export declare class RelationshipGraph {
    private componentRelationships;
    private stateUsage;
    /**
     * Add or update a component in the relationship graph
     * @param component The component to add or update
     */
    addComponent(component: ModifiableComponent): void;
    /**
     * Remove a component from the relationship graph
     * @param componentId The ID of the component to remove
     */
    removeComponent(componentId: string): void;
    /**
     * Set parent-child relationship between components
     * @param parentId The ID of the parent component
     * @param childId The ID of the child component
     */
    setParentChild(parentId: string, childId: string): void;
    /**
     * Update sibling relationships for all children of a parent
     * @param parentId The ID of the parent component
     */
    private updateSiblings;
    /**
     * Add a dependency relationship between components
     * @param dependentId The ID of the component that depends on another
     * @param dependencyId The ID of the component being depended on
     */
    addDependency(dependentId: string, dependencyId: string): void;
    /**
     * Track state usage by a component
     * @param componentId The ID of the component using state
     * @param stateKey The state key being used
     */
    trackStateUsage(componentId: string, stateKey: string): void;
    /**
     * Get a component's relationship information
     * @param componentId The ID of the component
     * @returns The component's relationships or null if not found
     */
    getRelationships(componentId: string): ComponentRelationship | null;
    /**
     * Get all components that would be affected by changes to the specified components
     * @param componentIds The IDs of the components that are changing
     * @returns Array of component IDs that would be affected by the changes
     */
    getAffectedComponents(componentIds: string[]): string[];
    /**
     * Get all state keys that are related to a component
     * @param componentId The ID of the component
     * @returns Array of state keys used by the component or related components
     */
    getRelatedStateKeys(componentId: string): string[];
    /**
     * Generate a visualization of the component relationship graph
     * @returns A visualization-ready representation of the graph
     */
    visualizeGraph(): ComponentGraphVisualization;
}
