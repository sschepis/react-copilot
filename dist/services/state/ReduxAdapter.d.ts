import { BaseStateAdapter } from './StateAdapter';
/**
 * State adapter for Redux state management
 */
export declare class ReduxAdapter extends BaseStateAdapter {
    type: "redux";
    private store;
    private actionCreators;
    private unsubscribeFromStore;
    /**
     * Create a new Redux adapter
     * @param store Redux store instance
     * @param actionCreators Object mapping action names to action creator functions
     */
    constructor(store: any, actionCreators?: Record<string, Function>);
    /**
     * Get the entire Redux state tree
     */
    getState(): any;
    /**
     * Get a specific slice of the Redux state by path
     * @param path Path to the state slice (e.g., 'user.profile.name')
     */
    getStateSlice(path: string): any;
    /**
     * Subscribe to Redux state changes
     * @param callback Function called when state changes
     * @returns Unsubscribe function
     */
    subscribeToChanges(callback: (state: any) => void): () => void;
    /**
     * Get all registered Redux action creators
     * @returns Record of action names and their creator functions
     */
    getActions(): Record<string, Function>;
    /**
     * Execute a Redux action by name with optional payload
     * @param name Name of the action to execute
     * @param payload Optional data to pass to the action creator
     * @throws Error if action creator not found
     */
    executeAction(name: string, payload?: any): Promise<void>;
    /**
     * Directly modify Redux state using a reducer action
     * @param path Path to the state to modify
     * @param value New value to set
     */
    modifyState(path: string, value: any): Promise<void>;
    /**
     * Register new action creators
     * @param actionCreators Action creators to register
     */
    registerActionCreators(actionCreators: Record<string, Function>): void;
    /**
     * Clean up the adapter
     */
    destroy(): void;
}
