import { EventEmitter } from '../../../utils/EventEmitter';
import { Message } from '../../../utils/types';
import {
  ILLMProvider,
  LLMCapabilities,
  LLMProviderConfig,
  LLMProviderType,
  ModelOption,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent
} from './types';

/**
 * Base abstract class for LLM providers
 * Implements common functionality and ensures consistent interface
 */
export abstract class LLMProviderBase extends EventEmitter implements ILLMProvider {
  /** Unique identifier for this provider */
  readonly id: string;
  
  /** Human-readable name for this provider */
  readonly name: string;
  
  /** Provider type */
  readonly type: LLMProviderType;
  
  /** Default provider capabilities */
  readonly defaultCapabilities: LLMCapabilities = {
    streaming: false,
    multiModal: false,
    functionCalling: false,
    embeddings: false,
    contextSize: 4096,
    supportedLanguages: ['en'],
  };
  
  /** Current provider capabilities */
  readonly capabilities: LLMCapabilities;
  
  /** Current configuration */
  protected _config: LLMProviderConfig = {};
  
  /** Whether the provider has been initialized */
  protected _initialized: boolean = false;
  
  /** Default configuration */
  protected defaultConfig: LLMProviderConfig = {
    temperature: 0.7,
    maxTokens: 1000
  };

