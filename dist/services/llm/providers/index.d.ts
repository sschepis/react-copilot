import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { LLMProviderAdapter } from '../LLMProviderAdapter';
/**
 * Registry of available LLM providers
 */
export declare const providers: Record<string, new () => LLMProviderAdapter>;
/**
 * Create a provider instance by ID
 * @param providerId The ID of the provider to create
 * @returns A new provider instance
 */
export declare function createProvider(providerId: string): LLMProviderAdapter;
export { OpenAIProvider, AnthropicProvider, DeepSeekProvider };
