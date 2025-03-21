import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { LLMProviderAdapter } from '../LLMProviderAdapter';

/**
 * Registry of available LLM providers
 */
export const providers: Record<string, new () => LLMProviderAdapter> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  deepseek: DeepSeekProvider,
};

/**
 * Create a provider instance by ID
 * @param providerId The ID of the provider to create
 * @returns A new provider instance
 */
export function createProvider(providerId: string): LLMProviderAdapter {
  const ProviderClass = providers[providerId];
  
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  
  return new ProviderClass();
}

export { OpenAIProvider, AnthropicProvider, DeepSeekProvider };