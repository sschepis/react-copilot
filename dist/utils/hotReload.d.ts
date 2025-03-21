/**
 * Hot reloads a component with new code
 *
 * @param id - Component ID
 * @param oldCode - Original component code
 * @param newCode - Updated component code
 * @returns Transpiled component
 */
export declare function hotReloadComponent(id: string, oldCode: string, newCode: string): Promise<{
    success: boolean;
    component?: any;
    error?: string;
}>;
/**
 * Applies a component update to the DOM
 * This is a placeholder implementation
 *
 * @param id - Component ID
 * @param component - The updated component
 * @param ref - Reference to the DOM element
 */
export declare function applyComponentUpdate(id: string, component: any, ref: React.RefObject<HTMLElement>): void;
