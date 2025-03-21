import { EventEmitter } from '../../../utils/EventEmitter';
import { Message, Permissions } from '../../../utils/types';
import { IErrorRecoveryService, IStreamingUpdateManager } from './types';
import {
  ILLMManager,
  ILLMProvider,
  LLMCapabilities,
  LLMManagerEvents,
  LLMProviderConfig,
  ModelOption,
  SendMessageOptions,
  SendMessageResponse,
  StreamingChunkEvent,
  CodeGenerationOptions,
  CodeGenerationResult
} from './types';
import { LLMProviderFactory } from './LLMProviderFactory';

/**
 * Manager for LLM provider adapters
 * Orchestrates provider registration, selection, and communication
 */
export class LLMManager extends EventEmitter implements ILLMManager {
  /** Map of registered providers by ID */
  private providers: Map<string, ILLMProvider> = new Map();
  
  /** Current provider ID */
  private currentProviderId: string | null = null;
  
  /** Error recovery service */
  private errorRecoveryService: IErrorRecoveryService;
  
  /** Streaming update manager */
  private streamingManager: IStreamingUpdateManager;
  
  /** Maximum retry attempts for code generation */
  private maxRetryAttempts: number = 3;
  
  /**
   * Constructor
   * 
   * @param errorRecoveryService Service for handling and recovering from errors
   * @param streamingManager Service for managing streaming updates
   * @param maxRetryAttempts Maximum number of retry attempts for code generation
   */
  constructor(
    errorRecoveryService: IErrorRecoveryService,
    streamingManager: IStreamingUpdateManager,
    maxRetryAttempts: number = 3
  ) {
    super();
    this.errorRecoveryService = errorRecoveryService;
    this.streamingManager = streamingManager;
    this.maxRetryAttempts = maxRetryAttempts;
    
    this.setupEventForwarding();
  }
  
