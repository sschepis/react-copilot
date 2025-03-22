import { ModifiableComponent } from '../../../utils/types';
import { logger, LogCategory } from '../../../utils/LoggingSystem';

/**
 * Component prop metadata
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
  };
}

/**
 * Component state metadata
 */
export interface ComponentStateMetadata {
  name: string;                      // State variable name
  type: string;                      // State type
  source: 'useState' | 'useReducer' | 'class' | 'mobx' | 'redux' | 'context' | 'other'; // State source
  defaultValue?: any;                // Initial state
  updaters: string[];                // Names of functions that update this state
  dependencies: string[];            // Other state or props this state depends on
}

/**
 * Extended component metadata for advanced tracking
 */
export interface ComponentMetadata {
  id: string;                        // Unique component ID
  name: string;                      // Component name 
  type: string;                      // Component type (function, class, etc.)
  sourceFilePath?: string;           // Path to source file
  dependencies: Set<string>;         // IDs of components this component depends on
  dependents: Set<string>;           // IDs of components that depend on this component
  props: ComponentPropMetadata[];    // Prop metadata
  state: ComponentStateMetadata[];   // State metadata
  createdAt: number;                 // Creation timestamp
  updatedAt: number;                 // Last update timestamp
  renderCount: number;               // Number of renders
  lastRenderTime?: number;           // Last render timestamp
  renderDuration?: number;           // Average render duration in ms
  lifecycleHooks: {                  // Lifecycle hook usage
    [key: string]: boolean;          // e.g., { componentDidMount: true }
  };
  tags: Set<string>;                 // User-defined tags for organization
  context: Set<string>;              // Context dependencies
  customMetadata: Record<string, any>; // User-defined metadata
}

/**
 * Manages component metadata for tracking and analysis
 */
export class ComponentMetadataManager {
  private componentMetadata: Map<string, ComponentMetadata> = new Map();
  private log = logger.getChildLogger(LogCategory.COMPONENT);
  
  /**
   * Create default metadata for a component
   * @param component The component to create metadata for
   */
  createDefaultMetadata(component: ModifiableComponent): ComponentMetadata {
    const now = Date.now();
    return {
      id: component.id,
      name: component.name || component.id,
      type: component.componentType || 'unknown',
      dependencies: new Set(),
      dependents: new Set(),
      props: [],
      state: [],
      createdAt: now,
      updatedAt: now,
      renderCount: 0,
      lifecycleHooks: {},
      tags: new Set(),
      context: new Set(),
      customMetadata: {}
    };
  }
  
  /**
   * Get component metadata
   * @param componentId The ID of the component
   */
  getComponentMetadata(componentId: string): ComponentMetadata | null {
    return this.componentMetadata.get(componentId) || null;
  }
  
  /**
   * Get all component metadata
   */
  getAllComponentMetadata(): Record<string, ComponentMetadata> {
    const result: Record<string, ComponentMetadata> = {};
    for (const [id, metadata] of this.componentMetadata.entries()) {
      result[id] = metadata;
    }
    return result;
  }
  
  /**
   * Update component metadata from component source
   * @param component The component to update metadata for
   */
  updateComponentMetadata(component: ModifiableComponent): void {
    // Create default metadata if it doesn't exist
    if (!this.componentMetadata.has(component.id)) {
      this.componentMetadata.set(component.id, this.createDefaultMetadata(component));
    }
    
    const metadata = this.componentMetadata.get(component.id);
    if (!metadata) return;
    
    // Update basic info
    metadata.name = component.name || component.id;
    metadata.type = component.componentType || 'unknown';
    metadata.updatedAt = Date.now();
    
    // Extract props information if available
    if (component.props && typeof component.props === 'object') {
      metadata.props = Object.entries(component.props).map(([name, value]) => ({
        name,
        type: typeof value,
        isRequired: false, // Would need AST parsing for accurate info
        defaultValue: value,
        usage: {
          read: true,
          modifies: false,
          passes: false
        }
      }));
    }
    
    // Update component source file path if available
    if (component.path) {
      metadata.sourceFilePath = component.path.join('/');
    }
    
    // Parse source code to extract more metadata
    if (component.sourceCode) {
      this.extractMetadataFromSource(component, metadata);
    }
    
    // Update the stored metadata
    this.componentMetadata.set(component.id, metadata);
  }
  
