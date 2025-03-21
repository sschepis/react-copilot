import { Plugin, PluginHooks, PluginContext, ModifiableComponent, CodeChangeResult } from '../../../utils/types';

/**
 * Analytics event with metadata
 */
export interface AnalyticsEvent {
  type: string;
  timestamp: number;
  data: Record<string, any>;
}

/**
 * Options for configuring the analytics plugin
 */
export interface AnalyticsPluginOptions {
  /** Whether to enable analytics collection */
  enabled?: boolean;
  /** Whether to batch events before sending */
  batchEvents?: boolean;
  /** Batch size for sending events */
  batchSize?: number;
  /** URL of the analytics endpoint */
  endpointUrl?: string;
  /** Custom headers to include with analytics requests */
  headers?: Record<string, string>;
  /** Whether to include component source code in analytics */
  includeSourceCode?: boolean;
  /** Callback for processing events before sending */
  processEvent?: (event: AnalyticsEvent) => AnalyticsEvent;
}

/**
 * Plugin for tracking analytics about component creation and code execution
 */
export class AnalyticsPlugin implements Plugin {
  id = 'analytics-plugin';
  name = 'Analytics Plugin';
  version = '1.0.0';
  
  private options: AnalyticsPluginOptions;
  private events: AnalyticsEvent[] = [];
  // We don't use context in this plugin but need to save it in initialize/destroy methods
  // @ts-ignore deliberately unused field
  private _context: PluginContext | null = null;
  
  /**
   * Plugin hooks implementation
   */
  hooks: PluginHooks = {
    // Track component registration
    afterComponentRegistration: (component: ModifiableComponent): void => {
      if (!this.options.enabled) return;
      
      this.trackEvent('component_registered', {
        componentId: component.id,
        componentName: component.name,
        sourceCode: this.options.includeSourceCode ? component.sourceCode : undefined,
      });
    },
    
    // Track code execution results
    afterCodeExecution: (result: CodeChangeResult): void => {
      if (!this.options.enabled) return;
      
      this.trackEvent('code_executed', {
        componentId: result.componentId,
        success: result.success,
        error: result.error,
        sourceCode: this.options.includeSourceCode ? result.newSourceCode : undefined,
      });
    },
    
    // Track LLM requests and responses
    beforeLLMRequest: (prompt: string): string => {
      if (this.options.enabled) {
        this.trackEvent('llm_request', {
          promptLength: prompt.length,
          // Avoid sending the full prompt for privacy/security
          promptPreview: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        });
      }
      return prompt;
    },
    
    afterLLMResponse: (response: string): string => {
      if (this.options.enabled) {
        this.trackEvent('llm_response', {
          responseLength: response.length,
          // Avoid sending the full response for privacy/security
          responsePreview: response.substring(0, 100) + (response.length > 100 ? '...' : ''),
        });
      }
      return response;
    }
  };
  
  /**
   * Create a new AnalyticsPlugin
   * @param options Plugin configuration options
   */
  constructor(options: AnalyticsPluginOptions = {}) {
    this.options = {
      enabled: true,
      batchEvents: true,
      batchSize: 10,
      endpointUrl: '/api/analytics',
      headers: {
        'Content-Type': 'application/json',
      },
      includeSourceCode: false,
      processEvent: (event) => event,
      ...options
    };
  }
  
  /**
   * Initialize the plugin with context
   * @param context The plugin context
   */
  async initialize(context: PluginContext): Promise<void> {
    console.log('[AnalyticsPlugin] Initializing...');
    this._context = context;
    console.log('[AnalyticsPlugin] Initialized successfully');
  }
  
  /**
   * Clean up plugin resources
   */
  async destroy(): Promise<void> {
    console.log('[AnalyticsPlugin] Cleaning up...');
    
    // Send any remaining events before shutting down
    if (this.events.length > 0) {
      await this.sendEvents();
    }
    
    this._context = null;
    console.log('[AnalyticsPlugin] Clean up complete');
  }
  
  /**
   * Track an analytics event
   * @param type The type of event
   * @param data Additional event data
   */
  trackEvent(type: string, data: Record<string, any> = {}): void {
    if (!this.options.enabled) return;
    
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    // Apply custom event processing if configured
    const processedEvent = this.options.processEvent 
      ? this.options.processEvent(event) 
      : event;
    
    // Add to events queue
    this.events.push(processedEvent);
    
    // Send immediately or batch based on configuration
    if (!this.options.batchEvents || this.events.length >= this.options.batchSize!) {
      this.sendEvents().catch(error => {
        console.error('[AnalyticsPlugin] Error sending events:', error);
      });
    }
  }
  
  /**
   * Send collected events to the analytics endpoint
   */
  async sendEvents(): Promise<void> {
    if (this.events.length === 0) return;
    
    // Store events to send in case we need to restore them on error
    const eventsToSend = [...this.events];
    this.events = [];
    
    try {
      // In a real implementation, this would send to an actual endpoint
      // For this example, we'll just log to the console
      console.log(`[AnalyticsPlugin] Sending ${eventsToSend.length} events`);
      
      await fetch(this.options.endpointUrl!, {
        method: 'POST',
        headers: this.options.headers,
        body: JSON.stringify(eventsToSend),
      });
    } catch (error) {
      console.error('[AnalyticsPlugin] Failed to send events:', error);
      // Put events back in the queue for retry
      this.events = [...this.events, ...eventsToSend];
    }
  }
  
  /**
   * Enable or disable analytics collection
   * @param enabled Whether analytics should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
  }
  
  /**
   * Configure the analytics endpoint
   * @param url The endpoint URL
   * @param headers Optional custom headers
   */
  setEndpoint(url: string, headers?: Record<string, string>): void {
    this.options.endpointUrl = url;
    if (headers) {
      this.options.headers = headers;
    }
  }
}