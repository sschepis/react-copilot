import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  LLMContextValue,
  LLMConfig,
  Permissions,
  AutonomousConfig,
  StateAdapter
} from '../utils/types';
import {
  ILLMContextService,
  LLMContextEvents,
  LLMContextOptions
} from './core/types';
import { createLLMContextService } from './core';

// Create the context
export const LLMContext = createContext<LLMContextValue | null>(null);

// Provider props interface
export interface LLMContextProviderProps {
  children: ReactNode;
  config?: Partial<LLMConfig>;
  permissions?: Partial<Permissions>;
  autonomousMode?: Partial<AutonomousConfig>;
  stateAdapters?: StateAdapter[];
  contextService?: ILLMContextService; // For testing/dependency injection
}

/**
 * LLM Context Provider Component
 * 
 * Provides LLM context to the application, managing configuration,
 * chat sessions, and LLM interactions with full streaming and advanced
 * provider capabilities.
 */
export const LLMContextProvider: React.FC<LLMContextProviderProps> = ({
  children,
  config,
  permissions,
  autonomousMode,
  stateAdapters,
  contextService
}) => {
  // Create or use the provided service
  const [service] = useState<ILLMContextService>(() => {
    if (contextService) {
      return contextService;
    }
    
    // Create a new service with the provided options
    const options: LLMContextOptions = {
      config,
      permissions,
      autonomousMode,
      stateAdapters
    };
    
    return createLLMContextService(options);
  });
  
  // State for re-renders
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  // Set up event listeners
  useEffect(() => {
    // Function to trigger re-renders
    const triggerUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };
    
    // Listen for events that should trigger updates
    service.on(LLMContextEvents.CONFIG_CHANGED, triggerUpdate);
    service.on(LLMContextEvents.SESSION_CREATED, triggerUpdate);
    service.on(LLMContextEvents.SESSION_SELECTED, triggerUpdate);
    service.on(LLMContextEvents.MESSAGE_SENT, triggerUpdate);
    service.on(LLMContextEvents.PROVIDER_CHANGED, triggerUpdate);
    service.on(LLMContextEvents.ERROR, triggerUpdate);
    
    // Clean up listeners
    return () => {
      service.off(LLMContextEvents.CONFIG_CHANGED, triggerUpdate);
      service.off(LLMContextEvents.SESSION_CREATED, triggerUpdate);
      service.off(LLMContextEvents.SESSION_SELECTED, triggerUpdate);
      service.off(LLMContextEvents.MESSAGE_SENT, triggerUpdate);
      service.off(LLMContextEvents.PROVIDER_CHANGED, triggerUpdate);
      service.off(LLMContextEvents.ERROR, triggerUpdate);
    };
  }, [service]);
  
  // Create the context value from the service (re-maps to the expected interface)
  const contextValue: LLMContextValue = {
    // Configuration values
    config: service.getConfig(),
    permissions: service.getPermissions(),
    autonomousConfig: service.getAutonomousConfig(),
    
    // Chat session state
    chatSessions: service.getChatSessions(),
    currentSession: service.getCurrentSession(),
    isProcessing: service.isProcessing(),
    error: service.getError(),
    
    // Provider information
    providerInfo: service.getProviderInfo(),
    availableProviders: service.getAvailableProviders(),
    
    // Methods
    createSession: () => service.createSession(),
    selectSession: (id: string) => service.selectSession(id),
    sendMessage: (content: string) => service.sendMessage(content),
    streamMessage: service.streamMessage 
      ? (content: string, onChunk: (chunk: string) => void) => 
          service.streamMessage!(content, onChunk)
      : undefined,
    switchProvider: (providerId: string, newConfig?: LLMConfig) => 
      service.switchProvider(providerId, newConfig),
    registerStateAdapter: (adapter: StateAdapter) => 
      service.registerStateAdapter(adapter),
    getStateAdapters: () => service.getStateAdapters()
  };
  
  return (
    <LLMContext.Provider value={contextValue}>
      {children}
    </LLMContext.Provider>
  );
};

/**
 * Custom hook for using LLM context
 * @returns The LLM context value
 */
export const useLLMContext = (): LLMContextValue => {
  const context = useContext(LLMContext);
  if (context === null) {
    throw new Error('useLLMContext must be used within a LLMContextProvider');
  }
  return context;
};

export default LLMContextProvider;