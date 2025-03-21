import { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption } from './LLMProviderAdapter';
export { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption };
export { LLMManager, LLMManagerEvents } from './LLMManager';
export * from './providers';
export declare function getEnvVariable(name: string): string | undefined;
/**
 * Legacy function to maintain backward compatibility
 * Creates an LLM service based on the provided configuration
 * @deprecated Use LLMManager instead
 */
export declare function createLLMService(config: LLMProviderConfig): LLMProviderAdapter;
