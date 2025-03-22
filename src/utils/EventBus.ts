import { EventEmitter } from './EventEmitter';
import { CommonEvents } from './CommonEvents';

/**
 * Event priority levels to control order of execution
 */
export enum EventPriority {
  LOWEST = 0,
  LOW = 25,
  NORMAL = 50,
  HIGH = 75,
  HIGHEST = 100
}

/**
 * Interface for event metadata
 */
export interface EventMetadata {
  id: string;               // Unique event ID
  timestamp: number;        // When the event was created
  source: string;           // Which system created the event
  priority: EventPriority;  // Priority level
  tags?: string[];          // Optional categorization tags
  correlationId?: string;   // For tracking related events
  [key: string]: any;       // Additional custom metadata
}

/**
 * Event object structure
 */
export interface Event<T = any> {
  type: string;             // Event type/name
  data: T;                  // Event payload data
  metadata: EventMetadata;  // Event metadata
}

/**
 * Event handler function type
 */
export type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  once?: boolean;              // Whether to auto-unsubscribe after handling once
  priority?: EventPriority;    // Handler execution priority
  filter?: (event: Event) => boolean;  // Optional filter function
  async?: boolean;             // Whether to execute handler asynchronously
  timeout?: number;            // Timeout for async handlers (in ms)
  errorHandler?: (error: Error, event: Event) => void;  // Custom error handler
}

/**
 * Event subscription object returned when subscribing
 */
export interface Subscription {
  id: string;              // Unique subscription ID
  eventType: string;       // Event type being subscribed to
  priority: EventPriority; // Subscription priority
  unsubscribe: () => void; // Function to cancel subscription
}

/**
 * Event publication options
 */
export interface PublishOptions {
  priority?: EventPriority;    // Event priority
  delay?: number;              // Delay before publishing (in ms)
  targetSubscribers?: string[]; // Specific subscribers to target (by ID)
  sync?: boolean;              // Whether to wait for all handlers
  timeout?: number;            // Timeout for waiting on handlers
  tags?: string[];             // Event categorization tags
  correlationId?: string;      // For tracking related events
  metadata?: Partial<EventMetadata>; // Additional metadata
}

/**
 * Event bus configuration options
 */
export interface EventBusConfig {
  enableLogging?: boolean;      // Whether to log events
  defaultPriority?: EventPriority; // Default event priority
  maxListeners?: number;        // Maximum listeners per event type
  bufferSize?: number;          // Max events to keep in history
  defaultTimeout?: number;      // Default async handler timeout
  errorHandler?: (error: Error, event: Event) => void; // Global error handler
}

/**
 * Default event bus configuration
 */
const DEFAULT_CONFIG: EventBusConfig = {
  enableLogging: false,
  defaultPriority: EventPriority.NORMAL,
  maxListeners: 10,
  bufferSize: 100,
  defaultTimeout: 5000
};

/**
 * Central event bus for application-wide communication
 * Provides publish-subscribe functionality with advanced features
 * such as priorities, filters, and history tracking
 */
