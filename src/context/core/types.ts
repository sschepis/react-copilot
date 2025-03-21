import { ReactNode } from 'react';
import {
  LLMConfig,
  Permissions,
  AutonomousConfig,
  Message,
  ChatSession,
  ProviderInfo,
  StateAdapter,
  ModifiableComponent,
  CodeChangeRequest,
  CodeChangeResult,
  CrossComponentChangeRequest,
  ComponentRelationship,
  ComponentVersion
} from '../../utils/types';

/**
 * Events emitted by the LLM context service
 */
export enum LLMContextEvents {
  CONFIG_CHANGED = 'config_changed',
  SESSION_CREATED = 'session_created',
  SESSION_SELECTED = 'session_selected',
  MESSAGE_SENT = 'message_sent',
  PROVIDER_CHANGED = 'provider_changed',
  ERROR = 'error',
}

/**
 * Events emitted by the Component context service
 */
export enum ComponentContextEvents {
  COMPONENT_REGISTERED = 'component_registered',
  COMPONENT_UNREGISTERED = 'component_unregistered',
  COMPONENT_UPDATED = 'component_updated',
  CODE_CHANGE_APPLIED = 'code_change_applied',
  CODE_CHANGE_FAILED = 'code_change_failed',
  VERSION_CREATED = 'version_created',
  VERSION_REVERTED = 'version_reverted',
  ERROR = 'error',
}

/**
 * Configuration options for LLM Context
 */
export interface LLMContextOptions {
  config?: Partial<LLMConfig>;
  permissions?: Partial<Permissions>;
  autonomousMode?: Partial<AutonomousConfig>;
  stateAdapters?: StateAdapter[];
}

/**
 * Configuration options for Component Context
 */
export interface ComponentContextOptions {
  permissions?: Partial<Permissions>;
}

/**
 * Default LLM configuration
 */
export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
};

/**
 * Default permissions
 */
export const DEFAULT_PERMISSIONS: Permissions = {
  allowComponentCreation: true,
  allowComponentDeletion: false,
  allowStyleChanges: true,
  allowLogicChanges: true,
  allowDataAccess: true,
  allowNetworkRequests: false,
};

/**
 * Default autonomous configuration
 */
export const DEFAULT_AUTONOMOUS_CONFIG: AutonomousConfig = {
  enabled: false,
  requirements: [],
  schedule: 'manual',
  feedbackEnabled: true,
  maxChangesPerSession: 10,
};

/**
 * Message preparation options
 */
export interface MessagePrepOptions {
  includeSystem?: boolean;
  systemMessage?: string;
}

/**
 * Interface for LLM context service
 */
export interface ILLMContextService {
  /**
   * Get the current LLM configuration
   */
  getConfig(): LLMConfig;
  
  /**
   * Update LLM configuration
   */
  updateConfig(config: Partial<LLMConfig>): void;
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions;
  
  /**
   * Update permissions
   */
  updatePermissions(permissions: Partial<Permissions>): void;
  
  /**
   * Get autonomous mode configuration
   */
  getAutonomousConfig(): AutonomousConfig;
  
  /**
   * Update autonomous mode configuration
   */
  updateAutonomousConfig(config: Partial<AutonomousConfig>): void;
  
  /**
   * Get all chat sessions
   */
  getChatSessions(): ChatSession[];
  
  /**
   * Get the current chat session
   */
  getCurrentSession(): ChatSession | null;
  
  /**
   * Create a new chat session
   */
  createSession(): ChatSession;
  
  /**
   * Select a chat session by ID
   */
  selectSession(id: string): boolean;
  
  /**
   * Send a message
   */
  sendMessage(content: string, options?: MessagePrepOptions): Promise<Message>;
  
  /**
   * Stream a message with chunks
   */
  streamMessage?(
    content: string, 
    onChunk: (chunk: string) => void, 
    options?: MessagePrepOptions
  ): Promise<Message>;
  
