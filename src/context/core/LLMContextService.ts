import { EventEmitter } from '../../utils/EventEmitter';
import { nanoid } from 'nanoid';
import { 
  LLMConfig, 
  Permissions, 
  AutonomousConfig, 
  Message, 
  ChatSession, 
  ProviderInfo,
  StateAdapter
} from '../../utils/types';
import {
  ILLMContextService,
  LLMContextEvents,
  DEFAULT_LLM_CONFIG,
  DEFAULT_PERMISSIONS,
  DEFAULT_AUTONOMOUS_CONFIG,
  MessagePrepOptions
} from './types';
import { 
  LLMManager, 
  LLMProviderFactory, 
  ErrorRecoveryService, 
  StreamingUpdateManager,
  StreamingChunkEvent
} from '../../services/llm/core';

/**
 * Service for managing LLM context
 * Handles LLM configuration, chat sessions, messages, and providers
 */
export class LLMContextService extends EventEmitter implements ILLMContextService {
  private config: LLMConfig;
  private permissions: Permissions;
  private autonomousConfig: AutonomousConfig;
  private chatSessions: ChatSession[] = [];
  private currentSessionId: string | null = null;
  private isProcessingState: boolean = false;
  private errorState: string | null = null;
  private stateAdapters: StateAdapter[] = [];
  private providerInfo: ProviderInfo = {
    id: '',
    name: '',
    capabilities: {
      streaming: false,
      multiModal: false,
      functionCalling: false,
      embeddings: false,
      contextSize: 0,
      supportedLanguages: [],
    },
    availableModels: [],
    isAvailable: false,
  };
  private availableProviders: ProviderInfo[] = [];
  private llmManager: LLMManager;

  /**
   * Create a new LLMContextService
   * 
   * @param config LLM configuration
   * @param permissions Permission settings
   * @param autonomousConfig Autonomous mode configuration
   * @param stateAdapters Initial state adapters
   */
  constructor(
    config: Partial<LLMConfig> = {},
    permissions: Partial<Permissions> = {},
    autonomousConfig: Partial<AutonomousConfig> = {},
    stateAdapters: StateAdapter[] = []
  ) {
    super();
    
    // Merge provided options with defaults
    this.config = { ...DEFAULT_LLM_CONFIG, ...config };
    this.permissions = { ...DEFAULT_PERMISSIONS, ...permissions };
    this.autonomousConfig = { ...DEFAULT_AUTONOMOUS_CONFIG, ...autonomousConfig };
    this.stateAdapters = [...stateAdapters];
    
    // Initialize LLM Manager with required dependencies
    this.llmManager = new LLMManager(
      new ErrorRecoveryService(),
      new StreamingUpdateManager()
    );
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize providers
    this.initializeProviders();
    
    // Create initial session
    this.createInitialSession();
  }
  
  /**
   * Set up event listeners for LLM manager
   */
  private setupEventListeners(): void {
    this.llmManager.on('error', this.handleLLMError);
    this.llmManager.on('provider_changed', this.updateCurrentProviderInfo);
  }
  
  /**
   * Handle LLM manager errors
   */
  private handleLLMError = (data: { error: Error, providerId: string }): void => {
    this.errorState = data.error.message;
    console.error(`Error from LLM provider '${data.providerId}':`, data.error);
    this.emit(LLMContextEvents.ERROR, { error: data.error, providerId: data.providerId });
  };
  
