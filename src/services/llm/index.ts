// Import provider interfaces directly to use in the file
import { 
  LLMProviderAdapter, 
  LLMProviderConfig, 
  LLMCapabilities, 
  ModelOption 
} from './LLMProviderAdapter';

// Export provider interfaces
export {
  LLMProviderAdapter,
  LLMProviderConfig,
  LLMCapabilities,
  ModelOption
};

// Export manager and events
export {
  LLMManager,
  LLMManagerEvents
} from './LLMManager';

// Export provider implementations
export * from './providers';

// Environment variable helpers
export function getEnvVariable(name: string): string | undefined {
  if (typeof window !== 'undefined') {
    // Browser environment
    return (window as any).env?.[name] || process.env?.[`REACT_APP_${name}`];
  } else {
    // Node environment
    return process.env?.[name];
  }
}

/**
 * Legacy function to maintain backward compatibility
 * Creates an LLM service based on the provided configuration
 * @deprecated Use LLMManager instead
 */
export function createLLMService(config: LLMProviderConfig): LLMProviderAdapter {
  const { createProvider } = require('./providers');
  const provider = createProvider(config.provider || 'openai');
  
  // Initialize the provider with the config
  provider.initialize(config).catch((error: Error) => {
    console.error(`Error initializing provider '${config.provider}':`, error);
  });
  
  return provider;
}