  /**
   * Constructor
   * 
   * @param id Unique identifier for this provider
   * @param name Human-readable name for this provider
   * @param type Provider type
   * @param capabilities Provider capabilities
   */
  constructor(
    id: string,
    name: string,
    type: LLMProviderType,
    capabilities?: Partial<LLMCapabilities>
  ) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.capabilities = {
      ...this.defaultCapabilities,
      ...capabilities
    };
  }
  
  /**
   * Get the current configuration
   */
  get config(): LLMProviderConfig {
    return this._config;
  }
  
  /**
   * Initialize the provider with configuration
   * 
   * @param config The configuration to use
   */
  async initialize(config: LLMProviderConfig): Promise<void> {
    this._config = {
      ...this.defaultConfig,
      ...config
    };
    
    try {
      await this.validateConfiguration();
      await this.initializeProvider();
      this._initialized = true;
    } catch (error) {
      this._initialized = false;
      throw error;
    }
  }
  
  /**
   * Send messages to the provider and get a response
   * This default implementation throws an error - must be implemented by subclasses
   * 
   * @param messages The messages to send
   * @param options Optional parameters for the request
   */
  async sendMessage(messages: Message[], options?: SendMessageOptions): Promise<SendMessageResponse> {
    this.ensureInitialized();
    
    // Merge options with configuration
    const mergedOptions = this.mergeOptionsWithConfig(options);
    
    return this.sendMessageToProvider(messages, mergedOptions);
  }
  
  /**
   * Get available models from this provider
   * This default implementation returns an empty array - should be overridden by subclasses
   */
  async getModelOptions(): Promise<ModelOption[]> {
    return [];
  }
  
  /**
   * Check if provider is available and properly configured
   */
  async isAvailable(): Promise<boolean> {
    if (!this._initialized) {
      return false;
    }
    
    try {
      return await this.checkAvailability();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Generate embeddings for text
   * This default implementation throws an error if the provider doesn't support embeddings
   * 
   * @param texts Array of texts to embed
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    this.ensureInitialized();
    
    if (!this.capabilities.embeddings) {
      throw new Error(`Provider ${this.name} does not support embeddings`);
    }
    
    if (!this.generateEmbeddingsFromProvider) {
      throw new Error(`Provider ${this.name} does not implement embeddings generation`);
    }
    
    return this.generateEmbeddingsFromProvider(texts);
  }
  
  /**
   * Call a function based on the provider's function calling capability
   * This default implementation throws an error if the provider doesn't support function calling
   * 
   * @param messages The messages to send
   * @param functions The available functions
   * @param options Optional parameters for the request
   */
  async callFunction(messages: Message[], functions: any[], options?: SendMessageOptions): Promise<SendMessageResponse> {
    this.ensureInitialized();
    
    if (!this.capabilities.functionCalling) {
      throw new Error(`Provider ${this.name} does not support function calling`);
    }
    
    if (!this.callFunctionFromProvider) {
      throw new Error(`Provider ${this.name} does not implement function calling`);
    }
    
    // Merge options with configuration
    const mergedOptions = this.mergeOptionsWithConfig(options);
    
    return this.callFunctionFromProvider(messages, functions, mergedOptions);
  }
  
  /**
   * Stream a response from the provider
   * This default implementation throws an error if the provider doesn't support streaming
   * 
   * @param messages The messages to send
   * @param onChunk Callback function for each chunk
   * @param options Optional parameters for the request
   */
  async streamResponse(
    messages: Message[],
    onChunk: (chunk: StreamingChunkEvent) => void,
    options?: SendMessageOptions
  ): Promise<void> {
    this.ensureInitialized();
    
    if (!this.capabilities.streaming) {
      throw new Error(`Provider ${this.name} does not support streaming`);
    }
    
    if (!this.streamResponseFromProvider) {
      throw new Error(`Provider ${this.name} does not implement streaming`);
    }
    
    // Merge options with configuration
    const mergedOptions = this.mergeOptionsWithConfig(options);
    
    return this.streamResponseFromProvider(messages, onChunk, mergedOptions);
  }
  
  /**
   * Ensure the provider has been initialized
   * @throws Error if not initialized
   */
  protected ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error(`Provider ${this.name} has not been initialized`);
    }
  }
  
  /**
   * Merge request options with the provider configuration
   * 
   * @param options The request options
   * @returns Merged options
   */
  protected mergeOptionsWithConfig(options?: SendMessageOptions): SendMessageOptions {
    return {
      model: this._config.model,
      temperature: this._config.temperature,
      maxTokens: this._config.maxTokens,
      ...options
    };
  }
  
  /**
   * Validate the configuration
   * Should be implemented by subclasses for provider-specific validation
   */
  protected abstract validateConfiguration(): Promise<void>;
  
  /**
   * Initialize the provider with the current configuration
   * Should be implemented by subclasses for provider-specific initialization
   */
  protected abstract initializeProvider(): Promise<void>;
  
  /**
   * Check if the provider is available
   * Should be implemented by subclasses for provider-specific availability check
   */
  protected abstract checkAvailability(): Promise<boolean>;
  
  /**
   * Send messages to the provider
   * Must be implemented by subclasses
   * 
   * @param messages The messages to send
   * @param options The request options
   */
  protected abstract sendMessageToProvider(
    messages: Message[],
    options: SendMessageOptions
  ): Promise<SendMessageResponse>;
  
  /**
   * Stream responses from the provider
   * Should be implemented by subclasses that support streaming
   * 
   * @param messages The messages to send
   * @param onChunk The callback for each chunk
   * @param options The request options
   */
  protected streamResponseFromProvider?(
    messages: Message[],
    onChunk: (chunk: StreamingChunkEvent) => void,
    options: SendMessageOptions
  ): Promise<void>;
  
  /**
   * Generate embeddings from the provider
   * Should be implemented by subclasses that support embeddings
   * 
   * @param texts The texts to embed
   */
  protected generateEmbeddingsFromProvider?(texts: string[]): Promise<number[][]>;
  
  /**
   * Call a function using the provider
   * Should be implemented by subclasses that support function calling
   * 
   * @param messages The messages to send
   * @param functions The available functions
   * @param options The request options
   */
  protected callFunctionFromProvider?(
    messages: Message[],
    functions: any[],
    options: SendMessageOptions
  ): Promise<SendMessageResponse>;
  
  /**
   * Create a standard error message for the provider
   * 
   * @param error The error that occurred
   * @param context Additional context
   * @returns Formatted error message
   */
  protected formatErrorMessage(error: any, context?: string): string {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `${this.name} provider error${context ? ` (${context})` : ''}: ${errorMessage}`;
  }
  
  /**
   * Count tokens in a message (approximate implementation)
   * Providers should override this with more accurate implementations
   * 
   * @param text The text to count tokens for
   * @returns Estimated token count
   */
  protected countTokens(text: string): number {
    // Simple approximation: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Count tokens in a message array
   * 
   * @param messages The messages to count tokens for
   * @returns Estimated token count
   */
  protected countMessageTokens(messages: Message[]): number {
    let totalTokens = 0;
    
    for (const message of messages) {
      // Add tokens for the message content
      totalTokens += this.countTokens(message.content);
      
      // Add tokens for role and message structure (approximation)
      totalTokens += 4; // ~4 tokens per message for structure
    }
    
    return totalTokens;
  }
}