/**
 * Relationship module
 * Provides tools for tracking, analyzing and visualizing component relationships
 */

// Core types
export * from './types';

// Detection strategies
export * from './detectionStrategies';

// Main classes
export { RelationshipManager } from './RelationshipManager';
export { RelationshipGraphVisualization } from './RelationshipGraphVisualization';
export { RelationshipAnalyzer } from './RelationshipAnalyzer';

// Legacy class wrapping up functionality as a single class for backward compatibility
import { RelationshipManager } from './RelationshipManager';
import { RelationshipGraphVisualization } from './RelationshipGraphVisualization';
import { RelationshipAnalyzer } from './RelationshipAnalyzer';
import { ComponentRelationship, ModifiableComponent } from '../../../utils/types';
import { 
  RelationshipType, 
  ComponentGraphRelationship,
  RelationshipDetectionStrategy,
  VisualizationData
} from './types';

/**
 * Relationship graph for backward compatibility
 * @deprecated Use RelationshipManager and related specialized classes instead
 */
export class RelationshipGraph {
  private manager: RelationshipManager;
  private visualizer: RelationshipGraphVisualization;
  private analyzer: RelationshipAnalyzer;

  constructor() {
    this.manager = new RelationshipManager();
    this.visualizer = new RelationshipGraphVisualization(this.manager);
    this.analyzer = new RelationshipAnalyzer(this.manager);
  }

  // Manager methods
  addDetectionStrategy(strategy: RelationshipDetectionStrategy): void {
    this.manager.addDetectionStrategy(strategy);
  }

  removeDetectionStrategy(strategyName: string): boolean {
    return this.manager.removeDetectionStrategy(strategyName);
  }

  addComponent(component: ModifiableComponent): void {
    this.manager.addComponent(component);
  }

  removeComponent(componentId: string): void {
    this.manager.removeComponent(componentId);
  }

  addRelationship(relationship: ComponentGraphRelationship): void {
    this.manager.addRelationship(relationship);
  }

  removeRelationship(sourceId: string, targetId: string, type?: RelationshipType): void {
    this.manager.removeRelationship(sourceId, targetId, type);
  }

  getRelationships(componentId: string): ComponentGraphRelationship[] {
    return this.manager.getRelationships(componentId);
  }

  getComponentRelationship(componentId: string): ComponentRelationship {
    return this.manager.getComponentRelationship(componentId);
  }

  detectRelationships(component: ModifiableComponent, forceRedetect: boolean = false): void {
    this.manager.detectRelationships(component, forceRedetect);
  }

  getConnectedComponents(componentId: string): string[] {
    return this.manager.getConnectedComponents(componentId);
  }

  // Visualization methods
  getVisualizationData(): VisualizationData {
    return this.visualizer.getGraphData();
  }

  visualizeGraph(): VisualizationData {
    return this.visualizer.getGraphData();
  }

  // Analyzer methods
  getAffectedComponents(componentId: string, recursive: boolean = true): string[] {
    return this.manager.getAffectedComponents(componentId, recursive);
  }

  getRelatedStateKeys(componentId: string): string[] {
    return this.manager.getRelatedStateKeys(componentId);
  }

  reset(): void {
    this.manager.reset();
  }

  // Backward compatibility methods
  addDependency(sourceId: string, targetId: string): void {
    this.manager.addDependency(sourceId, targetId);
  }

  setParentChild(parentId: string, childId: string): void {
    this.manager.setParentChild(parentId, childId);
  }
}