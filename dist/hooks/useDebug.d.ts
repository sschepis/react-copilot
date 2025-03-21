export interface DebugOptions {
    enabled?: boolean;
    initialVisible?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    width?: number | string;
    height?: number | string;
    shortcutKey?: string;
}
/**
 * Hook for managing the debug panel state
 * Provides controls for toggling visibility and configuring debug options
 */
export declare function useDebug(options?: DebugOptions): {
    isDebugEnabled: boolean;
    isDebugVisible: boolean;
    debugOptions: {
        position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
        width: string | number;
        height: string | number;
    };
    toggleDebugPanel: () => void;
    updateDebugOptions: (newOptions: Partial<{
        position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
        width: string | number;
        height: string | number;
    }>) => void;
};
