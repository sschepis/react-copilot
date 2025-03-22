import React, { useEffect, useRef, useState } from 'react';
import { useComponentContext } from '../../context';
import {
  RelationshipType,
  VisualizationData,
  VisualizationNode,
  VisualizationEdge
} from '../../services/component/relationship/types';
import * as d3 from 'd3';

// D3 typings for graph nodes and links
interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  neighbors: number;
  group?: number;
  x?: number;
  y?: number;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  type: RelationshipType;
  strength: number;
  value?: number;
}

interface RelationshipGraphViewProps {
  width?: number;
  height?: number;
  selectedComponentId?: string;
  onSelectComponent?: (componentId: string) => void;
}

/**
 * Interactive graph visualization of component relationships
 * Uses D3's force-directed graph algorithm to display components and their relationships
 */
export const RelationshipGraphView: React.FC<RelationshipGraphViewProps> = ({
  width = 800,
  height = 600,
  selectedComponentId,
  onSelectComponent
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { getComponentRelationships, visualizeComponentGraph, getAllComponents } = useComponentContext();
  const [filter, setFilter] = useState<{
    relationshipTypes: RelationshipType[];
    searchQuery: string;
    showOrphans: boolean;
  }>({
    relationshipTypes: Object.values(RelationshipType),
    searchQuery: '',
    showOrphans: true
  });

  useEffect(() => {
    if (!svgRef.current) return;

    // Get graph data
    const graphData = visualizeComponentGraph();
    if (!graphData || !graphData.nodes || !graphData.nodes.length) {
      return;
    }

    // Apply filters
    const filteredNodes = graphData.nodes.filter(node => {
      // Filter by search query
      if (filter.searchQuery && !node.name.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
        return false;
      }

      // Filter orphans if not showing them
      if (!filter.showOrphans) {
        const hasConnections = graphData.edges.some(
          edge => edge.source === node.id || edge.target === node.id
        );
        if (!hasConnections) return false;
      }

      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    const filteredEdges = graphData.edges.filter(edge => {
      // Filter by relationship type
      if (!filter.relationshipTypes.includes(edge.type)) {
        return false;
      }

      // Filter edges whose nodes have been filtered
      if (!filteredNodeIds.has(edge.source) || !filteredNodeIds.has(edge.target)) {
        return false;
      }

      return true;
    });

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .call(d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          container.attr('transform', event.transform.toString());
        }));

    // Add container for zoom/pan
    const container = svg.append('g');

    // Create the simulation
    const simulation = d3.forceSimulation<D3Node>()
      .force('link', d3.forceLink<D3Node, D3Link>().id((d: D3Node) => d.id).distance(100))
      .force('charge', d3.forceManyBody<D3Node>().strength(-300))
      .force('center', d3.forceCenter<D3Node>(width / 2, height / 2))
      .force('collision', d3.forceCollide<D3Node>().radius(50));

    // Define color scale for relationship types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(Object.values(RelationshipType))
      .range(d3.schemeCategory10);

    // Create edges
    const links = container.selectAll<SVGLineElement, D3Link>('.link')
      .data(filteredEdges as D3Link[])
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d: D3Link) => colorScale(d.type))
      .attr('stroke-width', (d: D3Link) => 1 + d.strength * 3)
      .attr('stroke-opacity', 0.7);

    // Create nodes
    const nodes = container.selectAll<SVGGElement, D3Node>('.node')
      .data(filteredNodes as D3Node[])
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag<SVGGElement, D3Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    nodes.append('circle')
      .attr('r', (d: D3Node) => 10 + Math.min(d.neighbors, 5) * 2)
      .attr('fill', (d: D3Node) => {
        // Highlight selected component
        if (selectedComponentId && d.id === selectedComponentId) {
          return '#ff5722';
        }
        
        // Color based on type or connections
        if (d.type === 'container') return '#4caf50';
        if (d.type === 'form') return '#2196f3';
        if (d.neighbors > 5) return '#9c27b0';
        return '#3f51b5';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels for nodes
    nodes.append('text')
      .attr('dx', 15)
      .attr('dy', 5)
      .attr('fill', '#333')
      .text((d: D3Node) => d.name);

    // Add title tooltips
    nodes.append('title')
      .text((d: D3Node) => `${d.name}\nType: ${d.type}\nConnections: ${d.neighbors}`);

    // Add click event for selecting a component
    nodes.on('click', (event: MouseEvent, d: D3Node) => {
      if (onSelectComponent) {
        onSelectComponent(d.id);
      }
    });

    // Update simulation with data
    simulation
      .nodes(filteredNodes as D3Node[])
      .force('link', d3.forceLink<D3Node, D3Link>(filteredEdges as D3Link[]).id((d: D3Node) => d.id).distance(100));

    // Apply tick function to update positions
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => (d.source as D3Node).x || 0)
        .attr('y1', (d: any) => (d.source as D3Node).y || 0)
        .attr('x2', (d: any) => (d.target as D3Node).x || 0)
        .attr('y2', (d: any) => (d.target as D3Node).y || 0);

      nodes.attr('transform', (d: D3Node) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Define drag behavior functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, D3Node, D3Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup function
    return () => {
      simulation.stop();
    };
  }, [visualizeComponentGraph, width, height, filter, selectedComponentId, onSelectComponent]);

  // Prepare relationship type options for filter
  const relationshipTypeOptions = Object.values(RelationshipType).map(type => {
    const label = type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return { value: type, label };
  });

  return (
    <div className="relationship-graph-container">
      <div className="relationship-graph-controls">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search components..."
            value={filter.searchQuery}
            onChange={(e) => setFilter({...filter, searchQuery: e.target.value})}
            className="relationship-search-input"
          />
        </div>
        
        <div className="filter-group">
          <div className="filter-label">Relationship Types:</div>
          <div className="relationship-type-filters">
            {relationshipTypeOptions.map(({ value, label }) => (
              <label key={value} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filter.relationshipTypes.includes(value)}
                  onChange={(e) => {
                    const types = e.target.checked
                      ? [...filter.relationshipTypes, value]
                      : filter.relationshipTypes.filter(t => t !== value);
                    setFilter({...filter, relationshipTypes: types});
                  }}
                />
                <span style={{ color: d3.schemeCategory10[relationshipTypeOptions.findIndex(t => t.value === value) % 10] }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="filter-group">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filter.showOrphans}
              onChange={(e) => setFilter({...filter, showOrphans: e.target.checked})}
            />
            <span>Show orphaned components</span>
          </label>
        </div>
      </div>
      
      <div className="relationship-graph-view">
        <svg ref={svgRef} className="relationship-graph"></svg>
      </div>
    </div>
  );
};