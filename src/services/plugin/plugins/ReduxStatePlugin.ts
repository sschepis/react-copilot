import { Plugin, PluginContext, PluginHooks, ModifiableComponent, CodeChangeResult } from '../../../utils/types';
import { PluginType, StateManagementPlugin } from '../types';

/**
 * Plugin that provides Redux state management integration
 */
export class ReduxStatePlugin implements StateManagementPlugin {
  id = 'redux-state-plugin';
  name = 'Redux State Management Plugin';
  description = 'Provides Redux state management integration and utilities';
  version = '1.0.0';
  type: PluginType.STATE_MANAGEMENT = PluginType.STATE_MANAGEMENT;
  stateManager = 'redux';
  enabled = true;
  capabilities = [
    'state-tracking',
    'state-modification',
    'selector-optimization',
    'time-travel',
    'state-visualization'
  ];

  private context: PluginContext | null = null;
  private reduxStore: any = null; // Will hold reference to Redux store if available

  hooks: PluginHooks & {
    beforeStateChange?: (path: string, value: any) => any;
    afterStateChange?: (path: string, oldValue: any, newValue: any) => void;
    onStateAccess?: (path: string, component: string) => void;
    getState?: () => any;
    setState?: (path: string, value: any) => void;
  } = {
    /**
     * Process component during registration to add Redux-specific metadata
     */
    beforeComponentRegister: (component: ModifiableComponent): ModifiableComponent => {
      const updatedComponent = { ...component };
      
      // Detect if the component uses Redux
      const usesRedux = this.detectReduxUsage(component);
      
      if (usesRedux) {
        // Set Redux metadata
        if (!updatedComponent.metadata) {
          updatedComponent.metadata = {};
        }
        
        updatedComponent.metadata.stateManager = 'redux';
        updatedComponent.metadata.reduxUsage = usesRedux;
        
        // Track component for state updates
        this.trackComponent(component.id);
      }
      
      return updatedComponent;
    },
    
    /**
     * Validate code before execution for Redux patterns
     */
    beforeCodeExecution: (code: string): string => {
      // Add Redux imports if missing but Redux is used
      if (this.usesReduxWithoutImports(code)) {
        code = "import { useSelector, useDispatch } from 'react-redux';\n" + code;
      }
      
      // Optimize selectors if possible
      code = this.optimizeSelectors(code);
      
      return code;
    },
    
    /**
     * Access state from Redux store
     */
    getState: (): any => {
      if (this.reduxStore && typeof this.reduxStore.getState === 'function') {
        return this.reduxStore.getState();
      }
      
      // Fallback to context state if available
      if (this.context && typeof this.context.getState === 'function') {
        return this.context.getState();
      }
      
      return {};
    },
    
    /**
     * Set state in Redux store (dispatch action)
     */
    setState: (path: string, value: any): void => {
      if (!this.reduxStore || typeof this.reduxStore.dispatch !== 'function') {
        console.warn('Redux store not available. Cannot set state.');
        return;
      }
      
      // Create a generic action for setting state at path
      const action = {
        type: 'SET_STATE',
        payload: {
          path,
          value
        }
      };
      
      // Dispatch the action
      this.reduxStore.dispatch(action);
    },
    
    /**
     * Intercept state changes to provide additional functionality
     */
    beforeStateChange: (path: string, value: any): any => {
      // Log state changes in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ReduxStatePlugin] State change at ${path}:`, value);
      }
      
      // Could perform validation here if needed
      return value; // Return potentially modified value
    },
    
    /**
     * Track state changes and notify components
     */
    afterStateChange: (path: string, oldValue: any, newValue: any): void => {
      // Update component metadata with latest state access
      this.updateComponentsStateUsage(path);
      
      // Emit event for state visualizer if available
      if (this.context) {
        this.context.addMessage({
          type: 'state-change',
          content: JSON.stringify({ path, oldValue, newValue }),
          level: 'info'
        });
      }
    },
    
