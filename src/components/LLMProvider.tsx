import React from 'react';
import { LLMProviderProps } from '../utils/types';
import { LLMContextProvider } from '../context/LLMContext';
import { ComponentContextProvider } from '../context/ComponentContext';

/**
 * Main provider component for the LLM UI integration
 * Provides LLM configuration and component registry contexts
 */
export const LLMProvider: React.FC<LLMProviderProps> = ({
  config,
  permissions,
  autonomousMode,
  children
}) => {
  return (
    <LLMContextProvider
      config={config}
      permissions={permissions}
      autonomousMode={autonomousMode}
    >
      <ComponentContextProvider>
        {children}
      </ComponentContextProvider>
    </LLMContextProvider>
  );
};
