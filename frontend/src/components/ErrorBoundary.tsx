import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Store error info for display
    this.setState({ errorInfo });
    
    // Send to error tracking service (e.g., Sentry) in production
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      // TODO: Integrate with Sentry
      // Sentry.captureException(error, {
      //   contexts: { react: { componentStack: errorInfo.componentStack } }
      // });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Allow custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-strong rounded-2xl p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-white/60 mb-6">
              {import.meta.env.DEV 
                ? this.state.error?.message || "An unexpected error occurred"
                : "We're working on fixing this issue. Please try refreshing the page."}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 glass text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/80 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </div>
            
            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-white/40 cursor-pointer hover:text-white/60">
                  Error Details (Dev Mode Only)
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="p-3 bg-black/30 rounded-lg">
                    <p className="text-xs text-white/40 mb-1">Error Message:</p>
                    <p className="text-sm text-red-400">{this.state.error.message}</p>
                  </div>
                  {this.state.error.stack && (
                    <div className="p-3 bg-black/30 rounded-lg">
                      <p className="text-xs text-white/40 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-red-400 overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="p-3 bg-black/30 rounded-lg">
                      <p className="text-xs text-white/40 mb-1">Component Stack:</p>
                      <pre className="text-xs text-orange-400 overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
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

// Higher-order component for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