export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private subscriptions: Map<string, Array<{
    id: string;
    handler: EventHandler;
    options: SubscriptionOptions;
  }>> = new Map();
  private eventHistory: Event[] = [];
  private config: EventBusConfig;
  private handlerErrorCount: Map<string, number> = new Map();

  /**
   * Get the singleton instance of the event bus
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Create a new event bus instance
   */
  private constructor(config: EventBusConfig = DEFAULT_CONFIG) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Configure the event bus
   * @param config Configuration options
   */
  configure(config: Partial<EventBusConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Subscribe to an event type
   * @param eventType The event type to subscribe to
   * @param handler The handler function to call when the event occurs
   * @param options Subscription options
   */
  subscribe<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options: SubscriptionOptions = {}
  ): Subscription {
    // Create subscription ID
    const id = Math.random().toString(36).substring(2, 15);
    
    // Initialize subscriptions for this event type if needed
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    
    const subscriptionList = this.subscriptions.get(eventType)!;
    
    // Check max listeners
    if (this.config.maxListeners && subscriptionList.length >= this.config.maxListeners) {
      console.warn(`EventBus: Possible memory leak. More than ${this.config.maxListeners} subscribers for event "${eventType}"`);
    }
    
    // Add the new subscription
    const subscription = {
      id,
      handler,
      options: {
        priority: options.priority ?? this.config.defaultPriority ?? EventPriority.NORMAL,
        ...options
      }
    };
    
    subscriptionList.push(subscription);
    
    // Sort by priority (highest first)
    this.sortSubscriptionsByPriority(eventType);
    
    // Return subscription object
    return {
      id,
      eventType,
      priority: subscription.options.priority!,
      unsubscribe: () => this.unsubscribe(eventType, id)
    };
  }

  /**
   * Subscribe to an event type once
   * @param eventType The event type to subscribe to
   * @param handler The handler function to call when the event occurs
   * @param options Subscription options
   */
  subscribeOnce<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options: Omit<SubscriptionOptions, 'once'> = {}
  ): Subscription {
    return this.subscribe(eventType, handler, { ...options, once: true });
  }

  /**
   * Unsubscribe from an event
   * @param eventType The event type to unsubscribe from
   * @param subscriptionId The ID of the subscription to remove
   */
  unsubscribe(eventType: string, subscriptionId: string): boolean {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return false;
    
    const initialLength = subscriptions.length;
    const filtered = subscriptions.filter(sub => sub.id !== subscriptionId);
    
    if (filtered.length === initialLength) return false;
    
    this.subscriptions.set(eventType, filtered);
    return true;
  }

  /**
   * Unsubscribe all handlers for an event type
   * @param eventType The event type to unsubscribe from
   */
  unsubscribeAll(eventType: string): boolean {
    if (!this.subscriptions.has(eventType)) return false;
    this.subscriptions.delete(eventType);
    return true;
  }

  /**
   * Publish an event
   * @param eventType The type of event
   * @param data The event data
   * @param options Publication options
   */
  async publish<T = any>(
    eventType: string,
    data: T,
    options: PublishOptions = {}
  ): Promise<void> {
    const priority = options.priority ?? this.config.defaultPriority ?? EventPriority.NORMAL;
    
    // Create the event object
    const event: Event<T> = {
      type: eventType,
      data,
      metadata: {
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
        source: 'event-bus',
        priority,
        tags: options.tags || [],
        correlationId: options.correlationId,
        ...options.metadata
      }
    };
    
    // Apply delay if specified
    if (options.delay && options.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
    
    // Add to history
    this.addToHistory(event);
    
    // Log if enabled
    if (this.config.enableLogging) {
      console.log(`EventBus: Publishing "${eventType}"`, event);
    }
    
    // Get handlers for this event type
    const subscribers = this.subscriptions.get(eventType) || [];
    
    // Filter to specific subscribers if needed
    const targetSubscribers = options.targetSubscribers 
      ? subscribers.filter(sub => options.targetSubscribers!.includes(sub.id))
      : subscribers;
    
    if (targetSubscribers.length === 0) {
      return;
    }
    
    // Execute handlers
    const handlerPromises: Promise<void>[] = [];
    
    for (const { handler, options: subOptions, id } of targetSubscribers) {
      // Apply filter if specified
      if (subOptions.filter && !subOptions.filter(event)) {
        continue;
      }
      
      // Create handler execution function
      const executeHandler = async () => {
        try {
          // Handle sync vs async
          if (subOptions.async) {
            const timeoutMs = subOptions.timeout ?? this.config.defaultTimeout;
            
            // Create a promise that rejects after timeout
            const timeoutPromise = new Promise<void>((_, reject) => {
              setTimeout(() => reject(new Error(
                `EventBus: Handler timeout (${timeoutMs}ms) for event "${eventType}"`
              )), timeoutMs);
            });
            
            // Race the handler against the timeout
            await Promise.race([
              Promise.resolve(handler(event)),
              timeoutPromise
            ]);
          } else {
            await handler(event);
          }
          
          // Reset error count on success
          this.handlerErrorCount.set(id, 0);
        } catch (error) {
          // Increment error count
          const errorCount = (this.handlerErrorCount.get(id) || 0) + 1;
          this.handlerErrorCount.set(id, errorCount);
          
          // Try custom error handler first
          if (subOptions.errorHandler) {
            try {
              subOptions.errorHandler(error as Error, event);
            } catch (handlerError) {
              console.error('EventBus: Error in custom error handler:', handlerError);
            }
          } 
          // Otherwise use global handler if available
          else if (this.config.errorHandler) {
            try {
              this.config.errorHandler(error as Error, event);
            } catch (handlerError) {
              console.error('EventBus: Error in global error handler:', handlerError);
            }
          } 
          // Default to console.error
          else {
            console.error(`EventBus: Error handling event "${eventType}":`, error);
          }
          
          // Re-throw if in sync mode
          if (options.sync) {
            throw error;
          }
        } finally {
          // Remove handler if once: true
          if (subOptions.once) {
            this.unsubscribe(eventType, id);
          }
        }
      };
      
      if (options.sync) {
        // In sync mode, execute handlers sequentially
        try {
          await executeHandler();
        } catch (error) {
          // In sync mode, stop execution on first error
          throw error;
        }
      } else {
        // In async mode, collect promises to potentially wait for
        handlerPromises.push(executeHandler());
      }
    }
    
    // Wait for all handlers if requested and we're not already in sync mode
    if (!options.sync && options.sync !== false) {
      await Promise.all(handlerPromises);
    }
  }

  /**
   * Add an event to the history
   * @param event The event to add
   */
  private addToHistory(event: Event): void {
    this.eventHistory.unshift(event);
    
    // Trim history if needed
    if (this.config.bufferSize && this.eventHistory.length > this.config.bufferSize) {
      this.eventHistory = this.eventHistory.slice(0, this.config.bufferSize);
    }
  }

  /**
   * Sort subscriptions by priority
   * @param eventType The event type to sort
   */
  private sortSubscriptionsByPriority(eventType: string): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return;
    
    subscriptions.sort((a, b) => 
      (b.options.priority ?? EventPriority.NORMAL) - 
      (a.options.priority ?? EventPriority.NORMAL)
    );
  }

  /**
   * Get event history
   * @param limit Maximum number of events to return
   * @param eventType Optional filter by event type
   * @param filter Optional custom filter function
   */
  getHistory(
    limit?: number,
    eventType?: string,
    filter?: (event: Event) => boolean
  ): Event[] {
    let result = this.eventHistory;
    
    // Filter by event type
    if (eventType) {
      result = result.filter(event => event.type === eventType);
    }
    
    // Apply custom filter
    if (filter) {
      result = result.filter(filter);
    }
    
    // Apply limit
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * Clear event history
   * @param eventType Optional event type to clear (if not provided, clears all)
   */
  clearHistory(eventType?: string): void {
    if (eventType) {
      this.eventHistory = this.eventHistory.filter(event => event.type !== eventType);
    } else {
      this.eventHistory = [];
    }
  }

  /**
   * Check if an event type has any subscribers
   * @param eventType The event type to check
   */
  hasSubscribers(eventType: string): boolean {
    return Boolean(this.subscriptions.get(eventType)?.length);
  }

  /**
   * Get the number of subscribers for an event type
   * @param eventType The event type to check
   */
  subscriberCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }

  /**
   * List all event types that have subscribers
   */
  listEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get all subscribers for an event type
   * @param eventType The event type to get subscribers for
   */
  getSubscribers(eventType: string): Subscription[] {
    const subs = this.subscriptions.get(eventType) || [];
    return subs.map(sub => ({
      id: sub.id,
      eventType,
      priority: sub.options.priority!,
      unsubscribe: () => this.unsubscribe(eventType, sub.id)
    }));
  }

  /**
   * Create an event group that can be published together
   * @param events Array of event definitions
   */
  createEventGroup(events: Array<{
    type: string;
    data: any;
    options?: PublishOptions;
  }>): {
    publish: (groupOptions?: PublishOptions) => Promise<void>;
    add: (type: string, data: any, options?: PublishOptions) => void;
    remove: (index: number) => void;
    clear: () => void;
  } {
    let eventsList = [...events];
    
    return {
      publish: async (groupOptions?: PublishOptions) => {
        // Apply group options to all events
        const promises = eventsList.map(event => 
          this.publish(
            event.type, 
            event.data, 
            { ...event.options, ...groupOptions }
          )
        );
        
        await Promise.all(promises);
      },
      
      add: (type: string, data: any, options?: PublishOptions) => {
        eventsList.push({ type, data, options });
      },
      
      remove: (index: number) => {
        if (index >= 0 && index < eventsList.length) {
          eventsList.splice(index, 1);
        }
      },
      
      clear: () => {
        eventsList = [];
      }
    };
  }

  /**
   * Reset the event bus to its initial state
   * Clears all subscriptions and history
   */
  reset(): void {
    this.subscriptions.clear();
    this.eventHistory = [];
    this.handlerErrorCount.clear();
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();