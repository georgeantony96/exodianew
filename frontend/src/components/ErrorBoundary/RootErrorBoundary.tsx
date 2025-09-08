'use client';

import { EnhancedErrorBoundary } from './EnhancedErrorBoundary';

interface RootErrorBoundaryProps {
  children: React.ReactNode;
}

export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary
      onError={(error, errorInfo) => {
        // Simplified, single-line error logging to avoid console spam
        if (process.env.NODE_ENV === 'development') {
          console.error(`🚨 Root Error: ${error?.name || 'Unknown'}: ${error?.message || 'No message'}`);
          // Only show full details in development when needed
          if (error?.stack) {
            console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
          }
        }
        
        // Global error tracking could go here
        // In production, this could send to error tracking service
      }}
    >
      {children}
    </EnhancedErrorBoundary>
  );
}