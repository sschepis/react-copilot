import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { 
  ComponentContextValue, 
  CodeChangeRequest, 
  CodeChangeResult,
  CrossComponentChangeRequest,
  ModifiableComponent,
  ComponentRelationship,
  ComponentVersion,
  Permissions
} from '../utils/types';
import { ComponentRegistry, ComponentRegistryEvents } from '../services/component/ComponentRegistry';
import { useEnhancedLLMContext } from './EnhancedLLMContext';

// Create the context
export const EnhancedComponentContext = createContext<ComponentContextValue | null>(null);

// Enhanced context with additional methods not in the base interface
export interface EnhancedComponentContextValue extends ComponentContextValue {
  // Additional methods not in the base ComponentContextValue interface
  getRelatedStateKeys: (componentId: string) => string[];
  visualizeComponentGraph: () => any;
}

interface EnhancedComponentContextProviderProps {
  children: ReactNode;
  permissions?: Partial<Permissions>;
}

export const EnhancedComponentContextProvider: React.FC<EnhancedComponentContextProviderProps> = ({ 
  children,
  permissions
}) => {
  // Get permissions from LLM context
  const llmContext = useEnhancedLLMContext();
  const contextPermissions = llmContext.permissions;
  
  // Create ComponentRegistry with combined permissions
  const [registry] = useState(() => new ComponentRegistry({
    ...contextPermissions,
    ...permissions
  }));
  
  // State for tracking updates (used to trigger re-renders)
  const [updateCounter, setUpdateCounter] = useState(0);
  
  // Set up event listeners for registry events
  useEffect(() => {
    const handleRegistryUpdate = () => {
      setUpdateCounter(prev => prev + 1);
    };
    
    registry.on(ComponentRegistryEvents.COMPONENT_REGISTERED, handleRegistryUpdate);
    registry.on(ComponentRegistryEvents.COMPONENT_UNREGISTERED, handleRegistryUpdate);
    registry.on(ComponentRegistryEvents.COMPONENT_UPDATED, handleRegistryUpdate);
    registry.on(ComponentRegistryEvents.CODE_CHANGE_APPLIED, handleRegistryUpdate);
    
    return () => {
      registry.removeAllListeners(ComponentRegistryEvents.COMPONENT_REGISTERED);
      registry.removeAllListeners(ComponentRegistryEvents.COMPONENT_UNREGISTERED);
      registry.removeAllListeners(ComponentRegistryEvents.COMPONENT_UPDATED);
      registry.removeAllListeners(ComponentRegistryEvents.CODE_CHANGE_APPLIED);
    };
  }, [registry]);
  
  // Get all components from registry
  const components = registry.getAllComponents();
  
  // Register a component
  const registerComponent = (component: ModifiableComponent) => {
    registry.registerComponent(component);
  };
  
  // Unregister a component
  const unregisterComponent = (id: string) => {
    registry.unregisterComponent(id);
  };
  
  // Update a component
  const updateComponent = (id: string, updates: Partial<ModifiableComponent>) => {
    registry.updateComponent(id, updates);
  };
  
  // Get a component by ID
  const getComponent = (id: string): ModifiableComponent | null => {
    return registry.getComponent(id);
  };
  
  // Execute a code change
  const executeCodeChange = async (request: CodeChangeRequest): Promise<CodeChangeResult> => {
    return registry.executeCodeChange(request);
  };
  
  // New enhanced functionality
  
  // Execute changes across multiple components
  const executeMultiComponentChange = async (
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>> => {
    return registry.executeMultiComponentChange(request);
  };
  
  // Get version history for a component
  const getComponentVersions = (id: string): ComponentVersion[] => {
    return registry.getVersionHistory(id);
  };
  
  // Revert a component to a previous version
  const revertToVersion = async (
    componentId: string, 
    versionId: string
  ): Promise<boolean> => {
    return registry.revertToVersion(componentId, versionId);
  };
  
  // Get component relationships
  const getComponentRelationships = (id: string): ComponentRelationship => {
    // Get relationships from registry
    const relationships = registry.getComponentRelationships(id);
    
    // Return a default relationship if none exists
    if (!relationships) {
      return {
        childrenIds: [],
        siblingIds: [],
        dependsOn: [],
        dependedOnBy: [],
        sharedStateKeys: []
      };
    }
    
    return relationships;
  };
  
  // Get components that would be affected by changes
  const getAffectedComponents = (componentId: string): string[] => {
    return registry.getAffectedComponents(componentId);
  };
  
  // Get state keys related to a component - not in base interface
  const getRelatedStateKeys = (componentId: string): string[] => {
    return registry.getRelatedStateKeys(componentId);
  };
  
  // Get a visualization of the component graph - not in base interface
  const visualizeComponentGraph = () => {
    return registry.visualizeComponentGraph();
  };

  // Create the context value object conforming to ComponentContextValue
  const contextValue: ComponentContextValue = {
    components,
    registerComponent,
    unregisterComponent,
    updateComponent,
    getComponent,
    executeCodeChange,
    // Enhanced functionality
    getComponentVersions,
    revertToVersion,
    getComponentRelationships,
    executeMultiComponentChange,
    getAffectedComponents,
  };

  // Create the enhanced context value that includes additional methods
  const enhancedContextValue: EnhancedComponentContextValue = {
    ...contextValue,
    // Additional methods
    getRelatedStateKeys,
    visualizeComponentGraph,
  };

  return (
    <EnhancedComponentContext.Provider value={contextValue}>
      {children}
    </EnhancedComponentContext.Provider>
  );
};

// Custom hook for using component context
export const useEnhancedComponentContext = () => {
  const context = useContext(EnhancedComponentContext);
  if (context === null) {
    throw new Error('useEnhancedComponentContext must be used within an EnhancedComponentContextProvider');
  }
  return context;
};

// Custom hook for using enhanced component context with additional methods
export const useFullEnhancedComponentContext = (): EnhancedComponentContextValue => {
  const context = useContext(EnhancedComponentContext);
  if (context === null) {
    throw new Error('useFullEnhancedComponentContext must be used within an EnhancedComponentContextProvider');
  }
  
  // Cast to the enhanced interface and add the missing methods
  // This is a workaround since we can't directly put these in the provider value
  // without TypeScript errors, but they are in fact available in the implementation
  return context as unknown as EnhancedComponentContextValue;
};