import { Message } from '../../utils/types';
import { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption } from './LLMProviderAdapter';
import { EventEmitter } from '../../utils/EventEmitter';

/**
 * Events emitted by the LLMManager
 */
export enum LLMManagerEvents {
  PROVIDER_REGISTERED = 'provider_registered',
  PROVIDER_REMOVED = 'provider_removed',
  PROVIDER_CHANGED = 'provider_changed',
  ERROR = 'error',
}

/**
 * Manager for LLM provider adapters
 * Handles registration, selection, and lifecycle of providers
 */
export class LLMManager extends EventEmitter {
  private providers: Map<string, LLMProviderAdapter> = new Map();
  private currentProviderId: string | null = null;

  constructor() {
    super();
  }

  /**
   * Register a new provider adapter
   * @param provider The provider adapter to register
   */
  async registerProvider(provider: LLMProviderAdapter): Promise<void> {
    if (this.providers.has(provider.id)) {
      throw new Error(`Provider with ID '${provider.id}' is already registered`);
    }

    this.providers.set(provider.id, provider);
    this.emit(LLMManagerEvents.PROVIDER_REGISTERED, { providerId: provider.id });

    // If this is the first provider, set it as current
    if (this.providers.size === 1) {
      this.currentProviderId = provider.id;
    }
  }

  /**
   * Unregister a provider adapter
   * @param providerId The ID of the provider to unregister
   */
  unregisterProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider with ID '${providerId}' is not registered`);
    }

    this.providers.delete(providerId);
    this.emit(LLMManagerEvents.PROVIDER_REMOVED, { providerId });

    // If we removed the current provider, set current to null or another available provider
    if (this.currentProviderId === providerId) {
      const nextProvider = this.providers.keys().next().value;
      this.currentProviderId = nextProvider || null;
      
      if (this.currentProviderId) {
        this.emit(LLMManagerEvents.PROVIDER_CHANGED, { providerId: this.currentProviderId });
      }
    }
  }

  /**
   * Switch to using a different provider
   * @param providerId The ID of the provider to use
   * @param config Optional configuration for the provider
   */
  async useProvider(providerId: string, config?: LLMProviderConfig): Promise<void> {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider with ID '${providerId}' is not registered`);
    }

    const provider = this.providers.get(providerId)!;

    // Initialize the provider with the given config if provided
    if (config) {
      await provider.initialize(config);
    }

    this.currentProviderId = providerId;
    this.emit(LLMManagerEvents.PROVIDER_CHANGED, { providerId });
  }

  /**
   * Get the current provider adapter
   */
  getCurrentProvider(): LLMProviderAdapter | null {
    if (!this.currentProviderId) {
      return null;
    }
    return this.providers.get(this.currentProviderId) || null;
  }

  /**
   * Get a provider by ID
   * @param providerId The ID of the provider to get
   */
  getProvider(providerId: string): LLMProviderAdapter | null {
    return this.providers.get(providerId) || null;
  }

  /**
   * Check if a provider is available
   * @param providerId The ID of the provider to check
   */
  async isProviderAvailable(providerId: string): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return false;
    }
    return provider.isAvailable();
  }

  /**
   * Get capabilities of a provider
   * @param providerId The ID of the provider to check
   */
  getProviderCapabilities(providerId: string): LLMCapabilities | null {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return null;
    }
    return provider.capabilities;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): LLMProviderAdapter[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all available models across all providers
   */
  async getAllModels(): Promise<{ providerId: string; models: ModelOption[] }[]> {
    const results = [];
    
    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const models = await provider.getModelOptions();
        results.push({ providerId, models });
      } catch (error) {
        console.error(`Error fetching models for provider '${providerId}':`, error);
      }
    }
    
    return results;
  }

  /**
   * Send a message using the current provider
   * @param messages The messages to send
   */
  async sendMessage(messages: Message[]): Promise<string> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    try {
      return await provider.sendMessage(messages);
    } catch (error) {
      this.emit(LLMManagerEvents.ERROR, { error, providerId: this.currentProviderId });
      throw error;
    }
  }

  /**
   * Stream a response using the current provider (if supported)
   * @param messages The messages to send
   * @param onChunk Callback for each chunk of the response
   */
  async streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    if (!provider.capabilities.streaming) {
      throw new Error('Current provider does not support streaming');
    }
    
    if (!provider.streamResponse) {
      throw new Error('Current provider has streaming capability but no implementation');
    }
    
    try {
      await provider.streamResponse(messages, onChunk);
    } catch (error) {
      this.emit(LLMManagerEvents.ERROR, { error, providerId: this.currentProviderId });
      throw error;
    }
  }
}