import React, { useEffect, ReactNode } from 'react';
import { useModifiableComponent } from '../hooks/useModifiableComponent';
import { ErrorBoundary } from './ErrorBoundary';

interface ModifiableComponentProps {
  name: string;
  initialSourceCode?: string;
  children: ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Wrapper component that makes its children modifiable by the LLM
 */
export const ModifiableComponent: React.FC<ModifiableComponentProps> = ({
  name,
  initialSourceCode,
  children,
  onError
}) => {
  // Register the component
  const { ref, componentId, registerSourceCode } = useModifiableComponent(
    name,
    initialSourceCode
  );
  
  // Register the source code if provided
  useEffect(() => {
    if (initialSourceCode) {
      registerSourceCode(initialSourceCode);
    }
  }, [initialSourceCode, registerSourceCode]);
  
  return (
    <ErrorBoundary
      componentId={componentId}
      onError={onError ? error => onError(error) : undefined}
    >
      <div ref={ref} data-component-id={componentId} data-component-name={name}>
        {children}
      </div>
    </ErrorBoundary>
  );
};
