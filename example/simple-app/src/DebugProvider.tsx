import React, { useState } from 'react';
import { LLMProvider, ModifiableApp, ChatOverlay, DebugPanel } from '../../../src';

interface DebugProviderProps {
  children: React.ReactNode;
  initialVisible?: boolean;
  debugPanelPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  width?: number | string;
  height?: number | string;
  apiKey?: string;
  provider?: 'openai' | 'anthropic' | 'deepseek';
  model?: string;
}

/**
 * Provider component that wraps children with ModifiableApp and adds the Debug Panel
 * This is a convenience wrapper to simplify adding debugging to an app
 */
export const DebugProvider: React.FC<DebugProviderProps> = ({
  children,
  initialVisible = false,
  debugPanelPosition = 'bottom-right',
  width = 600,
  height = 500,
  apiKey = process.env.REACT_APP_LLM_API_KEY || '',
  provider = (process.env.REACT_APP_LLM_PROVIDER as 'openai' | 'anthropic' | 'deepseek') || 'openai',
  model = process.env.REACT_APP_LLM_MODEL || 'gpt-4'
}) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // LLM configuration
  const llmConfig = {
    provider,
    apiKey,
    model,
  };
  
  return (
    <LLMProvider config={llmConfig}>
      <ModifiableApp>
        {children}
      </ModifiableApp>
      
      {/* Toggle theme button - positioned in the top-right corner */}
      <button
        className="theme-toggle"
        onClick={() => setTheme(current => current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light')}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          background: theme === 'dark' ? '#fff' : theme === 'light' ? '#333' : '#6c63ff',
          color: theme === 'dark' ? '#333' : '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
        aria-label={`Switch theme (current: ${theme})`}
      >
        {theme === 'dark' ? '☀️' : theme === 'light' ? '🌙' : '🔄'}
      </button>
      
      {/* Debug Panel */}
      <DebugPanel
        initialVisible={initialVisible}
        position={debugPanelPosition}
        width={width}
        height={height}
        theme={theme}
      />
      
      {/* Chat Overlay */}
      <ChatOverlay position={debugPanelPosition} />
    </LLMProvider>
  );
};

export default DebugProvider;