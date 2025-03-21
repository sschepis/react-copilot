import {
  ContextFactory,
  LLMContextOptions,
  ComponentContextOptions,
  ILLMContextService,
  IComponentContextService
} from './types';
import LLMContextService from './LLMContextService';
import ComponentContextService from './ComponentContextService';

/**
 * Create a new LLM context service
 * 
 * @param options Configuration options for the LLM context
 * @returns The LLM context service instance
 */
export function createLLMContextService(options?: LLMContextOptions): ILLMContextService {
  return new LLMContextService(
    options?.config,
    options?.permissions,
    options?.autonomousMode,
    options?.stateAdapters
  );
}

/**
 * Create a new component context service
 * 
 * @param llmContextService Optional LLM context service to link permissions
 * @param options Configuration options for the component context
 * @returns The component context service instance
 */
export function createComponentContextService(
  llmContextService?: ILLMContextService,
  options?: ComponentContextOptions
): IComponentContextService {
  return new ComponentContextService(llmContextService, options?.permissions);
}

/**
 * Factory for creating context services
 */
export const contextFactory: ContextFactory = {
  createLLMContextService,
  createComponentContextService
};

export default contextFactory;