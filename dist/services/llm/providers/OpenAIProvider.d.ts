import { Message } from '../../../utils/types';
import { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption } from '../LLMProviderAdapter';
/**
 * OpenAI provider adapter implementing the LLMProviderAdapter interface
 */
export declare class OpenAIProvider implements LLMProviderAdapter {
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
     * Initialize the OpenAI provider with configuration
     */
    initialize(config: LLMProviderConfig): Promise<void>;
    /**
     * Update capabilities based on the selected model
     */
    private updateCapabilitiesForModel;
    /**
     * Get OpenAI API key from environment variables
     */
    private getApiKeyFromEnv;
    /**
     * Send messages to OpenAI and get a response
     */
    sendMessage(messages: Message[]): Promise<string>;
    /**
     * Stream a response from OpenAI
     */
    streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
    /**
     * Get available models from OpenAI
     */
    getModelOptions(): Promise<ModelOption[]>;
    /**
     * Fallback model options when API is not available
     */
    private getDefaultModelOptions;
    /**
     * Check if the OpenAI provider is available (has API key)
     */
    isAvailable(): Promise<boolean>;
}
