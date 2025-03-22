import { ReactNode, RefObject } from 'react';
import { ModelOption, LLMCapabilities } from '../services/llm/LLMProviderAdapter';
import { MessagePrepOptions } from '../context/core/types';
import { VisualizationData } from '../services/component/relationship/types';

// Debug panel types
export interface DebugOptions {
  enabled?: boolean;
  initialVisible?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  width?: number | string;
  height?: number | string;
  shortcutKey?: string;
}

// LLM Provider types
export type LLMProvider = 'openai' | 'anthropic' | string;

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  apiUrl?: string;
  apiVersion?: string;
  // Allow additional provider-specific configuration
  [key: string]: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  title?: string;
  timestamp?: number;
  lastUpdated?: number;
  metadata?: Record<string, any>;
}

// Component Registry types
export interface ModifiableComponent {
  id: string;
  name: string;
  ref: RefObject<HTMLDivElement>;
  sourceCode?: string;
  props?: Record<string, any>;
  path?: string[]; // Path in component tree
  state?: Record<string, any>;
  version?: string;
  componentType?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
  
  // Legacy properties for test compatibility
  relationships?: {
    parentId?: string;
    childrenIds?: string[];
    dependsOn?: string[];
    dependedOnBy?: string[];
  };
}

export interface ComponentVersion {
  id: string;
  timestamp: number;
  sourceCode: string;
  description?: string;
  author?: string;
  metadata?: Record<string, any>;
}

export interface ComponentRelationship {
  childrenIds: string[];
  siblingIds: string[];
  dependsOn: string[];
  dependedOnBy: string[];
  sharedStateKeys: string[];
}

export interface CodeChangeRequest {
  componentId: string;
  newCode: string;
  description?: string;
  autoFormat?: boolean;
  createVersion?: boolean;
  metadata?: Record<string, any>;
  sourceCode?: string; // Added for backward compatibility with tests
}

export interface CodeChangeResult {
  success: boolean;
  componentId: string;
  error?: string;
  versionId?: string;
  affectedComponents?: string[];
  newSourceCode?: string; // Added for backward compatibility with tests
}

export interface CrossComponentChangeRequest {
  changes: Record<string, string>; // componentId -> new code
  description?: string;
  autoFormat?: boolean;
  createVersion?: boolean;
  metadata?: Record<string, any>;
  componentIds?: string[]; // Added for backward compatibility with tests
}

// LLM Context types
export interface LLMContextValue {
  config: LLMConfig;
  permissions: Permissions;
  autonomousConfig: AutonomousConfig;
  chatSessions: ChatSession[];
  currentSession: ChatSession | null;
  isProcessing: boolean;
  error: string | null;
  providerInfo: ProviderInfo | null;
  availableProviders: ProviderInfo[];
  createSession: () => ChatSession;
  selectSession: (id: string) => boolean;
  sendMessage: (content: string, options?: MessagePrepOptions) => Promise<Message>;
  streamMessage?: (content: string, onChunk: (chunk: string) => void, options?: MessagePrepOptions) => Promise<Message>;
  switchProvider: (providerId: string, newConfig?: LLMConfig) => Promise<void>;
  registerStateAdapter: (adapter: StateAdapter) => void;
  getStateAdapters: () => StateAdapter[];
}

export interface ProviderInfo {
  id: string;
  name: string;
  capabilities: LLMCapabilities;
  availableModels: ModelOption[];
  isAvailable: boolean;
}

// State management adapters
export interface StateAdapter {
  id: string;
  name: string;
  getState: () => Record<string, any>;
  subscribe: (callback: (state: Record<string, any>) => void) => () => void;
  dispatch?: (action: any) => void;
  getActions?: () => string[];
}

// Permissions types
export interface Permissions {
  allowCodeExecution: boolean;
  allowFilesystemAccess: boolean;
  allowNetworkAccess: boolean;
  allowStateModification: boolean;
  allowExternalLibraries: boolean;
  maxTokensPerRequest: number;
  restrictedPaths: string[];
  restrictedModules: string[];
  allowedDomains: string[];
  allowEditing: boolean;
  // Legacy properties needed for compatibility
  allowComponentCreation?: boolean;
  allowComponentDeletion?: boolean;
  allowStyleChanges?: boolean;
  allowLogicChanges?: boolean;
  allowDataAccess?: boolean;
  allowNetworkRequests?: boolean;
}

// Autonomous mode configuration
export interface AutonomousConfig {
  enabled: boolean;
  maxSteps: number;
  requiredConfidence: number;
  autoSave: boolean;
  autoTest: boolean;
  selfCorrect: boolean;
  decisionModel?: string;
  executionModel?: string;
  throttleDelay?: number;
}

