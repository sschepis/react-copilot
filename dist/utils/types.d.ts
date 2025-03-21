import { ReactNode, RefObject } from 'react';
import { ModelOption, LLMCapabilities } from '../services/llm/LLMProviderAdapter';
export interface DebugOptions {
    enabled?: boolean;
    initialVisible?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    width?: number | string;
    height?: number | string;
    shortcutKey?: string;
}
export type LLMProvider = 'openai' | 'anthropic' | string;
export interface LLMConfig {
    provider: LLMProvider;
    apiKey?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    apiUrl?: string;
    apiVersion?: string;
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
    metadata?: Record<string, any>;
}
export interface ModifiableComponent {
    id: string;
    name: string;
    ref: RefObject<HTMLDivElement>;
    sourceCode?: string;
    props?: Record<string, any>;
    path?: string[];
    dependencies?: string[];
    versions?: ComponentVersion[];
    relationships?: ComponentRelationship;
}
export interface ComponentVersion {
    id: string;
    timestamp: number;
    sourceCode: string;
    description: string;
    author?: string;
}
export interface ComponentRelationship {
    parentId?: string;
    childrenIds: string[];
    siblingIds: string[];
    dependsOn: string[];
    dependedOnBy: string[];
    sharedStateKeys: string[];
}
export interface ComponentRegistryState {
    components: Record<string, ModifiableComponent>;
}
export interface Permissions {
    allowComponentCreation: boolean;
    allowComponentDeletion: boolean;
    allowStyleChanges: boolean;
    allowLogicChanges: boolean;
    allowDataAccess: boolean;
    allowNetworkRequests: boolean;
    rolesAllowed?: string[];
    customValidationRules?: ValidationRule[];
}
export interface ValidationRule {
    id: string;
    description: string;
    validate: (code: string, component: ModifiableComponent) => boolean | Promise<boolean>;
    errorMessage: string;
}
export interface AutonomousConfig {
    enabled: boolean;
    requirements: string | string[];
    schedule?: 'onMount' | 'manual' | 'daily';
    feedbackEnabled?: boolean;
    maxChangesPerSession?: number;
}
export interface AutonomousTask {
    id: string;
    description: string;
    status: 'pending' | 'inProgress' | 'completed' | 'failed';
    result?: string;
    error?: string;
    componentIds?: string[];
}
export interface CodeChangeRequest {
    componentId: string;
    sourceCode: string;
    description: string;
}
export interface CrossComponentChangeRequest {
    componentIds: string[];
    changes: Record<string, string>;
    description: string;
}
export interface CodeChangeResult {
    success: boolean;
    error?: string;
    componentId: string;
    newSourceCode?: string;
    diff?: string;
}
export interface ProviderInfo {
    id: string;
    name: string;
    capabilities: LLMCapabilities;
    availableModels: ModelOption[];
    isAvailable: boolean;
}
export interface StateAdapter {
    type: 'redux' | 'zustand' | 'mobx' | 'react-query' | 'context' | 'custom';
    getState: () => any;
    getStateSlice: (path: string) => any;
    subscribeToChanges: (callback: (state: any) => void) => () => void;
    getActions: () => Record<string, Function>;
    executeAction: (name: string, payload?: any) => Promise<void>;
    modifyState: (path: string, value: any) => Promise<void>;
}
export interface LLMProviderProps {
    config: LLMConfig;
    permissions?: Partial<Permissions>;
    autonomousMode?: Partial<AutonomousConfig>;
    stateAdapters?: StateAdapter[];
    children: ReactNode;
}
export interface ModifiableAppProps {
    children: ReactNode;
    debug?: DebugOptions;
}
export interface ChatOverlayProps {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    initialOpen?: boolean;
    width?: number | string;
    height?: number | string;
    theme?: 'light' | 'dark' | 'auto';
}
export interface AutonomousAgentProps {
    requirements?: string | string[];
    schedule?: 'onMount' | 'manual' | 'daily';
    feedback?: boolean;
    maxChangesPerSession?: number;
}
export interface UseLLMReturn {
    sendMessage: (message: string) => Promise<Message>;
    streamMessage?: (message: string, onChunk: (chunk: string) => void) => Promise<Message>;
    messages: Message[];
    isProcessing: boolean;
    error: string | null;
    reset: () => void;
    getProviderInfo: () => ProviderInfo;
    switchProvider: (providerId: string, config?: LLMConfig) => Promise<void>;
}
export interface UseModifiableComponentReturn {
    ref: RefObject<HTMLDivElement>;
    componentId: string;
    registerSourceCode: (sourceCode: string) => void;
    getVersionHistory: () => ComponentVersion[];
    revertToVersion: (versionId: string) => Promise<boolean>;
}
export interface UseAutonomousModeReturn {
    isEnabled: boolean;
    tasks: AutonomousTask[];
    startAutonomousMode: () => Promise<void>;
    stopAutonomousMode: () => void;
    status: 'idle' | 'running' | 'paused' | 'completed';
}
export interface Plugin {
    id: string;
    name: string;
    version: string;
    hooks: PluginHooks;
    initialize: (context: PluginContext) => Promise<void>;
    destroy: () => Promise<void>;
}
export interface PluginHooks {
    beforeComponentRegistration?: (component: ModifiableComponent) => ModifiableComponent;
    afterComponentRegistration?: (component: ModifiableComponent) => void;
    beforeCodeExecution?: (code: string) => string;
    afterCodeExecution?: (result: CodeChangeResult) => void;
    beforeLLMRequest?: (prompt: string) => string;
    afterLLMResponse?: (response: string) => string;
}
export interface PluginContext {
    llmManager: any;
    componentRegistry: any;
    getState: () => any;
}
export interface LLMContextValue {
    config: LLMConfig;
    permissions: Permissions;
    autonomousConfig: AutonomousConfig;
    chatSessions: ChatSession[];
    currentSession: ChatSession | null;
    createSession: () => ChatSession;
    selectSession: (id: string) => void;
    sendMessage: (message: string) => Promise<Message>;
    streamMessage?: (message: string, onChunk: (chunk: string) => void) => Promise<Message>;
    isProcessing: boolean;
    error: string | null;
    providerInfo: ProviderInfo;
    availableProviders: ProviderInfo[];
    switchProvider: (providerId: string, config?: LLMConfig) => Promise<void>;
    registerStateAdapter: (adapter: StateAdapter) => void;
    getStateAdapters: () => StateAdapter[];
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
}
export interface PerformanceProfile {
    componentId: string;
    renderCount: number;
    averageRenderTime: number;
    memoizationEffectiveness: number;
    stateAccessPatterns: Record<string, number>;
    recommendedOptimizations: string[];
}