  /**
   * Get current provider information
   */
  getProviderInfo(): ProviderInfo;
  
  /**
   * Get all available providers
   */
  getAvailableProviders(): ProviderInfo[];
  
  /**
   * Switch to a different provider
   */
  switchProvider(providerId: string, config?: LLMConfig): Promise<void>;
  
  /**
   * Register a state adapter
   */
  registerStateAdapter(adapter: StateAdapter): void;
  
  /**
   * Get all registered state adapters
   */
  getStateAdapters(): StateAdapter[];
  
  /**
   * Check if any operation is in progress
   */
  isProcessing(): boolean;
  
  /**
   * Get the latest error message if any
   */
  getError(): string | null;
  
  /**
   * Add event listener
   */
  on(event: LLMContextEvents, listener: (data: any) => void): void;
  
  /**
   * Remove event listener
   */
  off(event: LLMContextEvents, listener: (data: any) => void): void;
}

/**
 * Interface for Component context service
 */
export interface IComponentContextService {
  /**
   * Get all registered components
   */
  getComponents(): Record<string, ModifiableComponent>;
  
  /**
   * Register a component
   */
  registerComponent(component: ModifiableComponent): void;
  
  /**
   * Unregister a component
   */
  unregisterComponent(id: string): void;
  
  /**
   * Update a component
   */
  updateComponent(id: string, updates: Partial<ModifiableComponent>): void;
  
  /**
   * Get a component by ID
   */
  getComponent(id: string): ModifiableComponent | null;
  
  /**
   * Execute a code change request
   */
  executeCodeChange(request: CodeChangeRequest): Promise<CodeChangeResult>;
  
  /**
   * Execute changes across multiple components
   */
  executeMultiComponentChange(
    request: CrossComponentChangeRequest
  ): Promise<Record<string, CodeChangeResult>>;
  
  /**
   * Get version history for a component
   */
  getComponentVersions(id: string): ComponentVersion[];
  
  /**
   * Revert a component to a specific version
   */
  revertToVersion(componentId: string, versionId: string): Promise<boolean>;
  
  /**
   * Get component relationships
   */
  getComponentRelationships(id: string): ComponentRelationship;
  
  /**
   * Get components that would be affected by changes
   */
  getAffectedComponents(componentId: string): string[];
  
  /**
   * Get state keys related to a component
   */
  getRelatedStateKeys(componentId: string): string[];
  
  /**
   * Get a visualization of the component graph
   */
  visualizeComponentGraph(): any;
  
  /**
   * Get current permissions
   */
  getPermissions(): Permissions;
  
  /**
   * Update permissions
   */
  updatePermissions(permissions: Partial<Permissions>): void;
  
  /**
   * Add event listener
   */
  on(event: ComponentContextEvents, listener: (data: any) => void): void;
  
  /**
   * Remove event listener
   */
  off(event: ComponentContextEvents, listener: (data: any) => void): void;
}

/**
 * Props for LLM Context Provider
 */
export interface LLMContextProviderProps {
  children: ReactNode;
  config?: Partial<LLMConfig>;
  permissions?: Partial<Permissions>;
  autonomousMode?: Partial<AutonomousConfig>;
  stateAdapters?: StateAdapter[];
}

/**
 * Props for Component Context Provider
 */
export interface ComponentContextProviderProps {
  children: ReactNode;
  permissions?: Partial<Permissions>;
  llmContextService?: ILLMContextService;
}

/**
 * Factory function for creating an LLM context service
 */
export type LLMContextServiceFactory = (
  options?: LLMContextOptions
) => ILLMContextService;

/**
 * Factory function for creating a Component context service
 */
export type ComponentContextServiceFactory = (
  llmContextService: ILLMContextService,
  options?: ComponentContextOptions
) => IComponentContextService;

/**
 * Context factory for creating both LLM and Component context services
 */
export interface ContextFactory {
  createLLMContextService: LLMContextServiceFactory;
  createComponentContextService: ComponentContextServiceFactory;
}