import React, { ReactNode } from 'react';
import { LLMConfig, Permissions, AutonomousConfig, LLMContextValue } from '../utils/types';
export declare const LLMContext: React.Context<LLMContextValue | null>;
interface LLMProviderContextProps {
    config: LLMConfig;
    permissions?: Partial<Permissions>;
    autonomousMode?: Partial<AutonomousConfig>;
    children: ReactNode;
}
export declare const LLMContextProvider: React.FC<LLMProviderContextProps>;
export declare const useLLMContext: () => LLMContextValue;
export {};
