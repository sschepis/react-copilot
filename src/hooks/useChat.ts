import { useState, useCallback, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { Message } from '../utils/types';
import { useLLM } from './useLLM';
import { useComponentContext } from '../context/ComponentContext';
import { createSystemContextMessage } from '../utils/codeGeneration';

/**
 * Hook for chat functionality with component awareness
 */
export function useChat() {
  const { sendMessage, messages, isProcessing, error } = useLLM();
  const { components } = useComponentContext();
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  
  // Initialize with system message
  useEffect(() => {
    if (chatHistory.length === 0) {
      const componentsList = Object.values(components).map(c => ({
        id: c.id,
        name: c.name,
      }));
      
      const systemMessage = createSystemContextMessage(componentsList);
      setChatHistory([systemMessage]);
    }
  }, [components, chatHistory.length]);
  
  // Update system message when components change
  useEffect(() => {
    if (chatHistory.length > 0) {
      const componentsList = Object.values(components).map(c => ({
        id: c.id,
        name: c.name,
      }));
      
      const newSystemMessage = createSystemContextMessage(componentsList);
      
      setChatHistory(prev => {
        // Replace the first system message
        if (prev[0].role === 'system') {
          return [newSystemMessage, ...prev.slice(1)];
        }
        return [newSystemMessage, ...prev];
      });
    }
  }, [components]);
  
  // Send a message with component context
  const sendChatMessage = useCallback(
    async (content: string) => {
      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      
      // Add to chat history
      setChatHistory(prev => [...prev, userMessage]);
      
      try {
        // Send message with context
        const response = await sendMessage(content);
        
        // Add response to chat history
        setChatHistory(prev => [...prev, response]);
        
        return response;
      } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
      }
    },
    [sendMessage]
  );
  
  // Clear chat history
  const clearChat = useCallback(() => {
    // Keep only the system message
    setChatHistory(prev => prev.filter(msg => msg.role === 'system'));
  }, []);
  
  return {
    messages: chatHistory.filter(msg => msg.role !== 'system'), // Don't show system messages to user
    sendMessage: sendChatMessage,
    isProcessing,
    error,
    clearChat,
  };
}
