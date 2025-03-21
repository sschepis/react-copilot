import { Message, Permissions } from '../../../utils/types';

/**
 * LLM Provider type
 */
export enum LLMProviderType {
  /** OpenAI provider (GPT models) */
  OPENAI = 'openai',
  /** Anthropic provider (Claude models) */
  ANTHROPIC = 'anthropic',
  /** DeepSeek provider */
  DEEPSEEK = 'deepseek',
  /** HuggingFace provider */
  HUGGINGFACE = 'huggingface',
  /** Cohere provider */
  COHERE = 'cohere',
  /** Local LLM running on the user's machine */
  LOCAL = 'local',
  /** Custom provider */
  CUSTOM = 'custom'
}

/**
 * Interface defining the capabilities of an LLM provider
 */
export interface LLMCapabilities {
  /** Whether the provider supports streaming responses */
  streaming: boolean;
  /** Whether the provider supports multi-modal inputs (text + images) */
  multiModal: boolean;
  /** Whether the provider supports function calling */
  functionCalling: boolean;
  /** Whether the provider supports embeddings */
  embeddings: boolean;
  /** Maximum context size in tokens */
  contextSize: number;
  /** Languages supported by the provider */
  supportedLanguages: string[];
  /** Whether the provider supports tools/plugin usage */
  toolUse?: boolean;
  /** Whether the provider supports JSON mode */
  jsonMode?: boolean;
  /** Whether the provider supports parallel requests */
  parallelRequests?: boolean;
  /** Additional vendor-specific capabilities */
  additionalCapabilities?: Record<string, any>;
}

/**
 * Model option for providers that support multiple models
 */
