import { useState, useCallback } from 'react';
import { Message, UseLLMReturn, ProviderInfo } from '../utils/types';
import { useLLMContext } from '../context/LLMContext';

/**
 * Hook for interacting with the LLM
 *
 * @returns Object with methods for sending messages and getting state
 */
export function useLLM(): UseLLMReturn {
  const {
    sendMessage: contextSendMessage,
    currentSession,
    isProcessing,
    error,
    providerInfo,
    switchProvider: contextSwitchProvider
  } = useLLMContext();
  
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Use messages from context if available, otherwise use local state
  const messages = currentSession?.messages || localMessages;

  // Send a message to the LLM
  const sendMessage = useCallback(
    async (content: string): Promise<Message> => {
      try {
        const response = await contextSendMessage(content);
        return response;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [contextSendMessage]
  );

  // Reset the conversation
  const reset = useCallback(() => {
    setLocalMessages([]);
  }, []);
  
  // Get provider info
  const getProviderInfo = useCallback((): ProviderInfo => {
    return providerInfo;
  }, [providerInfo]);
  
  // Switch provider
  const switchProvider = useCallback(
    async (providerId: string, config?: any): Promise<void> => {
      return await contextSwitchProvider(providerId, config);
    },
    [contextSwitchProvider]
  );

  return {
    sendMessage,
    messages,
    isProcessing,
    error,
    reset,
    getProviderInfo,
    switchProvider
  };
}
