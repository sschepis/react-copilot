import { EventEmitter } from '../../utils/EventEmitter';
import { Message, Permissions } from '../../utils/types';
import {
  ILLMProvider,
  LLMCapabilities,
  LLMManagerEvents,
  LLMProviderConfig,
  CodeGenerationOptions,
  StreamingChunkEvent,
  LLMProviderType
} from './core/types';
import {
  llmManager,
  registerProvider,
  useProvider,
  sendMessage,
  streamResponse,
  generateCode
} from './core';
import { LLMProviderAdapter } from './LLMProviderAdapter';

/**
 * @deprecated Use the LLM core services directly instead
 */
export class LLMManager extends EventEmitter {
  private legacyToNewProviderMap: Map<string, ILLMProvider> = new Map();
  
  constructor(maxRetryAttempts: number = 3) {
    super();
    
    console.warn(
      'LLMManager is deprecated. Use the LLM core services directly.'
    );
    
    // Set up event forwarding from the core LLM manager
    this.setupEventForwarding();
    
    // Set maximum retry attempts in the core manager
    llmManager.setMaxRetryAttempts(maxRetryAttempts);
  }
  
  /**
   * Register a new provider adapter
   * 
   * @deprecated Use registerProvider from core/index.ts
   */
  async registerProvider(provider: LLMProviderAdapter): Promise<void> {
    try {
      // Create a wrapper that adapts old provider to new provider interface
      const newProvider = this.adaptLegacyProvider(provider);
      
      // Store mapping for future reference
      this.legacyToNewProviderMap.set(provider.id, newProvider);
      
      // Register with the new manager
      await registerProvider(newProvider);
    } catch (error) {
      console.error('Error registering provider:', error);
      throw error;
    }
  }
  
  /**
   * Unregister a provider adapter
   * 
   * @deprecated Use llmManager.unregisterProvider directly
   */
  unregisterProvider(providerId: string): void {
    try {
      llmManager.unregisterProvider(providerId);
      this.legacyToNewProviderMap.delete(providerId);
    } catch (error) {
      console.error('Error unregistering provider:', error);
      throw error;
    }
  }
  
  /**
   * Switch to using a different provider
   * 
   * @deprecated Use useProvider from core/index.ts
   */
  async useProvider(providerId: string, config?: LLMProviderConfig): Promise<void> {
    try {
      await useProvider(providerId, config);
    } catch (error) {
      console.error('Error using provider:', error);
      throw error;
    }
  }
  
  /**
   * Get the current provider adapter
   * 
   * @deprecated Use llmManager.getCurrentProvider directly
   */
  getCurrentProvider(): LLMProviderAdapter | null {
    const newProvider = llmManager.getCurrentProvider();
    
    if (!newProvider) {
      return null;
    }
    
    // Since we don't have a direct mapping from new provider to legacy provider,
    // we'll create a proxy object that forwards calls to the new provider
    const proxy: LLMProviderAdapter = {
      id: newProvider.id,
      name: newProvider.name,
      capabilities: newProvider.capabilities,
      initialize: (config) => newProvider.initialize(config),
      sendMessage: async (messages) => {
        const response = await newProvider.sendMessage(messages);
        return response.text;
      },
      streamResponse: newProvider.streamResponse ? 
        (messages, onChunk) => {
          return newProvider.streamResponse!(
            messages, 
            (chunk) => onChunk(chunk.text)
          );
        } : undefined,
      getModelOptions: () => newProvider.getModelOptions(),
      isAvailable: () => newProvider.isAvailable()
    };
    
    return proxy;
  }
  
  /**
   * Get a provider by ID
   * 
   * @deprecated Use llmManager.getProvider directly
   */
  getProvider(providerId: string): LLMProviderAdapter | null {
    const newProvider = llmManager.getProvider(providerId);
    
    if (!newProvider) {
      return null;
    }
    
    // Create a proxy like in getCurrentProvider
    const proxy: LLMProviderAdapter = {
      id: newProvider.id,
      name: newProvider.name,
      capabilities: newProvider.capabilities,
      initialize: (config) => newProvider.initialize(config),
      sendMessage: async (messages) => {
        const response = await newProvider.sendMessage(messages);
        return response.text;
      },
      streamResponse: newProvider.streamResponse ? 
        (messages, onChunk) => {
          return newProvider.streamResponse!(
            messages, 
            (chunk) => onChunk(chunk.text)
          );
        } : undefined,
      getModelOptions: () => newProvider.getModelOptions(),
      isAvailable: () => newProvider.isAvailable()
    };
    
    return proxy;
  }
  
  /**
   * Check if a provider is available
   * 
   * @deprecated Use llmManager.isProviderAvailable directly
   */
  async isProviderAvailable(providerId: string): Promise<boolean> {
    return llmManager.isProviderAvailable(providerId);
  }
  
  /**
   * Get capabilities of a provider
   * 
   * @deprecated Use llmManager.getProviderCapabilities directly
   */
  getProviderCapabilities(providerId: string): LLMCapabilities | null {
    return llmManager.getProviderCapabilities(providerId);
  }
  
  /**
   * Get all registered providers
   * 
   * @deprecated Use llmManager.getAllProviders directly
   */
  getAllProviders(): LLMProviderAdapter[] {
    const newProviders = llmManager.getAllProviders();
    
    // Create proxy objects for each provider
    return newProviders.map(newProvider => ({
      id: newProvider.id,
      name: newProvider.name,
      capabilities: newProvider.capabilities,
      initialize: (config) => newProvider.initialize(config),
      sendMessage: async (messages) => {
        const response = await newProvider.sendMessage(messages);
        return response.text;
      },
      streamResponse: newProvider.streamResponse ? 
        (messages, onChunk) => {
          return newProvider.streamResponse!(
            messages, 
            (chunk) => onChunk(chunk.text)
          );
        } : undefined,
      getModelOptions: () => newProvider.getModelOptions(),
      isAvailable: () => newProvider.isAvailable()
    }));
  }
  
