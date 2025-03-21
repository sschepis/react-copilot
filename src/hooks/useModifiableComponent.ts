import { useRef, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { UseModifiableComponentReturn, ComponentVersion } from '../utils/types';
import { useComponentContext } from '../context/ComponentContext';

/**
 * Hook for registering a component as modifiable by the LLM
 *
 * @param name - The name of the component
 * @param initialSourceCode - Optional initial source code
 * @returns Object containing ref, componentId, and utility functions
 */
export function useModifiableComponent(
  name: string,
  initialSourceCode?: string
): UseModifiableComponentReturn {
  // Create a ref for the component
  const ref = useRef<HTMLDivElement>(null);
  
  // Create a unique ID for the component
  const componentId = useRef<string>(nanoid()).current;
  
  // Get the component context
  const {
    registerComponent,
    unregisterComponent,
    updateComponent,
    getComponentVersions,
    revertToVersion: contextRevertToVersion
  } = useComponentContext();
  
  // Register the component when mounted
  useEffect(() => {
    registerComponent({
      id: componentId,
      name,
      ref,
      sourceCode: initialSourceCode,
    });
    
    // Unregister the component when unmounted
    return () => {
      unregisterComponent(componentId);
    };
  }, [componentId, name, initialSourceCode, registerComponent, unregisterComponent]);
  
  // Function to update the source code
  const registerSourceCode = useCallback(
    (sourceCode: string) => {
      updateComponent(componentId, { sourceCode });
    },
    [componentId, updateComponent]
  );
  
  // Function to get version history
  const getVersionHistory = useCallback(
    (): ComponentVersion[] => {
      return getComponentVersions?.(componentId) || [];
    },
    [componentId, getComponentVersions]
  );
  
  // Function to revert to a specific version
  const revertToVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (contextRevertToVersion) {
        return await contextRevertToVersion(componentId, versionId);
      }
      return false;
    },
    [componentId, contextRevertToVersion]
  );
  
  return {
    ref,
    componentId,
    registerSourceCode,
    getVersionHistory,
    revertToVersion,
  };
}