export interface ComponentContextValue {
  components: Record<string, ModifiableComponent>;
  registerComponent: (component: ModifiableComponent) => void;
  unregisterComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ModifiableComponent>) => void;
  getComponent: (id: string) => ModifiableComponent | null;
  executeCodeChange: (request: CodeChangeRequest) => Promise<CodeChangeResult>;
  getComponentVersions: (id: string) => ComponentVersion[];
  revertToVersion: (componentId: string, versionId: string) => Promise<boolean>;
  getComponentRelationships: (id: string) => ComponentRelationship;
  executeMultiComponentChange: (request: CrossComponentChangeRequest) => Promise<Record<string, CodeChangeResult>>;
  getAffectedComponents: (componentId: string) => string[];
  // Additional methods (previously in ExtendedComponentContextValue)
  getRelatedStateKeys: (componentId: string) => string[];
  visualizeComponentGraph: () => VisualizationData;
  getAllComponents: () => Record<string, ModifiableComponent>;
}

// Performance profiling types
export interface PerformanceProfile {
  componentId: string;
  renderCount: number;
  averageRenderTime: number;
  memoizationEffectiveness: number;
  stateAccessPatterns: Record<string, number>;
  recommendedOptimizations?: Array<{
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    implementation?: string;
  }> | string[]; // Allow string[] for backward compatibility with tests
}

// Accessibility analysis types
export interface AccessibilityIssue {
  componentId: string;
  issueType: 'contrast' | 'aria' | 'keyboard' | 'semantics' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  element?: string;
  suggestion?: string;
}

// Library of pre-built components and templates
export interface ComponentLibraryItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  sourceCode: string;
  preview?: string;
  author?: string;
  dependencies?: string[];
  usageExample?: string;
  category: 'layout' | 'input' | 'display' | 'navigation' | 'feedback' | 'other';
}

// Plugin system types
export interface PluginContext {
  getComponent: (id: string) => ModifiableComponent | null;
  getAllComponents: () => Record<string, ModifiableComponent>;
  getRelationships: (componentId: string) => ComponentRelationship;
  addMessage: (message: { type: string; content: string; level?: 'info' | 'warning' | 'error' }) => void;
  setMetadata: (componentId: string, key: string, value: any) => void;
  getMetadata: (componentId: string, key: string) => any;
  updateComponent?: (id: string, updates: Partial<ModifiableComponent>) => void;
  
  // Legacy properties for test compatibility
  getState: () => any; // Made required for test compatibility
  llmManager?: any; // Added for test compatibility
  
  // Legacy component registry interface for test compatibility
  componentRegistry?: {
    getComponent: (id: string) => ModifiableComponent | null;
    getAllComponents: () => Record<string, ModifiableComponent>;
    updateComponent: (id: string, updates: Partial<ModifiableComponent>) => void;
  };
}

export interface PluginHooks {
  // Component lifecycle hooks
  beforeComponentRegister?: (component: ModifiableComponent) => ModifiableComponent;
  beforeComponentRegistration?: (component: ModifiableComponent) => ModifiableComponent; // Alias for backward compatibility
  afterComponentRegister?: (component: ModifiableComponent) => void;
  afterComponentRegistration?: (component: ModifiableComponent) => void; // Alias for backward compatibility
  beforeComponentUpdate?: (componentId: string, updates: Partial<ModifiableComponent>) => Partial<ModifiableComponent>;
  afterComponentUpdate?: (component: ModifiableComponent) => void;
  
  // Code change hooks
  beforeCodeChange?: (request: CodeChangeRequest) => CodeChangeRequest;
  afterCodeChange?: (result: CodeChangeResult) => CodeChangeResult;
  
  // Legacy hooks (for test compatibility)
  beforeCodeExecution?: (code: string) => string;
  afterCodeExecution?: (result: CodeChangeResult) => CodeChangeResult | void;
  beforeLLMRequest?: (prompt: string) => string;
  afterLLMResponse?: (response: string) => string;
  
  // Error handling
  onError?: (error: Error, componentId?: string) => void;
}

export interface Plugin {
  id: string;
  name: string;
  description?: string; // Made optional for backward compatibility with tests
  version: string;
  hooks: PluginHooks;
  initialize?: (context: PluginContext) => Promise<void> | void;
  destroy?: () => Promise<void> | void;
  getCapabilities?: () => string[];
  isCompatible?: (component: ModifiableComponent) => boolean;
  configure?: (options: Record<string, any>) => void;
}