  /**
   * Register a new provider adapter
   * 
   * @param provider The provider adapter to register
   */
  async registerProvider(provider: ILLMProvider): Promise<void> {
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
   * 
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
   * 
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
  getCurrentProvider(): ILLMProvider | null {
    if (!this.currentProviderId) {
      return null;
    }
    return this.providers.get(this.currentProviderId) || null;
  }
  
  /**
   * Get a provider by ID
   * 
   * @param providerId The ID of the provider to get
   */
  getProvider(providerId: string): ILLMProvider | null {
    return this.providers.get(providerId) || null;
  }
  
  /**
   * Check if a provider is available
   * 
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
   * 
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
  getAllProviders(): ILLMProvider[] {
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
   * Set permissions for code validation
   * 
   * @param permissions The permissions to use
   */
  setCodePermissions(permissions: Permissions): void {
    this.errorRecoveryService.setDefaultPermissions(permissions);
  }
  
  /**
   * Set maximum retry attempts for code generation
   * 
   * @param maxRetries The maximum number of retries
   */
  setMaxRetryAttempts(maxRetries: number): void {
    this.maxRetryAttempts = maxRetries;
    this.errorRecoveryService.setMaxRetryAttempts(maxRetries);
  }
  
  /**
   * Generate code with error recovery
   * 
   * @param componentName The name of the component to modify
   * @param originalCode The original code of the component
   * @param prompt The prompt to send to the LLM
   * @param options Optional configuration for code generation
   */
  async generateCode(
    componentName: string,
    originalCode: string,
    prompt: string,
    options?: CodeGenerationOptions
  ): Promise<CodeGenerationResult> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    // If streaming is requested and supported, use streaming code generation
    if (options?.stream && provider.capabilities.streaming) {
      return this.streamCodeGeneration(componentName, originalCode, prompt, options);
    }
    
    const mergedOptions: CodeGenerationOptions = {
      maxRetryAttempts: this.maxRetryAttempts,
      validate: true,
      ...options
    };
    
    // Create a system message with code generation instructions
    const systemMessage: Message = {
      id: 'system-1',
      role: 'system',
      content: `You are an expert React developer.
      Your task is to modify or create React components based on the user's instructions.
      Only return the complete component code without explanations.
      The code should be valid JavaScript/TypeScript React code.`,
      timestamp: Date.now()
    };
    
    let currentPrompt = prompt;
    let attemptCount = 0;
    let originalGeneration: string | null = null;
    
    // Try up to maxRetryAttempts times
    while (attemptCount < mergedOptions.maxRetryAttempts!) {
      try {
        // Create the messages array with the current prompt
        const messages: Message[] = [
          systemMessage,
          {
            id: `user-${attemptCount}`,
            role: 'user',
            content: currentPrompt,
            timestamp: Date.now()
          }
        ];
        
        // Send the message to the LLM
        const response = await this.sendMessage(messages);
        const generatedCode = response.text;
        
        // Extract just the code from the response (in case there's any explanation)
        const codeRegex = /```(?:jsx?|tsx?|react)?\s*([\s\S]*?)```/;
        const extractedCode = generatedCode.match(codeRegex)?.[1] || generatedCode;
        
        // Save the original generation on the first attempt
        if (attemptCount === 0) {
          originalGeneration = extractedCode;
        }
        
        // Skip validation if requested
        if (mergedOptions.validate === false) {
          return {
            code: extractedCode,
            success: true,
            wasStreamed: false,
            wasValidated: false,
            wasFixed: false
          };
        }
        
        // Validate the generated code
        const [isValid, error] = this.errorRecoveryService.validateGeneratedCode(
          extractedCode,
          originalCode,
          componentName,
          mergedOptions.permissions
        );
        
        if (isValid) {
          return {
            code: extractedCode,
            success: true,
            wasStreamed: false,
            wasValidated: true,
            wasFixed: false,
            originalGeneration: originalGeneration || undefined
          };
        } else {
          // Try to auto-fix common errors
          const fixedCode = this.errorRecoveryService.autoFixCommonErrors(
            extractedCode,
            componentName
          );
          
          if (fixedCode) {
            return {
              code: fixedCode,
              success: true,
              wasStreamed: false,
              wasValidated: true,
              wasFixed: true,
              originalGeneration: originalGeneration || undefined
            };
          }
          
          // If we can't auto-fix, try again with an improved prompt
          attemptCount++;
          currentPrompt = this.errorRecoveryService.generateImprovedPrompt(
            componentName,
            prompt
          );
        }
      } catch (error) {
        // Record the error and try again if we have attempts left
        this.errorRecoveryService.recordError(
          '',
          originalCode,
          componentName,
          error instanceof Error ? error.message : 'Unknown error'
        );
        attemptCount++;
      }
    }
    
    // If we've exhausted all attempts, return a fallback
    const fallbackCode = this.errorRecoveryService.generateFallbackCode(componentName);
    
    return {
      code: fallbackCode,
      success: fallbackCode !== null,
      error: 'Exceeded maximum retry attempts',
      wasStreamed: false,
      wasValidated: true,
      wasFixed: false,
      originalGeneration: originalGeneration || undefined
    };
  }
  
