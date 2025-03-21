/**
 * Type for event handler functions
 */
export type EventHandler = (data: any) => void;

/**
 * Simple event emitter implementation to provide pub/sub functionality
 */
export class EventEmitter {
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Register an event handler
   * @param eventName The event to listen for
   * @param handler The handler function to call when the event is emitted
   */
  on(eventName: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)!.add(handler);
  }

  /**
   * Remove an event handler
   * @param eventName The event to stop listening for
   * @param handler The handler function to remove
   */
  off(eventName: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventName);
      }
    }
  }

  /**
   * Register a one-time event handler
   * @param eventName The event to listen for once
   * @param handler The handler function to call when the event is emitted
   */
  once(eventName: string, handler: EventHandler): void {
    const onceHandler = (data: any) => {
      this.off(eventName, onceHandler);
      handler(data);
    };
    this.on(eventName, onceHandler);
  }

  /**
   * Emit an event with data
   * @param eventName The event to emit
   * @param data The data to pass to handlers
   */
  emit(eventName: string, data: any = {}): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${eventName}":`, error);
        }
      });
    }
  }

  /**
   * Remove all event handlers
   * @param eventName Optional event name to remove handlers for. If not provided, removes all handlers for all events.
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.eventHandlers.delete(eventName);
    } else {
      this.eventHandlers.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param eventName The event to check
   */
  listenerCount(eventName: string): number {
    const handlers = this.eventHandlers.get(eventName);
    return handlers ? handlers.size : 0;
  }
}