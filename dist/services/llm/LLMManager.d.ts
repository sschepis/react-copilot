import { Message } from '../../utils/types';
import { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption } from './LLMProviderAdapter';
import { EventEmitter } from '../../utils/EventEmitter';
/**
 * Events emitted by the LLMManager
 */
export declare enum LLMManagerEvents {
    PROVIDER_REGISTERED = "provider_registered",
    PROVIDER_REMOVED = "provider_removed",
    PROVIDER_CHANGED = "provider_changed",
    ERROR = "error"
}
/**
 * Manager for LLM provider adapters
 * Handles registration, selection, and lifecycle of providers
 */
export declare class LLMManager extends EventEmitter {
    private providers;
    private currentProviderId;
    constructor();
    /**
     * Register a new provider adapter
     * @param provider The provider adapter to register
     */
    registerProvider(provider: LLMProviderAdapter): Promise<void>;
    /**
     * Unregister a provider adapter
     * @param providerId The ID of the provider to unregister
     */
    unregisterProvider(providerId: string): void;
    /**
     * Switch to using a different provider
     * @param providerId The ID of the provider to use
     * @param config Optional configuration for the provider
     */
    useProvider(providerId: string, config?: LLMProviderConfig): Promise<void>;
    /**
     * Get the current provider adapter
     */
    getCurrentProvider(): LLMProviderAdapter | null;
    /**
     * Get a provider by ID
     * @param providerId The ID of the provider to get
     */
    getProvider(providerId: string): LLMProviderAdapter | null;
    /**
     * Check if a provider is available
     * @param providerId The ID of the provider to check
     */
    isProviderAvailable(providerId: string): Promise<boolean>;
    /**
     * Get capabilities of a provider
     * @param providerId The ID of the provider to check
     */
    getProviderCapabilities(providerId: string): LLMCapabilities | null;
    /**
     * Get all registered providers
     */
    getAllProviders(): LLMProviderAdapter[];
    /**
     * Get all available models across all providers
     */
    getAllModels(): Promise<{
        providerId: string;
        models: ModelOption[];
    }[]>;
    /**
     * Send a message using the current provider
     * @param messages The messages to send
     */
    sendMessage(messages: Message[]): Promise<string>;
    /**
     * Stream a response using the current provider (if supported)
     * @param messages The messages to send
     * @param onChunk Callback for each chunk of the response
     */
    streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
}
