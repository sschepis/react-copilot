import { RelationshipType, VisualizationData, VisualizationNode, VisualizationEdge } from './types';
import { RelationshipManager } from './RelationshipManager';

/**
 * Service for visualizing relationship graphs
 * Provides methods to convert relationship data into visualization-friendly formats
 */
export class RelationshipGraphVisualization {
  private relationshipManager: RelationshipManager;

  /**
   * Create a new visualization service
   * @param relationshipManager The relationship manager to use
   */
  constructor(relationshipManager: RelationshipManager) {
    this.relationshipManager = relationshipManager;
  }

  /**
   * Get graph data for visualization
   */
  getGraphData(): VisualizationData {
    return this.relationshipManager.getVisualizationData();
  }

  /**
   * Get a D3-compatible format for force-directed graph
   */
  getD3ForceGraphData(): {
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      group: number;
    }>;
    links: Array<{
      source: string;
      target: string;
      value: number;
      type: string;
    }>;
  } {
    const visualizationData = this.relationshipManager.getVisualizationData();

    // Map relationship types to group numbers for coloring
    const typeToGroup = new Map<RelationshipType, number>([
      [RelationshipType.PARENT_CHILD, 1],
      [RelationshipType.PROP_DEPENDENCY, 2],
      [RelationshipType.STATE_DEPENDENCY, 3],
      [RelationshipType.CONTEXT_DEPENDENCY, 4],
      [RelationshipType.SIBLING, 5],
      [RelationshipType.REFERENCE, 6],
      [RelationshipType.EVENT_DEPENDENCY, 7],
      [RelationshipType.CUSTOM, 8]
    ]);

    // Convert to D3 format
    const nodes = visualizationData.nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      group: typeToGroup.get(node.type as RelationshipType) || 0
    }));

    const links = visualizationData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      value: Math.round(edge.strength * 5), // Scale strength to line width (1-5)
      type: edge.type
    }));

    return { nodes, links };
  }

  /**
   * Get graph data for specific component and its immediate relationships
   * @param componentId The component ID to focus on
   */
  getComponentFocusedGraph(componentId: string): VisualizationData {
    const fullGraph = this.relationshipManager.getVisualizationData();
    const connectedIds = new Set(this.relationshipManager.getConnectedComponents(componentId));
    connectedIds.add(componentId); // Include the component itself

    // Filter nodes to only include the focused component and its connections
    const nodes = fullGraph.nodes.filter(node => 
      connectedIds.has(node.id)
    );

    // Filter edges to only include connections to/from the focused component
    const edges = fullGraph.edges.filter(edge => 
      edge.source === componentId || edge.target === componentId
    );

    return { nodes, edges };
  }

  /**
   * Get a hierarchical tree representation of the component relationships
   * @param rootComponentId The root component ID to start from
   */
  getHierarchicalTree(rootComponentId: string): {
    id: string;
    name: string;
    children: any[];
  } {
    // Helper function to build tree recursively
    const buildTree = (id: string, visited = new Set<string>()): any => {
      if (visited.has(id)) {
        return null; // Prevent cycles
      }
      
      visited.add(id);
      
      const component = this.relationshipManager['componentCache'].get(id);
      if (!component) return null;

      const children: any[] = [];
      
      // Get child relationships
      const relationships = this.relationshipManager['relationships'].get(id) || [];
      for (const rel of relationships) {
        if (rel.type === RelationshipType.PARENT_CHILD) {
          const childTree = buildTree(rel.targetId, new Set(visited));
          if (childTree) {
            children.push(childTree);
          }
        }
      }
      
      return {
        id,
        name: component.name || id,
        type: component.componentType || 'unknown',
        children
      };
    };
    
    return buildTree(rootComponentId) || { id: rootComponentId, name: rootComponentId, children: [] };
  }

  /**
   * Get a dependency matrix representation for all components
   * Useful for adjacency matrix visualizations
   */
  getDependencyMatrix(): {
    components: string[];
    matrix: number[][];
  } {
    const components = Array.from(this.relationshipManager['componentCache'].keys());
    const matrix: number[][] = [];
    
    // Initialize matrix with zeros
    for (let i = 0; i < components.length; i++) {
      matrix.push(Array(components.length).fill(0));
    }
    
    // Fill matrix with relationship strengths
    for (let i = 0; i < components.length; i++) {
      const sourceId = components[i];
      const relationships = this.relationshipManager['relationships'].get(sourceId) || [];
      
      for (const rel of relationships) {
        const targetIndex = components.indexOf(rel.targetId);
        if (targetIndex >= 0) {
          matrix[i][targetIndex] = rel.strength;
        }
      }
    }
    
    return { components, matrix };
  }

  /**
   * Get the relationship types used in the graph
   * Useful for generating legends
   */
  getRelationshipTypes(): {
    type: RelationshipType;
    count: number;
    description: string;
  }[] {
    const typeCounts = new Map<RelationshipType, number>();
    const fullGraph = this.relationshipManager.getVisualizationData();
    
    // Count occurrences of each relationship type
    for (const edge of fullGraph.edges) {
      typeCounts.set(edge.type, (typeCounts.get(edge.type) || 0) + 1);
    }
    
    // Prepare descriptions for each type
    const typeDescriptions = new Map<RelationshipType, string>([
      [RelationshipType.PARENT_CHILD, 'Parent-child component relationship'],
      [RelationshipType.SIBLING, 'Components that share the same parent'],
      [RelationshipType.PROP_DEPENDENCY, 'Component passes props to another'],
      [RelationshipType.STATE_DEPENDENCY, 'Components share state'],
      [RelationshipType.CONTEXT_DEPENDENCY, 'Components share React context'],
      [RelationshipType.REFERENCE, 'Component references another via refs'],
      [RelationshipType.EVENT_DEPENDENCY, 'Component emits events caught by another'],
      [RelationshipType.CUSTOM, 'Custom user-defined relationship']
    ]);
    
    // Build result
    return Array.from(typeCounts.entries()).map(([type, count]) => ({
      type,
      count,
      description: typeDescriptions.get(type) || 'Unknown relationship type'
    }));
  }
}