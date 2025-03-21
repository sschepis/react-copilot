import React, { createContext, useState, useContext, ReactNode } from 'react';
import {
  ModifiableComponent,
  ComponentContextValue,
  CodeChangeRequest,
  CodeChangeResult,
  ComponentVersion,
  ComponentRelationship,
  CrossComponentChangeRequest
} from '../utils/types';
import { executeCodeChange } from '../services/codeExecution';
import { validateCode } from '../utils/validation';
import { useLLMContext } from './LLMContext';

// Create the context
export const ComponentContext = createContext<ComponentContextValue | null>(null);

interface ComponentContextProviderProps {
  children: ReactNode;
}

export const ComponentContextProvider: React.FC<ComponentContextProviderProps> = ({ 
  children 
}) => {
  // State for registered components
  const [components, setComponents] = useState<Record<string, ModifiableComponent>>({});
  // State for tracking component versions and relationships
  const [componentVersions, setComponentVersions] = useState<Record<string, ComponentVersion[]>>({});
  const [componentRelationships, setComponentRelationships] = useState<Record<string, ComponentRelationship>>({});
  
  const { permissions } = useLLMContext();

  // Register a component
  const registerComponent = (component: ModifiableComponent) => {
    setComponents(prev => ({
      ...prev,
      [component.id]: component
    }));
  };

  // Unregister a component
  const unregisterComponent = (id: string) => {
    setComponents(prev => {
      const newComponents = { ...prev };
      delete newComponents[id];
      return newComponents;
    });
  };

  // Update a component
  const updateComponent = (id: string, updates: Partial<ModifiableComponent>) => {
    setComponents(prev => {
      const component = prev[id];
      if (!component) return prev;

      return {
        ...prev,
        [id]: {
          ...component,
          ...updates
        }
      };
    });
  };

  // Get a component by ID
  const getComponent = (id: string): ModifiableComponent | null => {
    return components[id] || null;
  };

  // Execute a code change request
  const handleCodeChange = async (
    request: CodeChangeRequest
  ): Promise<CodeChangeResult> => {
    // Get the target component
    const component = getComponent(request.componentId);
    if (!component) {
      return {
        success: false,
        error: `Component with ID ${request.componentId} not found`,
        componentId: request.componentId
      };
    }

    // Validate the code change against permissions
    const validationResult = validateCode(
      request.sourceCode, 
      component.sourceCode || '', 
      permissions
    );

    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error || 'Code validation failed',
        componentId: request.componentId
      };
    }

    try {
      // Execute the code change
      const result = await executeCodeChange(request);

      if (result.success && result.newSourceCode) {
        // Update the component's source code
        updateComponent(request.componentId, {
          sourceCode: result.newSourceCode
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        componentId: request.componentId
      };
    }
  };

  // Get versions of a component
  const getComponentVersions = (id: string): ComponentVersion[] => {
    return componentVersions[id] || [];
  };
  
  // Revert to a specific version
  const revertToVersion = async (componentId: string, versionId: string): Promise<boolean> => {
    const versions = getComponentVersions(componentId);
    const version = versions.find(v => v.id === versionId);
    
    if (!version) {
      return false;
    }
    
    try {
      // Update the component with the previous version
      updateComponent(componentId, {
        sourceCode: version.sourceCode
      });
      return true;
    } catch (error) {
      console.error('Error reverting to version', error);
      return false;
    }
  };
  
  // Get component relationships
  const getComponentRelationships = (id: string): ComponentRelationship => {
    return componentRelationships[id] || {
      childrenIds: [],
      siblingIds: [],
      dependsOn: [],
      dependedOnBy: [],
      sharedStateKeys: []
    };
  };
  
  // Execute changes across multiple components
  const executeMultiComponentChange = async (
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>> => {
    const results: Record<string, CodeChangeResult> = {};
    
    // Process each component change
    for (const componentId of Object.keys(request.changes)) {
      const sourceCode = request.changes[componentId];
      
      // Create a single component change request
      const singleRequest: CodeChangeRequest = {
        componentId,
        sourceCode,
        description: request.description
      };
      
      // Execute the change
      results[componentId] = await handleCodeChange(singleRequest);
    }
    
    return results;
  };
  
  // Get components affected by changes to a specific component
  const getAffectedComponents = (componentId: string): string[] => {
    const relationship = getComponentRelationships(componentId);
    // Return components that depend on this component
    return relationship.dependedOnBy;
  };

  const contextValue: ComponentContextValue = {
    components,
    registerComponent,
    unregisterComponent,
    updateComponent,
    getComponent,
    executeCodeChange: handleCodeChange,
    // Add the new functions
    getComponentVersions,
    revertToVersion,
    getComponentRelationships,
    executeMultiComponentChange,
    getAffectedComponents
  };

  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
};

// Custom hook for using component context
export const useComponentContext = () => {
  const context = useContext(ComponentContext);
  if (context === null) {
    throw new Error('useComponentContext must be used within a ComponentContextProvider');
  }
  return context;
};