export interface ModelOption {
  /** Unique identifier for the model */
  id: string;
  /** Display name of the model */
  name: string;
  /** Maximum context size in tokens */
  contextSize: number;
  /** Optional description of the model */
  description?: string;
  /** Model-specific capabilities that may differ from provider defaults */
  capabilities?: Partial<LLMCapabilities>;
  /** Whether this is a fine-tuned model */
  isFineTuned?: boolean;
  /** Creation/release date of the model */
  releaseDate?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Base configuration for all LLM providers
 */
export interface LLMProviderConfig {
  /** API key for authentication */
  apiKey?: string;
  /** Model ID to use */
  model?: string;
  /** Temperature setting (0-1) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Custom API URL (for proxies or enterprise deployments) */
  apiUrl?: string;
  /** Whether to use streaming */
  streaming?: boolean;
  /** Custom HTTP headers */
  headers?: Record<string, string>;
  /** Retry configuration */
  retry?: {
    /** Maximum number of retries */
    maxRetries: number;
    /** Initial retry delay in ms */
    initialDelay: number;
    /** Maximum retry delay in ms */
    maxDelay: number;
  };
  /** Timeout in milliseconds */
  timeout?: number;
  /** Allow provider-specific configuration options */
  [key: string]: any;
}

/**
 * Interface for function calling
 */
export interface FunctionDefinition {
  /** Name of the function */
  name: string;
  /** Description of what the function does */
  description: string;
  /** Function parameters schema */
  parameters: Record<string, any>;
  /** Whether the function is required */
  required?: boolean;
}

/**
 * Result of a function call
 */
export interface FunctionCallResult {
  /** Name of the function that was called */
  name: string;
  /** Result of the function call */
  result: any;
  /** Error message if the function call failed */
  error?: string;
}

/**
 * Request options for sending messages
 */
export interface SendMessageOptions {
  /** Model to use for this specific request */
  model?: string;
  /** Temperature for this specific request */
  temperature?: number;
  /** Max tokens for this specific request */
  maxTokens?: number;
  /** Functions available for function calling */
  functions?: FunctionDefinition[];
  /** Stop sequences */
  stop?: string[];
  /** Additional provider-specific options */
  providerOptions?: Record<string, any>;
}

/**
 * Response from sending messages
 */
export interface SendMessageResponse {
  /** The text response */
  text: string;
  /** Usage statistics */
  usage?: {
    /** Number of prompt tokens used */
    promptTokens: number;
    /** Number of completion tokens used */
    completionTokens: number;
    /** Total tokens used */
    totalTokens: number;
  };
  /** Function call made by the model */
  functionCall?: {
    /** Name of the function */
    name: string;
    /** Arguments provided to the function */
    arguments: string;
  };
  /** Model used for the response */
  model?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Streaming chunk event
 */
export interface StreamingChunkEvent {
  /** Chunk of text */
  text: string;
  /** Complete text so far */
  completionSoFar?: string;
  /** Whether this is the final chunk */
  isComplete?: boolean;
  /** Function call (if present in this chunk) */
  functionCall?: {
    /** Name of the function */
    name: string;
    /** Arguments provided to the function (may be partial) */
    arguments: string;
    /** Whether the function call is complete */
    isComplete: boolean;
  };
}

/**
 * Options for code generation
 */
export interface CodeGenerationOptions {
  /** Maximum number of retry attempts */
  maxRetryAttempts?: number;
  /** Permissions for code validation */
  permissions?: Permissions;
  /** Stream the code generation */
  stream?: boolean;
  /** Callback for streaming updates */
  onStreamUpdate?: (chunk: string, isCode: boolean) => void;
  /** Whether to perform validation */
  validate?: boolean;
  /** Additional context */
  context?: string;
  /** Target language (JavaScript, TypeScript, etc.) */
  language?: string;
}

/**
 * Code generation result
 */
export interface CodeGenerationResult {
  /** The generated code */
  code: string | null;
  /** Whether the generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
  /** Whether the result was streamed */
  wasStreamed: boolean;
  /** Whether validation was performed */
  wasValidated: boolean;
  /** Whether the code was automatically fixed */
  wasFixed: boolean;
  /** Original code before fixes (if any) */
  originalGeneration?: string;
}

/**
 * Events emitted by the LLM Manager
 */
export enum LLMManagerEvents {
  /** A provider was registered */
  PROVIDER_REGISTERED = 'provider_registered',
  /** A provider was removed */
  PROVIDER_REMOVED = 'provider_removed',
  /** The current provider was changed */
  PROVIDER_CHANGED = 'provider_changed',
  /** An error occurred */
  ERROR = 'error',
  /** Code generation encountered an error */
  CODE_GENERATION_ERROR = 'code_generation_error',
  /** Code generation error was recovered */
  CODE_GENERATION_RECOVERY = 'code_generation_recovery',
  /** A streaming response started */
  STREAM_STARTED = 'stream_started',
  /** A streaming chunk was received */
  STREAM_CHUNK = 'stream_chunk',
  /** A streaming response completed */
  STREAM_COMPLETED = 'stream_completed',
  /** A streaming response encountered an error */
  STREAM_ERROR = 'stream_error',
  /** Code was detected in a response */
  CODE_DETECTED = 'code_detected',
  /** Code was updated during streaming */
  CODE_UPDATED = 'code_updated',
}

/**
 * Error recovery events
 */
export enum ErrorRecoveryEvents {
  /** An error was detected */
  ERROR_DETECTED = 'error_detected',
  /** Error recovery succeeded */
  RECOVERY_SUCCESS = 'recovery_success',
  /** Error recovery failed */
  RECOVERY_FAILURE = 'recovery_failure',
}

/**
 * Streaming update events
 */
export enum StreamingUpdateEvents {
  /** Streaming began */
  STREAM_STARTED = 'stream_started',
  /** A streaming chunk was received */
  STREAM_CHUNK = 'stream_chunk',
  /** Streaming completed */
  STREAM_COMPLETED = 'stream_completed',
  /** Streaming encountered an error */
  STREAM_ERROR = 'stream_error',
  /** Code was detected in the stream */
  CODE_DETECTED = 'code_detected',
  /** Code was updated with new content */
  CODE_UPDATED = 'code_updated',
}

/**
 * Interface for LLM provider adapters
 */
export interface ILLMProvider {
  /** Unique identifier for the provider */
  readonly id: string;
  
