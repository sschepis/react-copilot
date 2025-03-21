import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentId?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch errors in child components
 * Prevents the entire application from crashing due to errors in modified components
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div 
          style={{
            padding: '16px',
            margin: '8px 0',
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '4px',
            color: '#c53030'
          }}
        >
          <h4 style={{ marginTop: 0 }}>
            Component Error{this.props.componentId ? ` (${this.props.componentId})` : ''}
          </h4>
          <p>
            There was an error rendering this component. 
            Try modifying it again or reverting to a previous version.
          </p>
          <details style={{ marginTop: '8px', cursor: 'pointer' }}>
            <summary>Error details</summary>
            <pre 
              style={{ 
                marginTop: '8px',
                padding: '8px',
                backgroundColor: '#fff',
                border: '1px solid #eee',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.9em'
              }}
            >
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
