import { useState, useCallback, useEffect } from 'react';

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
export function useDebug(options: DebugOptions = {}) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    initialVisible = false,
    position = 'bottom-right',
    width = 400,
    height = 500,
    shortcutKey = 'd',
  } = options;
  
  const [isVisible, setVisible] = useState(initialVisible && enabled);
  const [debugOptions, setDebugOptions] = useState({
    position,
    width,
    height,
  });
  
  // Toggle debug panel visibility
  const toggleDebugPanel = useCallback(() => {
    if (enabled) {
      setVisible(prev => !prev);
    }
  }, [enabled]);
  
  // Update debug panel options
  const updateDebugOptions = useCallback((newOptions: Partial<typeof debugOptions>) => {
    setDebugOptions(prev => ({
      ...prev,
      ...newOptions,
    }));
  }, []);
  
  // Toggle with keyboard shortcut (Alt+{shortcutKey})
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === shortcutKey) {
        toggleDebugPanel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, toggleDebugPanel, shortcutKey]);
  
  return {
    isDebugEnabled: enabled,
    isDebugVisible: isVisible && enabled,
    debugOptions,
    toggleDebugPanel,
    updateDebugOptions,
  };
}