/**
 * Context Core Module
 * 
 * This module provides the core functionality for managing LLM and Component contexts
 * through consistent interfaces. It handles LLM providers, chat sessions, components,
 * versions, and code execution.
 */

// Export types
export * from './types';

// Export service implementations
export { default as LLMContextService } from './LLMContextService';
export { default as ComponentContextService } from './ComponentContextService';

// Export factory functions
export {
  createLLMContextService,
  createComponentContextService,
  contextFactory,
  default as ContextFactory
} from './ContextFactory';

// Create and export default instances for convenience
import { createLLMContextService, createComponentContextService } from './ContextFactory';

/**
 * Default LLM context service instance
 */
export const llmContextService = createLLMContextService();

/**
 * Default component context service instance
 */
export const componentContextService = createComponentContextService(llmContextService);