  /**
   * Initialize LLM providers
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Create and register OpenAI provider using factory
      const openaiProvider = LLMProviderFactory.createProvider('openai', {
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
      await this.llmManager.registerProvider(openaiProvider);
      
      // Create and register Anthropic provider using factory
      const anthropicProvider = LLMProviderFactory.createProvider('anthropic', {
        model: 'claude-2',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });
      await this.llmManager.registerProvider(anthropicProvider);
      
      // Set up initial provider based on config
      await this.useProvider(this.config.provider, this.config);
      
      // Update available providers
      this.updateAvailableProviders();
    } catch (error) {
      console.error('Error initializing LLM providers:', error);
      this.errorState = error instanceof Error ? error.message : 'Error initializing providers';
      this.emit(LLMContextEvents.ERROR, { error });
    }
  }
  
  /**
   * Create an initial chat session
   */
  private createInitialSession(): void {
    if (this.chatSessions.length === 0) {
      const newSession = this.createNewSession();
      this.chatSessions = [newSession];
      this.currentSessionId = newSession.id;
    }
  }
  
  /**
   * Create a new chat session object
   */
  private createNewSession(): ChatSession {
    return {
      id: nanoid(),
      messages: [],
      title: `Session ${this.chatSessions.length + 1}`,
    };
  }
  
  /**
   * Update current provider info
   */
  private updateCurrentProviderInfo = async (): Promise<void> => {
    const provider = this.llmManager.getCurrentProvider();
    if (!provider) {
      this.providerInfo = {
        id: '',
        name: '',
        capabilities: {
          streaming: false,
          multiModal: false,
          functionCalling: false,
          embeddings: false,
          contextSize: 0,
          supportedLanguages: [],
        },
        availableModels: [],
        isAvailable: false,
      };
      return;
    }
    
    try {
      const models = await provider.getModelOptions();
      const isAvailable = await provider.isAvailable();
      
      this.providerInfo = {
        id: provider.id,
        name: provider.name,
        capabilities: provider.capabilities,
        availableModels: models,
        isAvailable,
      };
      
      this.emit(LLMContextEvents.PROVIDER_CHANGED, { providerId: provider.id });
    } catch (error) {
      console.error('Error updating provider info:', error);
      this.emit(LLMContextEvents.ERROR, { error });
    }
  };
  
  /**
   * Update available providers list
   */
  private async updateAvailableProviders(): Promise<void> {
    const providers = this.llmManager.getAllProviders();
    const providerInfos: ProviderInfo[] = [];
    
    for (const provider of providers) {
      try {
        const models = await provider.getModelOptions();
        const isAvailable = await provider.isAvailable();
        
        providerInfos.push({
          id: provider.id,
          name: provider.name,
          capabilities: provider.capabilities,
          availableModels: models,
          isAvailable,
        });
      } catch (error) {
        console.error(`Error getting info for provider '${provider.id}':`, error);
      }
    }
    
    this.availableProviders = providerInfos;
  }
  
