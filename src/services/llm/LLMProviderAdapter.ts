import { Message } from '../../utils/types';

/**
 * Interface defining the capabilities of an LLM provider
 */
export interface LLMCapabilities {
  streaming: boolean;
  multiModal: boolean;
  functionCalling: boolean;
  embeddings: boolean;
  contextSize: number;
  supportedLanguages: string[];
}

/**
 * Model option for providers that support multiple models
 */
export interface ModelOption {
  id: string;
  name: string;
  contextSize: number;
  description?: string;
  capabilities?: Partial<LLMCapabilities>;
}

/**
 * Base configuration for all LLM providers
 */
export interface LLMProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiUrl?: string;
  [key: string]: any; // Allow provider-specific configuration options
}

/**
 * Interface that all LLM provider adapters must implement
 */
export interface LLMProviderAdapter {
  /**
   * Unique identifier for the provider
   */
  id: string;
  
  /**
   * Human-readable name for the provider
   */
  name: string;
  
  /**
   * Provider capabilities
   */
  capabilities: LLMCapabilities;
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: LLMProviderConfig): Promise<void>;
  
  /**
   * Send messages to the provider and get a response
   */
  sendMessage(messages: Message[]): Promise<string>;
  
  /**
   * Stream a response from the provider (if supported)
   */
  streamResponse?(messages: Message[], onChunk: (chunk: string) => void): Promise<void>;
  
  /**
   * Get the available models for this provider
   */
  getModelOptions(): Promise<ModelOption[]>;
  
  /**
   * Check if the provider is available and properly configured
   */
  isAvailable(): Promise<boolean>;
}