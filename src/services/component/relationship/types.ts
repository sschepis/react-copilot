import { ComponentRelationship, ModifiableComponent } from '../../../utils/types';

/**
 * Relationship types that can exist between components
 */
export enum RelationshipType {
  PARENT_CHILD = 'parent-child',       // Direct parent-child relationship
  SIBLING = 'sibling',                 // Components with same parent
  PROP_DEPENDENCY = 'prop-dependency', // Component passes props to another
  STATE_DEPENDENCY = 'state-dependency', // Component shares state with another
  CONTEXT_DEPENDENCY = 'context-dependency', // Components share React context
  REFERENCE = 'reference',             // Component references another (e.g. via refs)
  EVENT_DEPENDENCY = 'event-dependency', // Component emits events caught by another
  CUSTOM = 'custom'                    // User-defined relationship
}

/**
 * Interface for a relationship between two components
 */
export interface ComponentGraphRelationship {
  sourceId: string;                   // Source component ID
  targetId: string;                   // Target component ID
  type: RelationshipType;             // Type of relationship
  strength: number;                   // Relationship strength (0-1)
  metadata?: {                        // Additional relationship metadata
    propNames?: string[];             // Prop names involved in relationship
    stateKeys?: string[];             // State keys involved in relationship
    contextNames?: string[];          // Context names involved in relationship
    description?: string;             // Description of the relationship
    [key: string]: any;               // Custom metadata
  };
}

/**
 * Component relationship detection strategies
 */
export interface RelationshipDetectionStrategy {
  name: string;
  detectRelationships(
    component: ModifiableComponent,
    allComponents: Record<string, ModifiableComponent>
  ): ComponentGraphRelationship[];
}

/**
 * Visualization node data
 */
export interface VisualizationNode {
  id: string;
  name: string;
  type: string;
  neighbors: number;
}

/**
 * Visualization edge data
 */
export interface VisualizationEdge {
  source: string;
  target: string;
  type: RelationshipType;
  strength: number;
}

/**
 * Graph visualization data
 */
export interface VisualizationData {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
}