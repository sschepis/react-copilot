/**
 * LLM Provider Hook
 * 
 * This hook manages a single LLM provider instance, handling initialization,
 * model switching, and provider state.
 */

import { useState, useEffect, useCallback } from 'react';
import { LLMConfig, ProviderInfo, Message } from '../utils/types';
import { LLMProviderFactory } from '../services/llm/core/LLMProviderFactory';
import { 
  ILLMProvider, 
  ModelOption, 
  LLMProviderConfig,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent
} from '../services/llm/core/types';

export interface UseLLMProviderResult {
  provider: ILLMProvider | null;
  providerInfo: ProviderInfo | null;
  availableModels: ModelOption[];
  isLoading: boolean;
  error: string | null;
  switchModel: (modelId: string) => Promise<void>;
  sendMessage: (messages: Message[], options?: SendMessageOptions) => Promise<SendMessageResponse>;
  streamResponse: (
    messages: Message[],
    onChunk: (text: string) => void,
    options?: SendMessageOptions
  ) => Promise<void>;
}

/**
 * Hook to manage a single LLM provider
 * 
 * @param initialConfig Initial provider configuration
 * @returns LLM provider management API
 */
export const useLLMProvider = (initialConfig: LLMConfig): UseLLMProviderResult => {
  const [provider, setProvider] = useState<ILLMProvider | null>(null);
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [currentModel, setCurrentModel] = useState<string | null>(initialConfig.model || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize provider on mount or config change
  useEffect(() => {
    const initProvider = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create the provider instance
        const newProvider = LLMProviderFactory.createProvider(initialConfig.provider);
        
        // Initialize with config - create a config object without explicitly mentioning properties
        // that might be included in the spread
        const configObj: LLMProviderConfig = { ...initialConfig };
        await newProvider.initialize(configObj);
        
        // Get available models and capabilities
        const models = await newProvider.getModelOptions();
        const isAvailable = await newProvider.isAvailable();
        
        // Update state
        setProvider(newProvider);
        setAvailableModels(models);
        setCurrentModel(initialConfig.model);
        
        setProviderInfo({
          id: newProvider.id,
          name: newProvider.name,
          capabilities: newProvider.capabilities,
          availableModels: models,
          isAvailable,
        });
      } catch (err) {
        console.error('Error initializing provider:', err);
        setError(err instanceof Error ? err.message : 'Unknown error initializing provider');
      } finally {
        setIsLoading(false);
      }
    };
    
    initProvider();
    
    // Cleanup function to properly dispose provider
    return () => {
      if (provider) {
        // Any cleanup needed for the provider
      }
    };
  }, [initialConfig.provider, initialConfig.apiKey]);
  
  /**
   * Switch to a different model within the same provider
   */
  const switchModel = useCallback(async (modelId: string) => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create updated config with the new model
      const updatedConfig: LLMProviderConfig = {
        ...initialConfig,
        model: modelId,
      };
      
      // Re-initialize the provider with the new model
      await provider.initialize(updatedConfig);
      setCurrentModel(modelId);
      
      // Update provider info
      const isAvailable = await provider.isAvailable();
      if (providerInfo) {
        setProviderInfo({
          ...providerInfo,
          isAvailable,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error switching model');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider, initialConfig, providerInfo]);
  
  /**
   * Send a message to the LLM provider
   */
  const sendMessage = useCallback(async (
    messages: Message[],
    options?: SendMessageOptions
  ): Promise<SendMessageResponse> => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Send the message
      const response = await provider.sendMessage(messages, options);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error sending message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  
  /**
   * Stream a message from the LLM provider
   */
  const streamResponse = useCallback(async (
    messages: Message[],
    onChunk: (text: string) => void,
    options?: SendMessageOptions
  ): Promise<void> => {
    if (!provider) {
      throw new Error('Provider not initialized');
    }
    
    if (!provider.capabilities.streaming) {
      throw new Error('Provider does not support streaming');
    }
    
    // Check if streamResponse method exists
    if (!provider.streamResponse) {
      throw new Error('Provider does not implement streamResponse method');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a handler for streaming chunks
      const handleChunk = (event: StreamingChunkEvent) => {
        if (event.text) {
          onChunk(event.text);
        }
      };
      
      // Stream the response
      await provider.streamResponse(messages, handleChunk, options);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error streaming message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider]);
  
  return {
    provider,
    providerInfo,
    availableModels,
    isLoading,
    error,
    switchModel,
    sendMessage,
    streamResponse
  };
};

export default useLLMProvider;