  /**
   * Extract metadata from component source code
   * @param component The component
   * @param metadata The metadata to update
   */
  private extractMetadataFromSource(
    component: ModifiableComponent, 
    metadata: ComponentMetadata
  ): void {
    const sourceCode = component.sourceCode;
    if (!sourceCode) return;
    
    // Simple regex-based extraction - a real implementation would use an AST parser
    
    // Check for lifecycle hooks usage
    const lifecycleHooks = {
      componentDidMount: /componentDidMount\s*\(/i,
      componentDidUpdate: /componentDidUpdate\s*\(/i,
      componentWillUnmount: /componentWillUnmount\s*\(/i,
      shouldComponentUpdate: /shouldComponentUpdate\s*\(/i,
      useEffect: /useEffect\s*\(/i,
      useMemo: /useMemo\s*\(/i,
      useCallback: /useCallback\s*\(/i
    };
    
    for (const [hookName, regex] of Object.entries(lifecycleHooks)) {
      if (regex.test(sourceCode)) {
        metadata.lifecycleHooks[hookName] = true;
      }
    }
    
    // Extract context usage
    const contextRegex = /useContext\s*\(\s*(\w+)Context\s*\)/g;
    let match;
    while ((match = contextRegex.exec(sourceCode)) !== null) {
      if (match[1]) {
        metadata.context.add(match[1]);
      }
    }
    
    // Extract state usage
    const useStateRegex = /const\s+\[\s*(\w+)\s*,\s*set(\w+)\s*\]\s*=\s*useState\s*\(/g;
    while ((match = useStateRegex.exec(sourceCode)) !== null) {
      if (match[1] && match[2]) {
        metadata.state.push({
          name: match[1],
          type: 'unknown', // Would need type inference 
          source: 'useState',
          updaters: [`set${match[2]}`],
          dependencies: []
        });
      }
    }
  }
  
  /**
   * Track a component render
   * @param componentId The ID of the component
   * @param renderTime Render duration in milliseconds
   */
  trackComponentRender(componentId: string, renderTime?: number): void {
    const metadata = this.componentMetadata.get(componentId);
    if (!metadata) return;
    
    // Update render count and times
    metadata.renderCount++;
    metadata.lastRenderTime = Date.now();
    
    if (renderTime) {
      // Calculate running average of render duration
      if (metadata.renderDuration) {
        metadata.renderDuration = (metadata.renderDuration * (metadata.renderCount - 1) + renderTime) / metadata.renderCount;
      } else {
        metadata.renderDuration = renderTime;
      }
    }
  }
  
  /**
   * Add a tag to a component
   * @param componentId The ID of the component
   * @param tag The tag to add
   */
  addComponentTag(componentId: string, tag: string): boolean {
    const metadata = this.componentMetadata.get(componentId);
    if (!metadata) return false;
    
    metadata.tags.add(tag);
    return true;
  }
  
  /**
   * Remove a tag from a component
   * @param componentId The ID of the component
   * @param tag The tag to remove
   */
  removeComponentTag(componentId: string, tag: string): boolean {
    const metadata = this.componentMetadata.get(componentId);
    if (!metadata) return false;
    
    return metadata.tags.delete(tag);
  }
  
  /**
   * Find components by tags
   * @param tags Tags to search for
   * @param matchAll Whether to require all tags (AND) or any tag (OR)
   * @param componentsMap Map of all components to search through
   */
  findComponentsByTags(
    tags: string[], 
    matchAll = true,
    componentsMap: Map<string, ModifiableComponent>
  ): ModifiableComponent[] {
    const result: ModifiableComponent[] = [];
    
    for (const [componentId, metadata] of this.componentMetadata.entries()) {
      const component = componentsMap.get(componentId);
      if (!component) continue;
      
      if (matchAll) {
        // All tags must match
        if (tags.every(tag => metadata.tags.has(tag))) {
          result.push(component);
        }
      } else {
        // Any tag can match
        if (tags.some(tag => metadata.tags.has(tag))) {
          result.push(component);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Set custom metadata for a component
   * @param componentId The ID of the component
   * @param key The metadata key
   * @param value The metadata value
   */
  setComponentMetadataValue(componentId: string, key: string, value: any): boolean {
    const metadata = this.componentMetadata.get(componentId);
    if (!metadata) return false;
    
    metadata.customMetadata[key] = value;
    return true;
  }
  
  /**
   * Get custom metadata for a component
   * @param componentId The ID of the component
   * @param key The metadata key
   */
  getComponentMetadataValue(componentId: string, key: string): any {
    const metadata = this.componentMetadata.get(componentId);
    if (!metadata) return undefined;
    
    return metadata.customMetadata[key];
  }
  
  /**
   * Remove component metadata
   * @param componentId The ID of the component
   */
  removeComponentMetadata(componentId: string): boolean {
    return this.componentMetadata.delete(componentId);
  }
}

export default ComponentMetadataManager;