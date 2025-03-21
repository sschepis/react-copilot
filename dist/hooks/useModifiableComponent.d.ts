import { UseModifiableComponentReturn } from '../utils/types';
/**
 * Hook for registering a component as modifiable by the LLM
 *
 * @param name - The name of the component
 * @param initialSourceCode - Optional initial source code
 * @returns Object containing ref, componentId, and utility functions
 */
export declare function useModifiableComponent(name: string, initialSourceCode?: string): UseModifiableComponentReturn;
