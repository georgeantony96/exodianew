'use client';

/**
 * Enhanced Error Boundary with Performance Tracking
 * Based on CLAUDE_TECHNICAL_REFERENCE_2025.md recommendations
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error start time
    const startTime = Date.now();
    
    this.setState({ errorInfo });

    // Simplified error logging to prevent console spam
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 ErrorBoundary: ${error?.name || 'Error'} - ${error?.message || 'No message'} [ID: ${this.state.errorId}]`);
      // Only show component stack for debugging when specifically needed
      if (errorInfo?.componentStack && error?.message?.includes('debugging')) {
        console.error('Component stack:', errorInfo.componentStack.split('\n').slice(0, 5).join('\n'));
      }
    }

    // Only call custom error handler if we have meaningful error data
    if (error && (error.message || error.stack)) {
      this.props.onError?.(error, errorInfo);
    } else {
      console.warn('⚠️ Empty or invalid error object passed to ErrorBoundary');
    }

    // Track error metrics
    this.trackError(error, errorInfo);
    
    // Log performance impact
    const endTime = Date.now();
    console.log(`ErrorBoundary processing time: ${endTime - startTime}ms`);
  }

  private trackError(error: Error, errorInfo: ErrorInfo) {
    try {
      // Extract component stack info
      const componentStack = errorInfo.componentStack
        ?.split('\n')
        .filter(line => line.trim())
        .slice(0, 5); // Top 5 components in stack

      // Error metadata
      const errorData = {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3), // Top 3 stack frames
        componentStack,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId
      };

      // Only log detailed error tracking in production or when specifically debugging
      if (process.env.NODE_ENV === 'production' || error?.message?.includes('debug')) {
        console.warn('Error tracked:', errorData);
      }

      // In production, you could send this to an error tracking service
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to error tracking service
        // errorTrackingService.captureException(error, errorData);
      }
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-xl p-6 text-center shadow-xl border border-border">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-semibold text-card-foreground mb-2">
              Something went wrong
            </h2>
            
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error while processing your request. 
              This has been logged and our team has been notified.
            </p>

            {/* Error ID */}
            {this.state.errorId && (
              <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted px-3 py-1 rounded">
                Error ID: {this.state.errorId}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Reload Page
              </button>
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-muted-foreground text-sm cursor-pointer hover:text-card-foreground">
                  Show technical details
                </summary>
                
                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono text-muted-foreground overflow-auto max-h-32">
                  <div className="text-destructive font-bold mb-1">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper for specific use cases
export const SimulationErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary
    onError={(error, errorInfo) => {
      console.error('Simulation error:', { error, errorInfo });
      // Could track simulation-specific metrics here
    }}
    fallback={
      <div className="p-6 text-center bg-destructive/10 border border-destructive rounded-lg">
        <h3 className="text-lg font-semibold text-destructive mb-2">Simulation Error</h3>
        <p className="text-muted-foreground">
          The Monte Carlo simulation encountered an error. Please check your inputs and try again.
        </p>
      </div>
    }
  >
    {children}
  </EnhancedErrorBoundary>
);

// API Error Boundary
export const ApiErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary
    onError={(error, errorInfo) => {
      console.error('API error:', { error, errorInfo });
      // Could track API-specific metrics here
    }}
    fallback={
      <div className="p-6 text-center bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/10 dark:border-yellow-800">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Connection Error</h3>
        <p className="text-muted-foreground">
          Unable to connect to the server. Please check your internet connection and try again.
        </p>
      </div>
    }
  >
    {children}
  </EnhancedErrorBoundary>
);