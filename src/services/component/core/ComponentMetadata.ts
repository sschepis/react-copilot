import { ModifiableComponent, ComponentVersion, ComponentRelationship } from '../../../utils/types';

/**
 * Extended component metadata interface for more detailed tracking
 */
export interface ComponentMetadataModel {
  // Basic identification
  id: string;                         // Unique component identifier
  name: string;                       // Display name
  componentType: string;              // Function, class, HOC, etc.
  
  // Source tracking
  sourceFilePath?: string[];          // Path to component source file
  originalAuthor?: string;            // Original creator
  lastModifiedBy?: string;            // Last person to modify
  
  // Timestamps
  createdAt: number;                  // Creation timestamp
  updatedAt: number;                  // Last update timestamp
  
  // Usage statistics
  renderCount: number;                // Number of renders
  lastRenderTime?: number;            // When component last rendered
  averageRenderDuration?: number;     // Average render time (ms)
  totalRenderTime?: number;           // Total cumulative render time
  
  // Dependencies
  dependencies: Set<string>;          // Components this component depends on
  dependents: Set<string>;            // Components that depend on this one
  externalDependencies: string[];     // External package dependencies
  
  // Props analysis
  props: ComponentPropMetadata[];     // Props information
  propFlow: PropFlowInfo[];           // How props flow through components
  
  // State analysis
  stateItems: ComponentStateMetadata[]; // State information
  stateUsage: StateUsageInfo[];       // How state is used
  
  // Context usage
  contextUsage: ContextUsageInfo[];   // Context dependencies & usage
  
  // Performance insights
  performanceIssues: PerformanceIssue[]; // Detected performance issues
  optimizationSuggestions: OptimizationSuggestion[]; // Suggested optimizations
  
  // Tags and categorization
  tags: Set<string>;                  // User-defined tags
  category?: string;                  // Component category
  
  // Lifecycle hooks usage
  lifecycleHooks: Map<string, boolean>; // Which hooks this component uses
  
  // Custom metadata
  customMetadata: Record<string, any>; // User-defined metadata
}

/**
 * Metadata about a component's prop
 */
export interface ComponentPropMetadata {
  name: string;                      // Prop name
  type: string;                      // Prop type
  isRequired: boolean;               // Whether prop is required
  defaultValue?: any;                // Default value if any
  description?: string;              // Prop description
  usage: {                           // How prop is used
    read: boolean;                   // Whether prop is read
    modifies: boolean;               // Whether prop is modified
    passes: boolean;                 // Whether prop is passed to children
    transformations?: string[];      // How prop is transformed
  };
}

/**
 * Information about how props flow through components
 */
export interface PropFlowInfo {
  propName: string;                 // Name of the prop
  sourceComponentId?: string;       // Where prop originates (null if root)
  destinationComponentId: string;   // Where prop is passed to
  transformation?: string;          // How prop is transformed during passing
  path: string[];                   // Component path the prop flows through
}

/**
 * Metadata about a component's state
 */
export interface ComponentStateMetadata {
  name: string;                      // State variable name
  type: string;                      // State type
  source: 'useState' | 'useReducer' | 'class' | 'mobx' | 'redux' | 'context' | 'other'; // State source
  defaultValue?: any;                // Initial state
  updaters: string[];                // Names of functions that update this state
  dependencies: string[];            // Other state or props this state depends on
  usage: number;                     // How often state is accessed
}

/**
 * Information about state usage patterns
 */
export interface StateUsageInfo {
  stateItemName: string;            // Name of state item
  componentId: string;              // Component using the state
  accessCount: number;              // Number of times accessed
  updateCount: number;              // Number of times updated
  accessPattern: 'read-heavy' | 'write-heavy' | 'balanced'; // Usage pattern
}

/**
 * Information about context usage
 */
export interface ContextUsageInfo {
  contextName: string;              // Name of the context
  consumedProperties: string[];     // Properties consumed from context
  updatesContext: boolean;          // Whether component updates context
  frequency: number;                // Access frequency
}

/**
 * Detected performance issue
 */
export interface PerformanceIssue {
  type: 'rendering' | 'state' | 'props' | 'memo' | 'effect' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: string;
  detectedAt: number;
  occurrences: number;
}

/**
 * Suggested optimization
 */
export interface OptimizationSuggestion {
  type: string;                    // Type of optimization
  description: string;             // Description of the optimization
  priority: 'low' | 'medium' | 'high'; // Priority level
  implementation?: string;         // Suggested implementation
  expectedImprovement?: string;    // Expected improvement
}

/**
 * Factory function to create default metadata
 */
export function createDefaultMetadata(component: ModifiableComponent): ComponentMetadataModel {
  const now = Date.now();
  return {
    id: component.id,
    name: component.name || component.id,
    componentType: component.componentType || 'unknown',
    createdAt: now,
    updatedAt: now,
    renderCount: 0,
    dependencies: new Set(),
    dependents: new Set(),
    props: [],
    stateItems: [],
    contextUsage: [],
    performanceIssues: [],
    optimizationSuggestions: [],
    tags: new Set(),
    lifecycleHooks: new Map(),
    externalDependencies: [],
    propFlow: [],
    stateUsage: [],
    customMetadata: {}
  };
}

