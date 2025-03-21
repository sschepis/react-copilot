import React, { ReactNode } from 'react';
interface ModifiableComponentProps {
    name: string;
    initialSourceCode?: string;
    children: ReactNode;
    onError?: (error: Error) => void;
}
/**
 * Wrapper component that makes its children modifiable by the LLM
 */
export declare const ModifiableComponent: React.FC<ModifiableComponentProps>;
export {};
