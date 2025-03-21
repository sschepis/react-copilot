import { Message } from '../../../utils/types';
import { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption } from '../LLMProviderAdapter';
/**
 * Anthropic Claude provider adapter implementing the LLMProviderAdapter interface
 */
export declare class AnthropicProvider implements LLMProviderAdapter {
    id: string;
    name: string;
    capabilities: LLMCapabilities;
    private apiKey;
    private model;
    private temperature;
    private maxTokens;
    private apiUrl;
    private isInitialized;
    /**
     * Initialize the Anthropic Claude provider with configuration
     */
    initialize(config: LLMProviderConfig): Promise<void>;
    /**
     * Update capabilities based on the selected model
     */
    private updateCapabilitiesForModel;
    /**
     * Get Anthropic API key from environment variables
     */
    private getApiKeyFromEnv;
    /**
     * Send messages to Anthropic Claude and get a response
     */
    sendMessage(messages: Message[]): Promise<string>;
    /**
     * Stream a response from Anthropic Claude
     */
    streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
    /**
     * Get available models from Anthropic
     */
    getModelOptions(): Promise<ModelOption[]>;
    /**
     * Check if the Anthropic provider is available (has API key)
     */
    isAvailable(): Promise<boolean>;
}