/**
 * Extract metadata from component source code
 */
export function extractMetadataFromSource(component: ModifiableComponent): Partial<ComponentMetadataModel> {
  const metadata: Partial<ComponentMetadataModel> = {};
  
  if (!component.sourceCode) {
    return metadata;
  }
  
  // Basic extraction of component type
  if (component.sourceCode.includes('function') && 
      component.sourceCode.includes('return') && 
      component.sourceCode.includes('React')) {
    metadata.componentType = 'function';
  } else if (component.sourceCode.includes('class') && 
             component.sourceCode.includes('extends') && 
             component.sourceCode.includes('render')) {
    metadata.componentType = 'class';
  } else if (component.sourceCode.includes('const') && 
             component.sourceCode.includes('=>') && 
             component.sourceCode.includes('return')) {
    metadata.componentType = 'arrow-function';
  }
  
  // Simple regex-based prop extraction
  const propMatches = component.sourceCode.match(/props\.([\w]+)/g) || [];
  const propNames = propMatches.map(match => match.replace('props.', ''));
  
  // Create distinct prop set
  const distinctProps = [...new Set(propNames)];
  metadata.props = distinctProps.map(propName => {
    return {
      name: propName,
      type: 'unknown', // We'd need type analysis for this
      isRequired: false,
      usage: {
        read: true,
        modifies: false,
        passes: false
      }
    };
  });
  
  // Simple hook detection
  const lifecycleHooks = new Map<string, boolean>();
  
  if (component.sourceCode.includes('useState')) {
    lifecycleHooks.set('useState', true);
  }
  
  if (component.sourceCode.includes('useEffect')) {
    lifecycleHooks.set('useEffect', true);
  }
  
  if (component.sourceCode.includes('useCallback')) {
    lifecycleHooks.set('useCallback', true);
  }
  
  if (component.sourceCode.includes('useMemo')) {
    lifecycleHooks.set('useMemo', true);
  }
  
  if (component.sourceCode.includes('useReducer')) {
    lifecycleHooks.set('useReducer', true);
  }
  
  if (component.sourceCode.includes('useContext')) {
    lifecycleHooks.set('useContext', true);
  }
  
  if (lifecycleHooks.size > 0) {
    metadata.lifecycleHooks = lifecycleHooks;
  }
  
  // Extract simple external dependencies
  const importMatches = component.sourceCode.match(/import .* from ['"](.*)['"]/g) || [];
  metadata.externalDependencies = importMatches
    .map(match => {
      const parts = match.match(/from ['"](.*)['"]/) || [];
      return parts.length > 1 ? parts[1] : '';
    })
    .filter(dep => dep && !dep.startsWith('.'))
    .filter(Boolean);
  
  return metadata;
}

/**
 * Update component metadata based on component changes
 */
export function updateMetadata(
  existingMetadata: ComponentMetadataModel, 
  component: ModifiableComponent,
  extractFromSource: boolean = true
): ComponentMetadataModel {
  const updatedMetadata = { ...existingMetadata };
  
  // Update basic info
  updatedMetadata.name = component.name || component.id;
  updatedMetadata.componentType = component.componentType || existingMetadata.componentType || 'unknown';
  updatedMetadata.updatedAt = Date.now();
  
  // Update path information if available
  if (component.path && component.path.length > 0) {
    updatedMetadata.sourceFilePath = [...component.path];
  }
  
  // Extract additional metadata from source code if available and requested
  if (extractFromSource && component.sourceCode) {
    const sourceMetadata = extractMetadataFromSource(component);
    
    // Merge extracted metadata
    if (sourceMetadata.componentType) {
      updatedMetadata.componentType = sourceMetadata.componentType;
    }
    
    if (sourceMetadata.props && sourceMetadata.props.length > 0) {
      // Merge with existing props, keeping detailed info
      const existingPropMap = new Map(
        existingMetadata.props.map(prop => [prop.name, prop])
      );
      
      updatedMetadata.props = sourceMetadata.props.map(newProp => {
        const existingProp = existingPropMap.get(newProp.name);
        if (existingProp) {
          return {
            ...existingProp,
            ...newProp,
            usage: {
              ...existingProp.usage,
              ...newProp.usage
            }
          };
        }
        return newProp;
      });
    }
    
    if (sourceMetadata.lifecycleHooks && sourceMetadata.lifecycleHooks.size > 0) {
      // Update lifecycle hooks
      updatedMetadata.lifecycleHooks = new Map([
        ...existingMetadata.lifecycleHooks,
        ...sourceMetadata.lifecycleHooks
      ]);
    }
    
    if (sourceMetadata.externalDependencies && sourceMetadata.externalDependencies.length > 0) {
      // Merge external dependencies
      updatedMetadata.externalDependencies = [
        ...new Set([
          ...existingMetadata.externalDependencies,
          ...sourceMetadata.externalDependencies
        ])
      ];
    }
  }
  
  return updatedMetadata;
}

/**
 * Track a component render
 */
export function trackRender(
  metadata: ComponentMetadataModel,
  renderTime: number
): ComponentMetadataModel {
  const updated = { ...metadata };
  
  // Update render count
  updated.renderCount = metadata.renderCount + 1;
  
  // Update last render time
  updated.lastRenderTime = Date.now();
  
  // Update average render duration
  if (metadata.averageRenderDuration === undefined) {
    updated.averageRenderDuration = renderTime;
    updated.totalRenderTime = renderTime;
  } else {
    const totalTime = (metadata.totalRenderTime || 0) + renderTime;
    updated.totalRenderTime = totalTime;
    updated.averageRenderDuration = totalTime / updated.renderCount;
  }
  
  return updated;
}

/**
 * Add a relationship between components
 */
export function addRelationship(
  metadata: ComponentMetadataModel,
  relatedComponentId: string,
  relationshipType: 'dependency' | 'dependent'
): ComponentMetadataModel {
  const updated = { ...metadata };
  
  if (relationshipType === 'dependency') {
    updated.dependencies = new Set([...metadata.dependencies, relatedComponentId]);
  } else {
    updated.dependents = new Set([...metadata.dependents, relatedComponentId]);
  }
  
  return updated;
}

/**
 * Add a performance issue to the component metadata
 */
export function addPerformanceIssue(
  metadata: ComponentMetadataModel,
  issue: PerformanceIssue
): ComponentMetadataModel {
  const updated = { ...metadata };
  
  // Check if a similar issue already exists
  const existingIssueIndex = metadata.performanceIssues.findIndex(
    i => i.type === issue.type && i.affectedArea === issue.affectedArea
  );
  
  if (existingIssueIndex >= 0) {
    // Update existing issue
    const existingIssue = metadata.performanceIssues[existingIssueIndex];
    updated.performanceIssues = [
      ...metadata.performanceIssues.slice(0, existingIssueIndex),
      {
        ...existingIssue,
        occurrences: existingIssue.occurrences + 1,
        detectedAt: issue.detectedAt, // Update detection time
        severity: issue.severity // Update severity if changed
      },
      ...metadata.performanceIssues.slice(existingIssueIndex + 1)
    ];
  } else {
    // Add new issue
    updated.performanceIssues = [...metadata.performanceIssues, issue];
  }
  
  return updated;
}

/**
 * Add an optimization suggestion to the component metadata
 */
export function addOptimizationSuggestion(
  metadata: ComponentMetadataModel,
  suggestion: OptimizationSuggestion
): ComponentMetadataModel {
  const updated = { ...metadata };
  
  // Check if a similar suggestion already exists
  const existingSuggestionIndex = metadata.optimizationSuggestions.findIndex(
    s => s.type === suggestion.type && s.description === suggestion.description
  );
  
  if (existingSuggestionIndex >= 0) {
    // Update existing suggestion
    const existingSuggestion = metadata.optimizationSuggestions[existingSuggestionIndex];
    updated.optimizationSuggestions = [
      ...metadata.optimizationSuggestions.slice(0, existingSuggestionIndex),
      {
        ...existingSuggestion,
        priority: suggestion.priority, // Update priority if changed
        implementation: suggestion.implementation || existingSuggestion.implementation
      },
      ...metadata.optimizationSuggestions.slice(existingSuggestionIndex + 1)
    ];
  } else {
    // Add new suggestion
    updated.optimizationSuggestions = [...metadata.optimizationSuggestions, suggestion];
  }
  
  return updated;
}

/**
 * Convert component relationship to metadata
 */
export function relationshipToMetadata(
  relationship: ComponentRelationship,
  id: string
): Partial<ComponentMetadataModel> {
  return {
    id,
    dependencies: new Set(relationship.dependsOn || []),
    dependents: new Set(relationship.dependedOnBy || [])
  };
}

/**
 * Update metadata with prop information
 */
export function updatePropMetadata(
  metadata: ComponentMetadataModel,
  props: Record<string, any>
): ComponentMetadataModel {
  if (!props) return metadata;
  
  const updated = { ...metadata };
  const propEntries = Object.entries(props);
  
  // Create a map of existing props
  const existingPropMap = new Map(
    metadata.props.map(prop => [prop.name, prop])
  );
  
  // Update props with new information
  updated.props = propEntries.map(([name, value]) => {
    const existingProp = existingPropMap.get(name);
    const type = typeof value;
    
    if (existingProp) {
      return {
        ...existingProp,
        type,
        usage: {
          ...existingProp.usage,
          read: true // We know it's being read if it's in props
        }
      };
    }
    
    return {
      name,
      type,
      isRequired: false, // We don't know without analyzing propTypes
      usage: {
        read: true,
        modifies: false,
        passes: false
      }
    };
  });
  
  return updated;
}