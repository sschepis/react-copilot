/**
 * LLM Core Module
 * 
 * This module provides the core functionality for working with LLM providers
 * through a consistent interface. It handles provider management, error recovery,
 * streaming updates, and code generation.
 */

// Export types for external use
export * from './types';

// Export base classes
export * from './LLMProviderBase';
export * from './LLMProviderFactory';
export * from './LLMManager';
export * from './ErrorRecoveryService';
export * from './StreamingUpdateManager';

// Import for internal use
import { LLMManager } from './LLMManager';
import { ErrorRecoveryService } from './ErrorRecoveryService';
import { StreamingUpdateManager } from './StreamingUpdateManager';
import {
  LLMProviderConfig,
  ILLMProvider,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent,
  CodeGenerationOptions,
  CodeGenerationResult
} from './types';
import { Message } from '../../../utils/types';

// Create default instances of services
const errorRecoveryService = new ErrorRecoveryService();
const streamingManager = new StreamingUpdateManager();

/**
 * Create and export the default manager instance
 */
export const llmManager = new LLMManager(
  errorRecoveryService,
  streamingManager
);

/**
 * Register a provider with the default manager
 * 
 * @param provider The provider to register
 */
export async function registerProvider(provider: ILLMProvider): Promise<void> {
  return llmManager.registerProvider(provider);
}

/**
 * Use a specific provider with the default manager
 * 
 * @param providerId The ID of the provider to use
 * @param config Optional configuration
 */
export async function useProvider(providerId: string, config?: LLMProviderConfig): Promise<void> {
  return llmManager.useProvider(providerId, config);
}

/**
 * Send a message using the current provider
 * 
 * @param messages The messages to send
 * @param options Optional request options
 * @returns The response from the provider
 */
export async function sendMessage(
  messages: Message[],
  options?: SendMessageOptions
): Promise<SendMessageResponse> {
  return llmManager.sendMessage(messages, options);
}

/**
 * Stream a response from the current provider
 * 
 * @param messages The messages to send
 * @param onChunk Callback for each chunk
 * @param options Optional request options
 */
export async function streamResponse(
  messages: Message[],
  onChunk: (event: StreamingChunkEvent) => void,
  options?: SendMessageOptions
): Promise<void> {
  return llmManager.streamResponse(messages, onChunk, options);
}

/**
 * Generate code with error recovery
 * 
 * @param componentName The name of the component
 * @param originalCode The original code
 * @param prompt The prompt to send
 * @param options Optional code generation options
 * @returns The generated code result
 */
export async function generateCode(
  componentName: string,
  originalCode: string,
  prompt: string,
  options?: CodeGenerationOptions
): Promise<CodeGenerationResult> {
  return llmManager.generateCode(componentName, originalCode, prompt, options);
}

/**
 * Generate embeddings for text
 * 
 * @param texts The texts to embed
 * @returns The embeddings
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return llmManager.generateEmbeddings(texts);
}

/**
 * Get all available models across providers
 * 
 * @returns Available models by provider
 */
export async function getAllModels() {
  return llmManager.getAllModels();
}

// Re-export useful types that consumer code might need
export {
  Message,
  LLMProviderConfig,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent,
  CodeGenerationOptions,
  CodeGenerationResult
};