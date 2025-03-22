/**
 * Component Services Module
 * Provides services for component registry, relationships, and version control
 */

export * from './ComponentRegistryAdapter';
export * from './VersionControl';
export * from './relationship';

// Re-export core registry
export * from './core/ComponentRegistry';

// Named re-exports from ComponentMetadata to avoid naming conflicts
export {
  createDefaultMetadata,
  extractMetadataFromSource,
  updateMetadata,
  trackRender,
  addRelationship,
  addPerformanceIssue,
  addOptimizationSuggestion,
  relationshipToMetadata,
  updatePropMetadata,
  ComponentMetadataModel,
  ContextUsageInfo,
  OptimizationSuggestion,
  PerformanceIssue,
  PropFlowInfo,
  StateUsageInfo
} from './core/ComponentMetadata';