  /**
   * Set up system message for LLM
   */
  private createSystemMessage(): Message {
    return {
      id: nanoid(),
      role: 'system',
      content: `You are a UI assistant that can modify React components. 
               Your abilities are limited by these permissions: 
               ${JSON.stringify(this.permissions)}. 
               Respond in a friendly, helpful manner.`,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Prepare messages for sending to LLM
   */
  private prepareMessages(
    messages: Message[], 
    options: MessagePrepOptions = {}
  ): Message[] {
    const includeSystem = options.includeSystem !== false;
    
    if (includeSystem) {
      const systemContent = options.systemMessage || 
        `You are a UI assistant that can modify React components. 
         Your abilities are limited by these permissions: 
         ${JSON.stringify(this.permissions)}. 
         Respond in a friendly, helpful manner.`;
         
      const systemMessage: Message = {
        id: nanoid(),
        role: 'system',
        content: systemContent,
        timestamp: Date.now(),
      };
      
      return [systemMessage, ...messages];
    }
    
    return [...messages];
  }
  
  /**
   * Internal method to use a provider
   */
  private async useProvider(providerId: string, config: LLMConfig): Promise<void> {
    try {
      await this.llmManager.useProvider(providerId, {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
      await this.updateCurrentProviderInfo();
    } catch (error) {
      console.error(`Error using provider '${providerId}':`, error);
      throw error;
    }
  }
  
  /**
   * Clean up resources and event listeners
   */
  public dispose(): void {
    this.llmManager.off('error', this.handleLLMError);
    this.llmManager.off('provider_changed', this.updateCurrentProviderInfo);
    this.removeAllListeners();
  }
  
  // Public interface implementation
  
  /**
   * Get the current LLM configuration
   */
  getConfig(): LLMConfig {
    return this.config;
  }
  
  /**
   * Update LLM configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit(LLMContextEvents.CONFIG_CHANGED, { config: this.config });
  }
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions {
    return this.permissions;
  }
  
  /**
   * Update permissions
   */
  updatePermissions(permissions: Partial<Permissions>): void {
    this.permissions = { ...this.permissions, ...permissions };
  }
  
  /**
   * Get autonomous mode configuration
   */
  getAutonomousConfig(): AutonomousConfig {
    return this.autonomousConfig;
  }
  
  /**
   * Update autonomous mode configuration
   */
  updateAutonomousConfig(config: Partial<AutonomousConfig>): void {
    this.autonomousConfig = { ...this.autonomousConfig, ...config };
  }
  
  /**
   * Get all chat sessions
   */
  getChatSessions(): ChatSession[] {
    return this.chatSessions;
  }
  
  /**
   * Get the current chat session
   */
  getCurrentSession(): ChatSession | null {
    return this.chatSessions.find(s => s.id === this.currentSessionId) || null;
  }
  
  /**
   * Create a new chat session
   */
  createSession(): ChatSession {
    const newSession = this.createNewSession();
    this.chatSessions = [...this.chatSessions, newSession];
    this.currentSessionId = newSession.id;
    
    this.emit(LLMContextEvents.SESSION_CREATED, { sessionId: newSession.id });
    
    return newSession;
  }
  
  /**
   * Select a chat session by ID
   */
  selectSession(id: string): boolean {
    const session = this.chatSessions.find(s => s.id === id);
    if (session) {
      this.currentSessionId = id;
      this.emit(LLMContextEvents.SESSION_SELECTED, { sessionId: id });
      return true;
    }
    return false;
  }
  
  /**
   * Send a message
   */
  async sendMessage(
    content: string, 
    options: MessagePrepOptions = {}
  ): Promise<Message> {
    const currentSession = this.getCurrentSession();
    if (!currentSession) {
      throw new Error('No active chat session');
    }

    this.isProcessingState = true;
    this.errorState = null;

    try {
      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Update session with user message
      const updatedMessages = [...currentSession.messages, userMessage];
      this.chatSessions = this.chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: updatedMessages } : s
      );

      // Prepare messages for LLM
      const messagesForLLM = this.prepareMessages(updatedMessages, options);
      
      // Send to LLM service
      const response = await this.llmManager.sendMessage(messagesForLLM);
      
      // Convert response to string if it's not already
      const responseText = typeof response === 'string' ? response : JSON.stringify(response);

      // Create assistant message from response
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };

      // Update session with assistant message
      const finalMessages = [...updatedMessages, assistantMessage];
      this.chatSessions = this.chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: finalMessages } : s
      );
      
      // Emit message sent event
      this.emit(LLMContextEvents.MESSAGE_SENT, { 
        sessionId: currentSession.id,
        userMessage,
        assistantMessage
      });

      return assistantMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this.errorState = errorMessage;
      this.emit(LLMContextEvents.ERROR, { error: err });
      throw err;
    } finally {
      this.isProcessingState = false;
    }
  }
  
  /**
   * Stream a message with chunks
   */
  async streamMessage(
    content: string, 
    onChunk: (chunk: string) => void,
    options: MessagePrepOptions = {}
  ): Promise<Message> {
    const currentSession = this.getCurrentSession();
    if (!currentSession) {
      throw new Error('No active chat session');
    }

    if (!this.providerInfo.capabilities.streaming) {
      throw new Error('Current provider does not support streaming');
    }

    this.isProcessingState = true;
    this.errorState = null;

    try {
      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Update session with user message
      const updatedMessages = [...currentSession.messages, userMessage];
      this.chatSessions = this.chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: updatedMessages } : s
      );

      // Prepare messages for LLM
      const messagesForLLM = this.prepareMessages(updatedMessages, options);
      
      // Create assistant message that will accumulate chunks
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      // Update session with empty assistant message initially
      let finalMessages = [...updatedMessages, assistantMessage];
      this.chatSessions = this.chatSessions.map(s => 
        s.id === currentSession.id ? { ...s, messages: finalMessages } : s
      );

      // Collect chunks to build final response
      let fullResponse = '';
      
      // Adapter for chunk handling with proper type conversion
      const chunkHandler = (event: StreamingChunkEvent) => {
        // Extract text content from the event - handle various formats
        let chunkText = '';
        
        if (typeof event === 'string') {
          // If event is just a string
          chunkText = event;
        } else if (typeof event === 'object' && event !== null) {
          // Try to extract text from common properties that might exist
          chunkText =
            (event as any).text ||
            (event as any).content ||
            (event as any).chunk ||
            '';
        }
        
        fullResponse += chunkText;
        
        // Update the assistantMessage with accumulated content
        const updatedAssistantMessage = { ...assistantMessage, content: fullResponse };
        
        // Update messages in current session
        finalMessages = [...updatedMessages, updatedAssistantMessage];
        this.chatSessions = this.chatSessions.map(s => 
          s.id === currentSession.id ? { ...s, messages: finalMessages } : s
        );
        
        // Call external handler with the text content
        onChunk(chunkText);
      };

      // Stream the response
      await this.llmManager.streamResponse(messagesForLLM, chunkHandler);

      // Return the complete assistant message after streaming is done
      const completeAssistantMessage = { ...assistantMessage, content: fullResponse };
      
      // Emit message sent event
      this.emit(LLMContextEvents.MESSAGE_SENT, { 
        sessionId: currentSession.id,
        userMessage,
        assistantMessage: completeAssistantMessage
      });
      
      return completeAssistantMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      this.errorState = errorMessage;
      this.emit(LLMContextEvents.ERROR, { error: err });
      throw err;
    } finally {
      this.isProcessingState = false;
    }
  }
  
  /**
   * Get current provider information
   */
  getProviderInfo(): ProviderInfo {
    return this.providerInfo;
  }
  
  /**
   * Get all available providers
   */
  getAvailableProviders(): ProviderInfo[] {
    return this.availableProviders;
  }
  
  /**
   * Switch to a different provider
   */
  async switchProvider(providerId: string, config?: LLMConfig): Promise<void> {
    try {
      this.isProcessingState = true;
      this.errorState = null;
      
      const providerConfig = config || this.config;
      await this.useProvider(providerId, providerConfig);
      
      // Update config if provider switch was successful
      this.config = { ...this.config, provider: providerId };
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      this.emit(LLMContextEvents.PROVIDER_CHANGED, { providerId });
      this.emit(LLMContextEvents.CONFIG_CHANGED, { config: this.config });
      
      this.isProcessingState = false;
    } catch (error) {
      this.errorState = error instanceof Error ? error.message : 'Error switching provider';
      this.isProcessingState = false;
      this.emit(LLMContextEvents.ERROR, { error });
      throw error;
    }
  }
  
  /**
   * Register a state adapter
   */
  registerStateAdapter(adapter: StateAdapter): void {
    this.stateAdapters = [...this.stateAdapters, adapter];
  }
  
  /**
   * Get all registered state adapters
   */
  getStateAdapters(): StateAdapter[] {
    return this.stateAdapters;
  }
  
  /**
   * Check if any operation is in progress
   */
  isProcessing(): boolean {
    return this.isProcessingState;
  }
  
  /**
   * Get the latest error message if any
   */
  getError(): string | null {
    return this.errorState;
  }
}

export default LLMContextService;