  /**
   * Send a message using the current provider
   * 
   * @param messages The messages to send
   * @param options Optional parameters for the request
   */
  async sendMessage(messages: Message[], options?: SendMessageOptions): Promise<SendMessageResponse> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    try {
      return await provider.sendMessage(messages, options);
    } catch (error) {
      this.emit(LLMManagerEvents.ERROR, { error, providerId: this.currentProviderId });
      throw error;
    }
  }
  
  /**
   * Stream a response using the current provider
   * 
   * @param messages The messages to send
   * @param onChunk Callback for each chunk of the response
   * @param options Optional parameters for the request
   */
  async streamResponse(
    messages: Message[],
    onChunk: (event: StreamingChunkEvent) => void,
    options?: SendMessageOptions
  ): Promise<void> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    if (!provider.capabilities.streaming) {
      throw new Error('Current provider does not support streaming');
    }
    
    if (!provider.streamResponse) {
      throw new Error('Current provider does not implement streaming');
    }
    
    try {
      await provider.streamResponse(messages, onChunk, options);
    } catch (error) {
      this.emit(LLMManagerEvents.ERROR, { error, providerId: this.currentProviderId });
      throw error;
    }
  }
  
  /**
   * Generate embeddings for text
   * 
   * @param texts Array of texts to embed
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    if (!provider.capabilities.embeddings) {
      throw new Error('Current provider does not support embeddings');
    }
    
    if (!provider.generateEmbeddings) {
      throw new Error('Current provider does not implement embeddings generation');
    }
    
    try {
      return await provider.generateEmbeddings(texts);
    } catch (error) {
      this.emit(LLMManagerEvents.ERROR, { error, providerId: this.currentProviderId });
      throw error;
    }
  }
  
  /**
   * Generate code with progressive streaming updates
   * 
   * @param componentName The name of the component being modified
   * @param originalCode The original component code
   * @param prompt The prompt for code generation
   * @param options Optional configuration for code generation
   */
  private async streamCodeGeneration(
    componentName: string,
    originalCode: string,
    prompt: string,
    options: CodeGenerationOptions
  ): Promise<CodeGenerationResult> {
    const provider = this.getCurrentProvider();
    if (!provider) {
      throw new Error('No provider is currently selected');
    }
    
    if (!provider.capabilities.streaming) {
      // Fall back to non-streaming code generation
      return this.generateCode(componentName, originalCode, prompt, {
        ...options,
        stream: false
      });
    }
    
    // Initialize the streaming manager
    this.streamingManager.beginStream(componentName);
    
    // Create system and user messages
    const messages: Message[] = [
      {
        id: 'system-1',
        role: 'system',
        content: `You are an expert React developer.
        Your task is to modify or create React components based on the user's instructions.
        Please provide complete component code in a code block using markdown triple backticks.
        The code should be valid JavaScript/TypeScript React code.`,
        timestamp: Date.now()
      },
      {
        id: 'user-1',
        role: 'user',
        content: prompt,
        timestamp: Date.now()
      }
    ];
    
    return new Promise<CodeGenerationResult>((resolve, reject) => {
      try {
        // Custom handler for streaming chunks
        const handleStreamChunk = (chunk: StreamingChunkEvent) => {
          this.streamingManager.processChunk(chunk.text);
          
          // Forward to caller's onStreamUpdate if provided
          if (options.onStreamUpdate) {
            const currentCode = this.streamingManager.getCurrentCode();
            options.onStreamUpdate(chunk.text, currentCode !== null);
          }
        };
        
        // Check if streamResponse is implemented
        if (!provider.streamResponse) {
          throw new Error(`Provider ${provider.name} does not implement streaming`);
        }
        
        // Start streaming
        provider.streamResponse(messages, handleStreamChunk)
          .then(() => {
            // Streaming complete
            this.streamingManager.completeStream();
            
            // Get the final code
            const generatedCode = this.streamingManager.getCurrentCode();
            
            if (!generatedCode) {
              resolve({
                code: null,
                success: false,
                error: 'No code was generated during streaming',
                wasStreamed: true,
                wasValidated: false,
                wasFixed: false
              });
              return;
            }
            
            // Skip validation if requested
            if (options.validate === false) {
              resolve({
                code: generatedCode,
                success: true,
                wasStreamed: true,
                wasValidated: false,
                wasFixed: false
              });
              return;
            }
            
            // Validate the generated code
            const [isValid, error] = this.errorRecoveryService.validateGeneratedCode(
              generatedCode,
              originalCode,
              componentName,
              options.permissions
            );
            
            if (isValid) {
              resolve({
                code: generatedCode,
                success: true,
                wasStreamed: true,
                wasValidated: true,
                wasFixed: false
              });
            } else {
              // Try auto-fixing if validation fails
              const fixedCode = this.errorRecoveryService.autoFixCommonErrors(
                generatedCode,
                componentName
              );
              
              if (fixedCode) {
                resolve({
                  code: fixedCode,
                  success: true,
                  wasStreamed: true,
                  wasValidated: true,
                  wasFixed: true,
                  originalGeneration: generatedCode
                });
              } else {
                // Fall back to regular generation as a last resort
                this.generateCode(componentName, originalCode, prompt, {
                  ...options,
                  stream: false
                })
                  .then(result => resolve({
                    ...result,
                    originalGeneration: generatedCode
                  }))
                  .catch(error => {
                    this.streamingManager.handleError(error);
                    const fallbackCode = this.errorRecoveryService.generateFallbackCode(componentName);
                    resolve({
                      code: fallbackCode,
                      success: fallbackCode !== null,
                      error: error instanceof Error ? error.message : String(error),
                      wasStreamed: true,
                      wasValidated: true,
                      wasFixed: false,
                      originalGeneration: generatedCode
                    });
                  });
              }
            }
          })
          .catch(error => {
            this.streamingManager.handleError(error instanceof Error ? error : String(error));
            this.emit(LLMManagerEvents.ERROR, { error, providerId: this.currentProviderId });
            
            // Try to recover with non-streaming version
            this.generateCode(componentName, originalCode, prompt, {
              ...options,
              stream: false
            })
              .then(result => resolve(result))
              .catch(() => {
                const fallbackCode = this.errorRecoveryService.generateFallbackCode(componentName);
                resolve({
                  code: fallbackCode,
                  success: fallbackCode !== null,
                  error: error instanceof Error ? error.message : String(error),
                  wasStreamed: true,
                  wasValidated: false,
                  wasFixed: false
                });
              });
          });
      } catch (error) {
        this.streamingManager.handleError(error instanceof Error ? error : String(error));
        reject(error);
      }
    });
  }
  
  /**
   * Setup event forwarding from internal services
   */
  private setupEventForwarding(): void {
    // Forward error recovery events to LLMManager events
    if ('on' in this.errorRecoveryService) {
      const recoveryService = this.errorRecoveryService as any;
      
      recoveryService.on('error_detected', (data: any) => {
        this.emit(LLMManagerEvents.CODE_GENERATION_ERROR, data);
      });
      
      recoveryService.on('recovery_success', (data: any) => {
        this.emit(LLMManagerEvents.CODE_GENERATION_RECOVERY, data);
      });
    }
    
    // Forward streaming events to LLMManager events
    if ('on' in this.streamingManager) {
      const streamingService = this.streamingManager as any;
      
      streamingService.on('stream_started', (data: any) => {
        this.emit(LLMManagerEvents.STREAM_STARTED, data);
      });
      
      streamingService.on('stream_chunk', (data: any) => {
        this.emit(LLMManagerEvents.STREAM_CHUNK, data);
      });
      
      streamingService.on('stream_completed', (data: any) => {
        this.emit(LLMManagerEvents.STREAM_COMPLETED, data);
      });
      
      streamingService.on('stream_error', (data: any) => {
        this.emit(LLMManagerEvents.STREAM_ERROR, data);
      });
      
      streamingService.on('code_detected', (data: any) => {
        this.emit(LLMManagerEvents.CODE_DETECTED, data);
      });
      
      streamingService.on('code_updated', (data: any) => {
        this.emit(LLMManagerEvents.CODE_UPDATED, data);
      });
    }
  }
  
  /**
   * Create a provider from the factory and register it
   * 
   * @param providerId The ID of the provider to create
   * @param config Optional configuration for the provider
   */
  async createAndRegisterProvider(providerId: string, config?: LLMProviderConfig): Promise<ILLMProvider> {
    const provider = LLMProviderFactory.createProvider(providerId, config);
    await this.registerProvider(provider);
    return provider;
  }
}

/**
 * Default LLM manager instance
 * Use this for singleton access across the application
 */
export let defaultLLMManager: LLMManager | null = null;