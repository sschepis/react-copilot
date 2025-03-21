/**
 * LLM Service Module
 * 
 * This module provides services for interacting with LLM providers,
 * handling different provider implementations, and managing code generation.
 */

// Re-export from core (new architecture)
export * from './core';

// Export the adapters for backward compatibility
export { default as LLMManager } from './LLMManagerAdapter';
export { LLMProviderAdapter } from './LLMProviderAdapter';

// Re-export useful types
import {
  LLMProviderType,
  LLMCapabilities,
  ModelOption,
  LLMProviderConfig,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent,
  CodeGenerationOptions,
  CodeGenerationResult,
  ErrorRecoveryEvents,
  StreamingUpdateEvents,
  LLMManagerEvents
} from './core/types';

export {
  LLMProviderType,
  LLMCapabilities,
  ModelOption,
  LLMProviderConfig,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent,
  CodeGenerationOptions,
  CodeGenerationResult,
  ErrorRecoveryEvents,
  StreamingUpdateEvents,
  LLMManagerEvents
};

/**
 * Create default instances for backward compatibility
 * These are created here to avoid circularity with the adapters
 */
import { ErrorRecoveryService } from './core/ErrorRecoveryService';
import { StreamingUpdateManager } from './core/StreamingUpdateManager';
import LLMManagerClass from './LLMManagerAdapter';

/**
 * Default LLM manager instance for backward compatibility
 * @deprecated Use llmManager from './core' instead
 */
export const defaultLLMManager = new LLMManagerClass();

/**
 * @deprecated Use ErrorRecoveryService from './core' instead
 */
export { ErrorRecoveryService };

/**
 * @deprecated Use StreamingUpdateManager from './core' instead
 */
export { StreamingUpdateManager };

// Re-export everything from the core module as the default export
import * as Core from './core';
export default Core;
