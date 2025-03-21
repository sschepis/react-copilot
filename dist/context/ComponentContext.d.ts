import React, { ReactNode } from 'react';
import { ComponentContextValue } from '../utils/types';
export declare const ComponentContext: React.Context<ComponentContextValue | null>;
interface ComponentContextProviderProps {
    children: ReactNode;
}
export declare const ComponentContextProvider: React.FC<ComponentContextProviderProps>;
export declare const useComponentContext: () => ComponentContextValue;
export {};