    /**
     * Track state access patterns
     */
    onStateAccess: (path: string, componentId: string): void => {
      // Update component metadata with state access
      if (this.context && componentId) {
        const stateAccess = this.context.getMetadata(componentId, 'stateAccess') || {};
        if (!stateAccess[path]) {
          stateAccess[path] = 0;
        }
        stateAccess[path]++;
        this.context.setMetadata(componentId, 'stateAccess', stateAccess);
      }
    }
  };

  /**
   * Initialize the plugin with the provided context
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    
    // Try to detect Redux store from the application
    this.detectReduxStore();
    
    console.log('Redux State Management Plugin initialized');
  }

  /**
   * Clean up resources when plugin is destroyed
   */
  destroy(): void {
    this.context = null;
    this.reduxStore = null;
    console.log('Redux State Management Plugin destroyed');
  }

  /**
   * Configure the plugin with the provided options
   */
  configure(options: Record<string, any>): void {
    if (options.reduxStore) {
      this.reduxStore = options.reduxStore;
    }
    
    if (options.capabilities) {
      this.capabilities = options.capabilities;
    }
    
    if (options.enabled !== undefined) {
      this.enabled = options.enabled;
    }
  }

  /**
   * Check if the component uses Redux
   */
  isCompatible(component: ModifiableComponent): boolean {
    return !!this.detectReduxUsage(component);
  }

  /**
   * Get plugin capabilities
   */
  getCapabilities(): string[] {
    return this.capabilities;
  }

  /**
   * Analyze component's Redux usage
   */
  analyzeReduxPatterns(componentId: string): any {
    if (!this.context) return null;
    
    const component = this.context.getComponent(componentId);
    if (!component || !component.sourceCode) return null;
    
    const analysis = {
      selectors: this.extractSelectors(component),
      actions: this.extractActionDispatches(component),
      storeConnections: this.isConnectedComponent(component),
      recommendations: this.generateRecommendations(component)
    };
    
    return analysis;
  }

  /**
   * Get the current Redux state tree
   */
  getStateTree(): any {
    return this.hooks.getState ? this.hooks.getState() : {};
  }

  /**
   * Dispatch a Redux action
   */
  dispatchAction(action: any): void {
    if (this.reduxStore && typeof this.reduxStore.dispatch === 'function') {
      this.reduxStore.dispatch(action);
    } else {
      console.warn('Redux store not available. Cannot dispatch action.');
    }
  }

  /**
   * Track a component for state updates
   */
  private trackComponent(componentId: string): void {
    // Implementation would depend on the Redux setup
    // Could subscribe to store changes and update component
    if (this.context && componentId) {
      this.context.setMetadata(componentId, 'trackedByRedux', true);
    }
  }

  /**
   * Update component metadata with state usage
   */
  private updateComponentsStateUsage(path: string): void {
    if (!this.context) return;
    
    // Get all components
    const components = this.context.getAllComponents();
    
    // Check each component to see if it's using this state path
    Object.values(components).forEach(component => {
      if (component.metadata?.trackedByRedux) {
        const stateUsage = component.metadata.stateUsage || {};
        if (stateUsage[path]) {
          // This component uses this state path, update the access count
          stateUsage[path]++;
          this.context!.setMetadata(component.id, 'stateUsage', stateUsage);
        }
      }
    });
  }

  /**
   * Try to detect the Redux store from the application
   */
  private detectReduxStore(): void {
    // Implementation would depend on the application structure
    // For now, we'll just use a placeholder
    if (this.context && this.context.getState) {
      const state = this.context.getState();
      if (state && state.redux && state.redux.store) {
        this.reduxStore = state.redux.store;
      }
    }
  }

  /**
   * Detect Redux usage in a component
   */
  private detectReduxUsage(component: ModifiableComponent): any | null {
    if (!component.sourceCode) return null;
    
    const sourceCode = component.sourceCode;
    const reduxUsage: any = {};
    
    // Check for common Redux patterns
    const hasUseSelector = sourceCode.includes('useSelector');
    const hasUseDispatch = sourceCode.includes('useDispatch');
    const hasConnect = sourceCode.includes('connect(');
    const hasMapStateToProps = sourceCode.includes('mapStateToProps');
    const hasMapDispatchToProps = sourceCode.includes('mapDispatchToProps');
    const hasCreateStore = sourceCode.includes('createStore');
    const hasReduxHooks = hasUseSelector || hasUseDispatch;
    const hasReduxConnect = hasConnect || hasMapStateToProps || hasMapDispatchToProps;
    
    if (hasReduxHooks || hasReduxConnect || hasCreateStore) {
      reduxUsage.usesHooks = hasReduxHooks;
      reduxUsage.usesConnect = hasReduxConnect;
      reduxUsage.definesStore = hasCreateStore;
      
      // Extract more detailed information
      reduxUsage.selectors = this.extractSelectors(component);
      reduxUsage.actions = this.extractActionDispatches(component);
      
      return reduxUsage;
    }
    
    return null;
  }

  /**
   * Check if Redux is used without imports
   */
  private usesReduxWithoutImports(code: string): boolean {
    const hasReduxUsage = code.includes('useSelector') || code.includes('useDispatch') || 
                         code.includes('connect(') || code.includes('mapStateToProps');
                         
    const hasReduxImport = code.includes('react-redux') || 
                          code.includes('redux');
    
    return hasReduxUsage && !hasReduxImport;
  }

  /**
   * Optimize selectors in code
   */
  private optimizeSelectors(code: string): string {
    // Look for inefficient selectors
    if (code.includes('useSelector') && code.includes('state =>')) {
      // This is a simple optimization that could be expanded in a real implementation
      // For example, we could detect non-memoized selectors and suggest memoization
      if (code.includes('useSelector(state => state.') && !code.includes('createSelector')) {
        console.log('[ReduxStatePlugin] Consider using createSelector for memoization');
      }
    }
    
    return code;
  }

  /**
   * Extract selectors from component
   */
  private extractSelectors(component: ModifiableComponent): string[] {
    if (!component.sourceCode) return [];
    
    const sourceCode = component.sourceCode;
    const selectors: string[] = [];
    
    // Extract useSelector hooks
    const useSelectorRegex = /useSelector\(\s*(?:.*?=>\s*)?(.*?)\s*\)/g;
    let match;
    while ((match = useSelectorRegex.exec(sourceCode)) !== null) {
      if (match[1]) {
        selectors.push(match[1].trim());
      }
    }
    
    // Extract mapStateToProps selectors
    const mapStateRegex = /mapStateToProps\s*=\s*\(state(?:, props)?\)\s*=>\s*\{([\s\S]*?)\}/;
    const mapStateMatch = sourceCode.match(mapStateRegex);
    if (mapStateMatch && mapStateMatch[1]) {
      const mapStateBody = mapStateMatch[1];
      const propsRegex = /(\w+):\s*(state\.[^,}]*)/g;
      while ((match = propsRegex.exec(mapStateBody)) !== null) {
        if (match[2]) {
          selectors.push(match[2].trim());
        }
      }
    }
    
    return selectors;
  }

  /**
   * Extract action dispatches from component
   */
  private extractActionDispatches(component: ModifiableComponent): string[] {
    if (!component.sourceCode) return [];
    
    const sourceCode = component.sourceCode;
    const actions: string[] = [];
    
    // Extract dispatch calls
    const dispatchRegex = /dispatch\(\s*(\{[\s\S]*?\}|\w+\(.*?\))\s*\)/g;
    let match;
    while ((match = dispatchRegex.exec(sourceCode)) !== null) {
      if (match[1]) {
        actions.push(match[1].trim());
      }
    }
    
    return actions;
  }

  /**
   * Check if component is connected to Redux
   */
  private isConnectedComponent(component: ModifiableComponent): boolean {
    if (!component.sourceCode) return false;
    
    const sourceCode = component.sourceCode;
    
    return sourceCode.includes('connect(') && 
          (sourceCode.includes('mapStateToProps') || 
           sourceCode.includes('mapDispatchToProps'));
  }

  /**
   * Generate recommendations for Redux usage
   */
  private generateRecommendations(component: ModifiableComponent): string[] {
    if (!component.sourceCode) return [];
    
    const sourceCode = component.sourceCode;
    const recommendations: string[] = [];
    
    // Check for non-memoized selectors
    if (sourceCode.includes('useSelector') && !sourceCode.includes('createSelector')) {
      recommendations.push('Use createSelector for memoizing complex selectors');
    }
    
    // Check for useCallback with dispatch
    if (sourceCode.includes('useDispatch') && !sourceCode.includes('useCallback')) {
      recommendations.push('Use useCallback to memoize dispatch functions');
    }
    
    // Check for direct state mutation
    if (sourceCode.includes('state.') && sourceCode.includes(' = ')) {
      recommendations.push('Avoid direct state mutation. Use immutable update patterns.');
    }
    
    return recommendations;
  }
}

// Export a default instance
export const reduxStatePlugin = new ReduxStatePlugin();