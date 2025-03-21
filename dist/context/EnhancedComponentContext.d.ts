import React, { ReactNode } from 'react';
import { ComponentContextValue, Permissions } from '../utils/types';
export declare const EnhancedComponentContext: React.Context<ComponentContextValue | null>;
export interface EnhancedComponentContextValue extends ComponentContextValue {
    getRelatedStateKeys: (componentId: string) => string[];
    visualizeComponentGraph: () => any;
}
interface EnhancedComponentContextProviderProps {
    children: ReactNode;
    permissions?: Partial<Permissions>;
}
export declare const EnhancedComponentContextProvider: React.FC<EnhancedComponentContextProviderProps>;
export declare const useEnhancedComponentContext: () => ComponentContextValue;
export declare const useFullEnhancedComponentContext: () => EnhancedComponentContextValue;
export {};
