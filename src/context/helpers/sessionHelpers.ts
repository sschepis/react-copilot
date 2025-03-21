/**
 * Session Helper Functions
 * 
 * Provides utility functions for managing chat sessions and messages,
 * including session creation, message manipulation, and session state management.
 */

import { nanoid } from 'nanoid';
import { ChatSession, Message } from '../../utils/types';

/**
 * Creates a new chat session with a unique ID
 * 
 * @param existingSessions - Optional array of existing sessions to help name the new session
 * @returns A new chat session object
 */
export const createNewSession = (existingSessions: ChatSession[] = []): ChatSession => {
  return {
    id: nanoid(),
    messages: [],
    title: `Session ${existingSessions.length + 1}`,
    timestamp: Date.now(),
  };
};

/**
 * Adds a message to a chat session, creating a new session object
 * 
 * @param session - The chat session to add the message to
 * @param message - The message to add
 * @returns A new session object with the message added
 */
export const addMessageToSession = (
  session: ChatSession,
  message: Message
): ChatSession => {
  return {
    ...session,
    messages: [...session.messages, message],
    lastUpdated: Date.now(),
  };
};

/**
 * Creates a new message object with a unique ID
 * 
 * @param role - The role of the message sender ('user', 'assistant', or 'system')
 * @param content - The content of the message
 * @returns A new message object
 */
export const createMessage = (
  role: 'user' | 'assistant' | 'system',
  content: string
): Message => {
  return {
    id: nanoid(),
    role,
    content,
    timestamp: Date.now(),
  };
};

/**
 * Updates a specific message in a session
 * 
 * @param session - The session containing the message
 * @param messageId - The ID of the message to update
 * @param updates - The partial message updates to apply
 * @returns A new session object with the updated message
 */
export const updateMessageInSession = (
  session: ChatSession,
  messageId: string,
  updates: Partial<Message>
): ChatSession => {
  return {
    ...session,
    messages: session.messages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ),
    lastUpdated: Date.now(),
  };
};

/**
 * Removes a message from a session
 * 
 * @param session - The session containing the message
 * @param messageId - The ID of the message to remove
 * @returns A new session object without the specified message
 */
export const removeMessageFromSession = (
  session: ChatSession,
  messageId: string
): ChatSession => {
  return {
    ...session,
    messages: session.messages.filter(msg => msg.id !== messageId),
    lastUpdated: Date.now(),
  };
};

/**
 * Updates the title of a session
 * 
 * @param session - The session to update
 * @param title - The new title
 * @returns A new session object with the updated title
 */
export const updateSessionTitle = (
  session: ChatSession,
  title: string
): ChatSession => {
  return {
    ...session,
    title,
    lastUpdated: Date.now(),
  };
};

/**
 * Gets the system message from a session, if one exists
 * 
 * @param session - The session to check
 * @returns The system message, or null if none exists
 */
export const getSystemMessage = (session: ChatSession): Message | null => {
  return session.messages.find(msg => msg.role === 'system') || null;
};

/**
 * Gets the message history formatted for LLM requests
 * 
 * @param session - The session to get history from
 * @param includeSystem - Whether to include the system message
 * @returns An array of messages formatted for LLM requests
 */
export const getFormattedMessageHistory = (
  session: ChatSession,
  includeSystem = true
): { role: string; content: string }[] => {
  return session.messages
    .filter(msg => includeSystem || msg.role !== 'system')
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

/**
 * Clears all messages from a session except the system message
 * 
 * @param session - The session to clear
 * @returns A new session object with only the system message (if any)
 */
export const clearChatHistory = (session: ChatSession): ChatSession => {
  const systemMessage = getSystemMessage(session);
  
  return {
    ...session,
    messages: systemMessage ? [systemMessage] : [],
    lastUpdated: Date.now(),
  };
};