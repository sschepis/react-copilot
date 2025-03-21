/**
 * Type for event handler functions
 */
export type EventHandler = (data: any) => void;
/**
 * Simple event emitter implementation to provide pub/sub functionality
 */
export declare class EventEmitter {
    private eventHandlers;
    /**
     * Register an event handler
     * @param eventName The event to listen for
     * @param handler The handler function to call when the event is emitted
     */
    on(eventName: string, handler: EventHandler): void;
    /**
     * Remove an event handler
     * @param eventName The event to stop listening for
     * @param handler The handler function to remove
     */
    off(eventName: string, handler: EventHandler): void;
    /**
     * Register a one-time event handler
     * @param eventName The event to listen for once
     * @param handler The handler function to call when the event is emitted
     */
    once(eventName: string, handler: EventHandler): void;
    /**
     * Emit an event with data
     * @param eventName The event to emit
     * @param data The data to pass to handlers
     */
    emit(eventName: string, data?: any): void;
    /**
     * Remove all event handlers
     * @param eventName Optional event name to remove handlers for. If not provided, removes all handlers for all events.
     */
    removeAllListeners(eventName?: string): void;
    /**
     * Get the number of listeners for an event
     * @param eventName The event to check
     */
    listenerCount(eventName: string): number;
}
