import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import { 
  LLMConfig, 
  Permissions, 
  AutonomousConfig, 
  Message, 
  ChatSession, 
  LLMContextValue,
  StateAdapter,
  ProviderInfo
} from '../utils/types';
import { LLMManager, LLMManagerEvents, createProvider } from '../services/llm';

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
export const EnhancedLLMContext = createContext<LLMContextValue | null>(null);

interface EnhancedLLMProviderProps {
  config: LLMConfig;
  permissions?: Partial<Permissions>;
  autonomousMode?: Partial<AutonomousConfig>;
  stateAdapters?: StateAdapter[];
  children: ReactNode;
}

export const EnhancedLLMProvider: React.FC<EnhancedLLMProviderProps> = ({
  config,
  permissions = {},
  autonomousMode = {},
  stateAdapters = [],
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
  const [providerInfo, setProviderInfo] = useState<ProviderInfo>({
    id: '',
    name: '',
    capabilities: {
      streaming: false,
      multiModal: false,
      functionCalling: false,
      embeddings: false,
      contextSize: 0,
      supportedLanguages: [],
    },
    availableModels: [],
    isAvailable: false,
  });
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [registeredStateAdapters, setRegisteredStateAdapters] = useState<StateAdapter[]>([]);

  // Initialize LLM Manager
  const [llmManager] = useState(() => new LLMManager());

  // Register initial providers - could be expanded to register more providers dynamically
  useEffect(() => {
    const initializeProviders = async () => {
      try {
        // Register OpenAI provider
        const openaiProvider = createProvider('openai');
        await llmManager.registerProvider(openaiProvider);
        
        // Register Anthropic provider
        const anthropicProvider = createProvider('anthropic');
        await llmManager.registerProvider(anthropicProvider);
        
        // Set up initial provider based on config
        await useProvider(mergedConfig.provider, mergedConfig);
        
        // Update available providers
        updateAvailableProviders();
      } catch (error) {
        console.error('Error initializing LLM providers:', error);
        setError(error instanceof Error ? error.message : 'Error initializing providers');
      }
    };
    
    initializeProviders();
    
    // Listen for LLM manager events
    llmManager.on(LLMManagerEvents.ERROR, handleLLMError);
    llmManager.on(LLMManagerEvents.PROVIDER_CHANGED, updateCurrentProviderInfo);
    
    return () => {
      // Clean up event listeners
      llmManager.off(LLMManagerEvents.ERROR, handleLLMError);
      llmManager.off(LLMManagerEvents.PROVIDER_CHANGED, updateCurrentProviderInfo);
    };
  }, []);

  // Register initial state adapters
  useEffect(() => {
    if (stateAdapters && stateAdapters.length > 0) {
      setRegisteredStateAdapters(stateAdapters);
    }
  }, [stateAdapters]);

  // Create a new session on mount if none exists
  useEffect(() => {
    if (chatSessions.length === 0) {
      const newSession = createNewSession();
      setChatSessions([newSession]);
      setCurrentSessionId(newSession.id);
    }
  }, []);

  // Handle LLM manager errors
  const handleLLMError = (data: { error: Error, providerId: string }) => {
    setError(data.error.message);
    console.error(`Error from LLM provider '${data.providerId}':`, data.error);
  };

  // Update current provider info
  const updateCurrentProviderInfo = async () => {
    const provider = llmManager.getCurrentProvider();
    if (!provider) {
      setProviderInfo({
        id: '',
        name: '',
        capabilities: {
          streaming: false,
          multiModal: false,
          functionCalling: false,
          embeddings: false,
          contextSize: 0,
          supportedLanguages: [],
        },
        availableModels: [],
        isAvailable: false,
      });
      return;
    }
    
    try {
      const models = await provider.getModelOptions();
      const isAvailable = await provider.isAvailable();
      
      setProviderInfo({
        id: provider.id,
        name: provider.name,
        capabilities: provider.capabilities,
        availableModels: models,
        isAvailable,
      });
    } catch (error) {
      console.error('Error updating provider info:', error);
    }
  };

  // Update available providers list
  const updateAvailableProviders = async () => {
    const providers = llmManager.getAllProviders();
    const providerInfos: ProviderInfo[] = [];
    
    for (const provider of providers) {
      try {
        const models = await provider.getModelOptions();
        const isAvailable = await provider.isAvailable();
        
        providerInfos.push({
          id: provider.id,
          name: provider.name,
          capabilities: provider.capabilities,
          availableModels: models,
          isAvailable,
        });
      } catch (error) {
        console.error(`Error getting info for provider '${provider.id}':`, error);
      }
    }
    
    setAvailableProviders(providerInfos);
  };

  // Switch to a different provider
  const switchProvider = async (providerId: string, providerConfig?: LLMConfig): Promise<void> => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const config = providerConfig || mergedConfig;
      await useProvider(providerId, config);
      
      setIsProcessing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error switching provider');
      setIsProcessing(false);
      throw error;
    }
  };

  // Internal method to use a provider
  const useProvider = async (providerId: string, config: LLMConfig): Promise<void> => {
    try {
      await llmManager.useProvider(providerId, config);
      await updateCurrentProviderInfo();
    } catch (error) {
      console.error(`Error using provider '${providerId}':`, error);
      throw error;
    }
  };

  // Register a state adapter
  const registerStateAdapter = (adapter: StateAdapter): void => {
    setRegisteredStateAdapters(prev => [...prev, adapter]);
  };

  // Get registered state adapters
  const getStateAdapters = (): StateAdapter[] => {
    return registeredStateAdapters;
  };

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
      
      const response = await llmManager.sendMessage(messagesForLLM);

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

  // Stream a message from the LLM
  const streamMessage = async (content: string, onChunk: (chunk: string) => void): Promise<Message> => {
    if (!currentSession) {
      throw new Error('No active chat session');
    }

    if (!providerInfo.capabilities.streaming) {
      throw new Error('Current provider does not support streaming');
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
      
      // Create assistant message that will accumulate chunks
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Update session with empty assistant message initially
      let finalMessages = [...updatedMessages, assistantMessage];
      let finalSessions = chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: finalMessages } : s
      );
      setChatSessions(finalSessions);

      // Collect chunks to build final response
      let fullResponse = '';
      
      // Custom chunk handler
      const handleChunk = (chunk: string) => {
        fullResponse += chunk;
        
        // Update the assistantMessage with accumulated content
        const updatedAssistantMessage = { ...assistantMessage, content: fullResponse };
        
        // Update messages in current session
        finalMessages = [...updatedMessages, updatedAssistantMessage];
        finalSessions = chatSessions.map(s => 
          s.id === currentSession.id ? { ...s, messages: finalMessages } : s
        );
        setChatSessions(finalSessions);
        
        // Call external handler
        onChunk(chunk);
      };

      // Stream the response
      await llmManager.streamResponse(messagesForLLM, handleChunk);

      // Return the complete assistant message after streaming is done
      const completeAssistantMessage = { ...assistantMessage, content: fullResponse };
      return completeAssistantMessage;
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
    streamMessage,
    isProcessing,
    error,
    // Enhanced context values
    providerInfo,
    availableProviders,
    switchProvider,
    registerStateAdapter,
    getStateAdapters,
  };

  return (
    <EnhancedLLMContext.Provider value={contextValue}>
      {children}
    </EnhancedLLMContext.Provider>
  );
};

// Custom hook for using LLM context
export const useEnhancedLLMContext = () => {
  const context = useContext(EnhancedLLMContext);
  if (context === null) {
    throw new Error('useEnhancedLLMContext must be used within an EnhancedLLMProvider');
  }
  return context;
};