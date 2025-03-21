import { Message } from '../../../utils/types';
import { LLMProviderAdapter, LLMProviderConfig, LLMCapabilities, ModelOption } from '../LLMProviderAdapter';
/**
 * DeepSeek provider adapter implementing the LLMProviderAdapter interface
 * DeepSeek uses OpenAI's API format but with a different base URL
 */
export declare class DeepSeekProvider implements LLMProviderAdapter {
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
     * Initialize the DeepSeek provider with configuration
     */
    initialize(config: LLMProviderConfig): Promise<void>;
    /**
     * Get DeepSeek API key from environment variables
     */
    private getApiKeyFromEnv;
    /**
     * Send messages to DeepSeek and get a response
     */
    sendMessage(messages: Message[]): Promise<string>;
    /**
     * Stream a response from DeepSeek
     */
    streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
    /**
     * Get available models from DeepSeek
     */
    getModelOptions(): Promise<ModelOption[]>;
    /**
     * Fallback model options for DeepSeek
     */
    private getDefaultModelOptions;
    /**
     * Check if the DeepSeek provider is available (has API key)
     */
    isAvailable(): Promise<boolean>;
}
