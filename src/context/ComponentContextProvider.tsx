import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  ComponentContextValue,
  ModifiableComponent,
  Permissions,
  CodeChangeRequest,
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentRelationship,
  ComponentVersion
} from '../utils/types';
import {
  IComponentContextService,
  ComponentContextEvents,
  ComponentContextOptions,
  ILLMContextService
} from './core/types';
import { createComponentContextService } from './core';
import { useLLMContext } from './LLMContextProvider';

// Create the context
export const ComponentContext = createContext<ComponentContextValue | null>(null);

// Provider props interface
export interface ComponentContextProviderProps {
  children: ReactNode;
  permissions?: Partial<Permissions>;
  contextService?: IComponentContextService; // For testing/dependency injection
}

/**
 * Component Context Provider Component
 * 
 * Provides component context to the application, managing components,
 * version history, and code modifications
 */
export const ComponentContextProvider: React.FC<ComponentContextProviderProps> = ({
  children,
  permissions,
  contextService
}) => {
  // Get LLM context to link permissions
  const llmContext = useLLMContext();
  
  // Create or use the provided service
  const [service] = useState<IComponentContextService>(() => {
    if (contextService) {
      return contextService;
    }
    
    // Create a new service with the provided options
    const options: ComponentContextOptions = {
      permissions
    };
    
    // If needed, create an LLM context service adapter
    const llmContextService: ILLMContextService = {
      getPermissions: () => llmContext.permissions,
      updatePermissions: (perms) => {
        // This is a read-only adapter in this context
        console.warn('Cannot directly update LLM permissions from ComponentContextProvider');
      },
      // Add other required methods with minimal implementations
      getConfig: () => llmContext.config,
      updateConfig: () => {},
      getAutonomousConfig: () => llmContext.autonomousConfig,
      updateAutonomousConfig: () => {},
      getChatSessions: () => llmContext.chatSessions,
      getCurrentSession: () => llmContext.currentSession,
      createSession: () => llmContext.createSession(),
      selectSession: (id) => {
        // Make sure we return a boolean
        const result = llmContext.selectSession(id);
        return typeof result === 'boolean' ? result : false;
      },
      sendMessage: (content) => llmContext.sendMessage(content),
      streamMessage: llmContext.streamMessage,
      getProviderInfo: () => llmContext.providerInfo as any,
      getAvailableProviders: () => llmContext.availableProviders,
      switchProvider: (id, config) => llmContext.switchProvider(id, config),
      registerStateAdapter: (adapter) => llmContext.registerStateAdapter(adapter),
      getStateAdapters: () => llmContext.getStateAdapters(),
      isProcessing: () => llmContext.isProcessing,
      getError: () => llmContext.error,
      on: () => {},
      off: () => {}
    };
    
    // Create service with LLM context linkage for permissions
    return createComponentContextService(llmContextService, options);
  });
  
  // Sync permissions when LLM context permissions change
  useEffect(() => {
    service.updatePermissions(llmContext.permissions);
  }, [llmContext.permissions, service]);
  
  // State for re-renders
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Set up event listeners
  useEffect(() => {
    // Function to trigger re-renders
    const triggerUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    
    // Listen for events that should trigger updates
    service.on(ComponentContextEvents.COMPONENT_REGISTERED, triggerUpdate);
    service.on(ComponentContextEvents.COMPONENT_UNREGISTERED, triggerUpdate);
    service.on(ComponentContextEvents.COMPONENT_UPDATED, triggerUpdate);
    service.on(ComponentContextEvents.CODE_CHANGE_APPLIED, triggerUpdate);
    service.on(ComponentContextEvents.VERSION_CREATED, triggerUpdate);
    service.on(ComponentContextEvents.VERSION_REVERTED, triggerUpdate);
    service.on(ComponentContextEvents.ERROR, triggerUpdate);
    
    // Clean up listeners
    return () => {
      service.off(ComponentContextEvents.COMPONENT_REGISTERED, triggerUpdate);
      service.off(ComponentContextEvents.COMPONENT_UNREGISTERED, triggerUpdate);
      service.off(ComponentContextEvents.COMPONENT_UPDATED, triggerUpdate);
      service.off(ComponentContextEvents.CODE_CHANGE_APPLIED, triggerUpdate);
      service.off(ComponentContextEvents.VERSION_CREATED, triggerUpdate);
      service.off(ComponentContextEvents.VERSION_REVERTED, triggerUpdate);
      service.off(ComponentContextEvents.ERROR, triggerUpdate);
    };
  }, [service]);
  
  // Create the context value from the service with all capabilities
  const contextValue: ComponentContextValue = {
    // Component state
    components: service.getComponents(),
    
    // Methods
    registerComponent: (component: ModifiableComponent) => 
      service.registerComponent(component),
    unregisterComponent: (id: string) => 
      service.unregisterComponent(id),
    updateComponent: (id: string, updates: Partial<ModifiableComponent>) => 
      service.updateComponent(id, updates),
    getComponent: (id: string) => 
      service.getComponent(id),
    executeCodeChange: (request: CodeChangeRequest) => 
      service.executeCodeChange(request),
    getComponentVersions: (id: string) => 
      service.getComponentVersions(id),
    revertToVersion: (componentId: string, versionId: string) => 
      service.revertToVersion(componentId, versionId),
    getComponentRelationships: (id: string) => 
      service.getComponentRelationships(id),
    executeMultiComponentChange: (request: CrossComponentChangeRequest) => 
      service.executeMultiComponentChange(request),
    getAffectedComponents: (componentId: string) => 
      service.getAffectedComponents(componentId),
      
    // Additional functionality integrated directly
    getRelatedStateKeys: (componentId: string) => 
      service.getRelatedStateKeys(componentId),
    visualizeComponentGraph: () => 
      service.visualizeComponentGraph()
  };
  
  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
};

/**
 * Custom hook for using component context
 * @returns The component context value
 */
export const useComponentContext = (): ComponentContextValue => {
  const context = useContext(ComponentContext);
  if (context === null) {
    throw new Error('useComponentContext must be used within a ComponentContextProvider');
  }
  return context;
};

export default ComponentContextProvider;