  /** Human-readable name for the provider */
  readonly name: string;
  
  /** Type of provider */
  readonly type: LLMProviderType;
  
  /** Provider capabilities */
  readonly capabilities: LLMCapabilities;
  
  /** Current configuration */
  readonly config: LLMProviderConfig;
  
  /**
   * Initialize the provider with configuration
   * 
   * @param config The configuration to use
   */
  initialize(config: LLMProviderConfig): Promise<void>;
  
  /**
   * Send messages to the provider and get a response
   * 
   * @param messages The messages to send
   * @param options Optional parameters for the request
   * @returns The response from the provider
   */
  sendMessage(messages: Message[], options?: SendMessageOptions): Promise<SendMessageResponse>;
  
  /**
   * Stream a response from the provider (if supported)
   * 
   * @param messages The messages to send
   * @param onChunk Callback function for each chunk
   * @param options Optional parameters for the request
   * @returns A promise that resolves when streaming is complete
   */
  streamResponse?(
    messages: Message[], 
    onChunk: (chunk: StreamingChunkEvent) => void,
    options?: SendMessageOptions
  ): Promise<void>;
  
  /**
   * Get available models from this provider
   * 
   * @returns Array of available model options
   */
  getModelOptions(): Promise<ModelOption[]>;
  
  /**
   * Check if provider is available and properly configured
   * 
   * @returns Whether the provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Generate embeddings for text
   * 
   * @param texts Array of texts to embed
   * @returns The embeddings as arrays of floats
   */
  generateEmbeddings?(texts: string[]): Promise<number[][]>;
  
  /**
   * Call a function based on the provider's function calling capability
   * 
   * @param messages The messages to send
   * @param functions The available functions
   * @param options Optional parameters for the request
   * @returns The response with function call details
   */
  callFunction?(
    messages: Message[], 
    functions: FunctionDefinition[],
    options?: SendMessageOptions
  ): Promise<SendMessageResponse>;
}

/**
 * Interface for the error recovery service
 */
export interface IErrorRecoveryService {
  /**
   * Set default permissions for code validation
   * 
   * @param permissions The permissions to use
   */
  setDefaultPermissions(permissions: Permissions): void;
  
  /**
   * Set maximum retry attempts for code generation
   * 
   * @param maxRetries The maximum number of retries
   */
  setMaxRetryAttempts(maxRetries: number): void;
  
  /**
   * Validate generated code
   * 
   * @param generatedCode The code to validate
   * @param originalCode The original code
   * @param componentName The component name
   * @param permissions Optional permissions
   * @returns Tuple of [isValid, errorMessage]
   */
  validateGeneratedCode(
    generatedCode: string,
    originalCode: string,
    componentName: string,
    permissions?: Permissions
  ): [boolean, string | null];
  
  /**
   * Auto-fix common errors in generated code
   * 
   * @param code The code to fix
   * @param componentName The component name
   * @returns Fixed code or null if unable to fix
   */
  autoFixCommonErrors(code: string, componentName: string): string | null;
  
  /**
   * Generate an improved prompt based on previous errors
   * 
   * @param componentName The component name
   * @param originalPrompt The original prompt
   * @returns An improved prompt
   */
  generateImprovedPrompt(componentName: string, originalPrompt: string): string;
  
  /**
   * Record an error for learning and improvement
   * 
   * @param generatedCode The code that caused the error
   * @param originalCode The original code
   * @param componentName The component name
   * @param errorMessage The error message
   */
  recordError(
    generatedCode: string,
    originalCode: string,
    componentName: string,
    errorMessage: string
  ): void;
  
  /**
   * Generate fallback code when all attempts fail
   * 
   * @param componentName The component name
   * @returns Simple fallback code
   */
  generateFallbackCode(componentName: string): string | null;
}

/**
 * Interface for the streaming update manager
 */
export interface IStreamingUpdateManager {
  /**
   * Begin a new streaming session
   * 
   * @param componentName The component being streamed
   */
  beginStream(componentName: string): void;
  
