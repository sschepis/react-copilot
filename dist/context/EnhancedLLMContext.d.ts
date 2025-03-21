import React, { ReactNode } from 'react';
import { LLMConfig, Permissions, AutonomousConfig, LLMContextValue, StateAdapter } from '../utils/types';
export declare const EnhancedLLMContext: React.Context<LLMContextValue | null>;
interface EnhancedLLMProviderProps {
    config: LLMConfig;
    permissions?: Partial<Permissions>;
    autonomousMode?: Partial<AutonomousConfig>;
    stateAdapters?: StateAdapter[];
    children: ReactNode;
}
export declare const EnhancedLLMProvider: React.FC<EnhancedLLMProviderProps>;
export declare const useEnhancedLLMContext: () => LLMContextValue;
export {};
