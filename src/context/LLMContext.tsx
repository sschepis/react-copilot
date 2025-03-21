import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import {
  LLMConfig,
  Permissions,
  AutonomousConfig,
  Message,
  ChatSession,
  LLMContextValue,
  ProviderInfo,
  StateAdapter
} from '../utils/types';
import { createLLMService } from '../services/llm';

// Default configurations
const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
};

const DEFAULT_PERMISSIONS: Permissions = {
  allowComponentCreation: true,
  allowComponentDeletion: false,
  allowStyleChanges: true,
  allowLogicChanges: true,
  allowDataAccess: true,
  allowNetworkRequests: false,
};

const DEFAULT_AUTONOMOUS_CONFIG: AutonomousConfig = {
  enabled: false,
  requirements: [],
  schedule: 'manual',
  feedbackEnabled: true,
  maxChangesPerSession: 10,
};

// Create the context
export const LLMContext = createContext<LLMContextValue | null>(null);

interface LLMProviderContextProps {
  config: LLMConfig;
  permissions?: Partial<Permissions>;
  autonomousMode?: Partial<AutonomousConfig>;
  children: ReactNode;
}

export const LLMContextProvider: React.FC<LLMProviderContextProps> = ({
  config,
  permissions = {},
  autonomousMode = {},
  children,
}) => {
  // Merge provided config with defaults
  const mergedConfig: LLMConfig = { ...DEFAULT_LLM_CONFIG, ...config };
  const mergedPermissions: Permissions = { ...DEFAULT_PERMISSIONS, ...permissions };
  const mergedAutonomousConfig: AutonomousConfig = { 
    ...DEFAULT_AUTONOMOUS_CONFIG, 
    ...autonomousMode 
  };

  // State for chat sessions
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for providers and state adapters
  const [stateAdapters, setStateAdapters] = useState<StateAdapter[]>([]);
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  
  // Initialize LLM service
  const llmService = createLLMService(mergedConfig);

  // Create a new session on mount if none exists
  useEffect(() => {
    if (chatSessions.length === 0) {
      const newSession = createNewSession();
      setChatSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, []);

  // Create a new chat session
  const createNewSession = (): ChatSession => {
    return {
      id: nanoid(),
      messages: [],
      title: `Session ${chatSessions.length + 1}`,
    };
  };

  // Get current session
  const currentSession = chatSessions.find(s => s.id === currentSessionId) || null;

  // Create a new session
  const createSession = (): ChatSession => {
    const newSession = createNewSession();
    setChatSessions([...chatSessions, newSession]);
    setCurrentSessionId(newSession.id);
    return newSession;
  };

  // Select an existing session
  const selectSession = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
    }
  };
  
  // Get provider info (stub implementation)
  const getProviderInfo = (): ProviderInfo => {
    return {
      id: mergedConfig.provider,
      name: mergedConfig.provider,
      capabilities: {
        streaming: false,
        multiModal: false,
        functionCalling: false,
        embeddings: false,
        contextSize: 8192,
        supportedLanguages: ['en']
      },
      availableModels: [{
        id: mergedConfig.model,
        name: mergedConfig.model,
        contextSize: 8192 // Required property
      }],
      isAvailable: true
    };
  };
  
  // Switch provider (stub implementation)
  const switchProvider = async (providerId: string, newConfig?: LLMConfig): Promise<void> => {
    console.log(`Switching to provider: ${providerId}`);
    // In a real implementation, this would update the provider
  };
  
  // Register state adapter
  const registerStateAdapter = (adapter: StateAdapter): void => {
    setStateAdapters(prev => [...prev, adapter]);
  };
  
  // Get state adapters
  const getStateAdapters = (): StateAdapter[] => {
    return stateAdapters;
  };

  // Send a message to the LLM
  const sendMessage = async (content: string): Promise<Message> => {
    if (!currentSession) {
      throw new Error('No active chat session');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Add context message about available components
      const systemMessage: Message = {
        id: nanoid(),
        role: 'system',
        content: `You are a UI assistant that can modify React components. 
                  Your abilities are limited by these permissions: 
                  ${JSON.stringify(mergedPermissions)}. 
                  Respond in a friendly, helpful manner.`,
        timestamp: Date.now(),
      };

      // Update session with user message
      const updatedMessages = [...currentSession.messages, userMessage];
      const updatedSessions = chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: updatedMessages } : s
      );
      setChatSessions(updatedSessions);

      // Send to LLM service with system message for context
      const messagesForLLM = [
        systemMessage,
        ...updatedMessages,
      ];
      
      const response = await llmService.sendMessage(messagesForLLM);

      // Create assistant message from response
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      // Update session with assistant message
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSessions = chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: finalMessages } : s
      );
      setChatSessions(finalSessions);

      return assistantMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const contextValue: LLMContextValue = {
    config: mergedConfig,
    permissions: mergedPermissions,
    autonomousConfig: mergedAutonomousConfig,
    chatSessions,
    currentSession,
    createSession,
    selectSession,
    sendMessage,
    isProcessing,
    error,
    // Add missing required properties
    providerInfo: getProviderInfo(),
    availableProviders,
    switchProvider,
    registerStateAdapter,
    getStateAdapters
  };

  return (
    <LLMContext.Provider value={contextValue}>
      {children}
    </LLMContext.Provider>
  );
};

// Custom hook for using LLM context
export const useLLMContext = () => {
  const context = useContext(LLMContext);
  if (context === null) {
    throw new Error('useLLMContext must be used within an LLMContextProvider');
  }
  return context;
};