  /**
   * Process a streaming chunk
   * 
   * @param chunk The chunk to process
   */
  processChunk(chunk: string): void;
  
  /**
   * Complete the current stream
   */
  completeStream(): void;
  
  /**
   * Handle a streaming error
   * 
   * @param error The error that occurred
   */
  handleError(error: Error | string): void;
  
  /**
   * Get the current generated code
   * 
   * @returns The current state of the generated code
   */
  getCurrentCode(): string | null;
}

/**
 * Interface for LLM manager
 */
export interface ILLMManager {
  /**
   * Register a new provider adapter
   * 
   * @param provider The provider adapter to register
   */
  registerProvider(provider: ILLMProvider): Promise<void>;
  
  /**
   * Unregister a provider adapter
   * 
   * @param providerId The ID of the provider to unregister
   */
  unregisterProvider(providerId: string): void;
  
  /**
   * Switch to using a different provider
   * 
   * @param providerId The ID of the provider to use
   * @param config Optional configuration for the provider
   */
  useProvider(providerId: string, config?: LLMProviderConfig): Promise<void>;
  
  /**
   * Get the current provider adapter
   * 
   * @returns The current provider or null if none
   */
  getCurrentProvider(): ILLMProvider | null;
  
  /**
   * Get a provider by ID
   * 
   * @param providerId The ID of the provider to get
   * @returns The provider or null if not found
   */
  getProvider(providerId: string): ILLMProvider | null;
  
  /**
   * Check if a provider is available
   * 
   * @param providerId The ID of the provider to check
   * @returns Whether the provider is available
   */
  isProviderAvailable(providerId: string): Promise<boolean>;
  
  /**
   * Get capabilities of a provider
   * 
   * @param providerId The ID of the provider to check
   * @returns The provider capabilities or null if not found
   */
  getProviderCapabilities(providerId: string): LLMCapabilities | null;
  
  /**
   * Get all registered providers
   * 
   * @returns Array of all registered providers
   */
  getAllProviders(): ILLMProvider[];
  
  /**
   * Get all available models across all providers
   * 
   * @returns Array of provider IDs and their models
   */
  getAllModels(): Promise<{ providerId: string; models: ModelOption[] }[]>;
  
  /**
   * Set permissions for code validation
   * 
   * @param permissions The permissions to use
   */
  setCodePermissions(permissions: Permissions): void;
  
  /**
   * Set maximum retry attempts for code generation
   * 
   * @param maxRetries The maximum number of retries
   */
  setMaxRetryAttempts(maxRetries: number): void;
  
  /**
   * Generate code with error recovery
   * 
   * @param componentName The name of the component to modify
   * @param originalCode The original code of the component
   * @param prompt The prompt to send to the LLM
   * @param options Optional configuration for code generation
   * @returns The generated code or null if all attempts failed
   */
  generateCode(
    componentName: string,
    originalCode: string,
    prompt: string,
    options?: CodeGenerationOptions
  ): Promise<CodeGenerationResult>;
  
  /**
   * Send a message using the current provider
   * 
   * @param messages The messages to send
   * @param options Optional parameters for the request
   * @returns The response text
   */
  sendMessage(messages: Message[], options?: SendMessageOptions): Promise<SendMessageResponse>;
  
  /**
   * Stream a response using the current provider
   * 
   * @param messages The messages to send
   * @param onChunk Callback for each chunk of the response
   * @param options Optional parameters for the request
   * @returns A promise that resolves when streaming is complete
   */
  streamResponse(
    messages: Message[],
    onChunk: (event: StreamingChunkEvent) => void,
    options?: SendMessageOptions
  ): Promise<void>;
  
  /**
   * Generate embeddings for text
   * 
   * @param texts Array of texts to embed
   * @returns The embeddings as arrays of floats
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}