  /**
   * Get all available models across all providers
   * 
   * @deprecated Use llmManager.getAllModels directly
   */
  async getAllModels(): Promise<{ providerId: string; models: any[] }[]> {
    return llmManager.getAllModels();
  }
  
  /**
   * Set permissions for code validation
   * 
   * @deprecated Use llmManager.setCodePermissions directly
   */
  public setCodePermissions(permissions: Permissions): void {
    llmManager.setCodePermissions(permissions);
  }
  
  /**
   * Set maximum retry attempts for code generation
   * 
   * @deprecated Use llmManager.setMaxRetryAttempts directly
   */
  public setMaxRetryAttempts(maxRetries: number): void {
    llmManager.setMaxRetryAttempts(maxRetries);
  }
  
  /**
   * Get the error recovery service
   * 
   * @deprecated Access error recovery through the new LLM core module
   */
  public getErrorRecoveryService(): any {
    console.warn('Direct access to error recovery service is deprecated');
    return null; // No direct access to the service in the new architecture
  }
  
  /**
   * Get the streaming update manager
   * 
   * @deprecated Access streaming manager through the new LLM core module
   */
  public getStreamingManager(): any {
    console.warn('Direct access to streaming manager is deprecated');
    return null; // No direct access to the service in the new architecture
  }
  
  /**
   * Generate code with error recovery
   * 
   * @deprecated Use generateCode from core/index.ts
   */
  async generateCode(
    componentName: string,
    originalCode: string,
    prompt: string,
    permissions?: Permissions
  ): Promise<string | null> {
    try {
      const result = await generateCode(componentName, originalCode, prompt, {
        permissions,
        validate: true
      });
      
      return result.code;
    } catch (error) {
      console.error('Error generating code:', error);
      return null;
    }
  }
  
  /**
   * Send a message using the current provider
   * 
   * @deprecated Use sendMessage from core/index.ts
   */
  async sendMessage(messages: Message[]): Promise<string> {
    try {
      const response = await sendMessage(messages);
      return response.text;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  /**
   * Stream a response using the current provider
   * 
   * @deprecated Use streamResponse from core/index.ts
   */
  async streamResponse(messages: Message[], onChunk: (chunk: string) => void): Promise<void> {
    try {
      await streamResponse(
        messages,
        (event: StreamingChunkEvent) => onChunk(event.text)
      );
    } catch (error) {
      console.error('Error streaming response:', error);
      throw error;
    }
  }
  
  /**
   * Generate code with progressive streaming updates
   * 
   * @deprecated Use generateCode with streaming option from core/index.ts
   */
  async streamCodeGeneration(
    componentName: string,
    originalCode: string,
    prompt: string,
    permissions?: Permissions
  ): Promise<string | null> {
    try {
      const result = await generateCode(componentName, originalCode, prompt, {
        permissions,
        stream: true,
        validate: true
      });
      
      return result.code;
    } catch (error) {
      console.error('Error streaming code generation:', error);
      return null;
    }
  }
  
  /**
   * Adapt a legacy provider to the new provider interface
   */
  private adaptLegacyProvider(legacyProvider: LLMProviderAdapter): ILLMProvider {
    const adapter: ILLMProvider = {
      id: legacyProvider.id,
      name: legacyProvider.name,
      type: this.determineLLMType(legacyProvider),
      capabilities: legacyProvider.capabilities,
      config: {},
      
      initialize: async (config: LLMProviderConfig): Promise<void> => {
        await legacyProvider.initialize(config);
      },
      
      sendMessage: async (messages: Message[], options?: any): Promise<any> => {
        const responseText = await legacyProvider.sendMessage(messages);
        return {
          text: responseText,
          model: options?.model || 'unknown'
        };
      },
      
      getModelOptions: legacyProvider.getModelOptions,
      
      isAvailable: legacyProvider.isAvailable,
      
      // Conditionally add streaming if supported
      ...(legacyProvider.streamResponse && {
        streamResponse: async (messages: Message[], onChunk: any): Promise<void> => {
          await legacyProvider.streamResponse!(messages, (chunk: string) => {
            onChunk({
              text: chunk,
              isComplete: false
            });
          });
        }
      }),
      
      // Implement optional generateEmbeddings if needed
      // This would require extending the legacy interface
    };
    
    return adapter;
  }
  
  /**
   * Determine the provider type from a legacy provider
   */
  private determineLLMType(provider: LLMProviderAdapter): LLMProviderType {
    // Simple heuristic based on the provider ID
    if (provider.id.includes('openai')) {
      return LLMProviderType.OPENAI;
    } else if (provider.id.includes('anthropic') || provider.id.includes('claude')) {
      return LLMProviderType.ANTHROPIC;
    } else if (provider.id.includes('deepseek')) {
      return LLMProviderType.DEEPSEEK;
    } else {
      return LLMProviderType.CUSTOM;
    }
  }
  
  /**
   * Setup event forwarding from the core manager
   */
  private setupEventForwarding(): void {
    // Forward events from the core manager to this adapter
    Object.values(LLMManagerEvents).forEach(eventName => {
      llmManager.on(eventName, (data: any) => {
        this.emit(eventName, data);
      });
    });
  }
}

/**
 * @deprecated Use llmManager from core/index.ts instead
 */
export default LLMManager;