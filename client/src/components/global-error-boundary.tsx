import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

interface ErrorReport {
  timestamp: string;
  url: string;
  userAgent: string;
  error: {
    name: string;
    message: string;
    stack: string;
  };
  errorInfo: {
    componentStack: string;
  };
  userId?: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack || 'No stack trace available'
      },
      errorInfo: {
        componentStack: errorInfo.componentStack || 'No component stack available'
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary Caught An Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // In production, you might want to send to an error reporting service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(errorReport);
    }
  };

  private reportErrorToService = async (errorReport: ErrorReport) => {
    try {
      // Send error report to backend or external service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport),
        credentials: 'include'
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  private handleGoHome = () => {
    this.retryCount = 0;
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' => {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    // High severity errors
    if (
      errorName.includes('chunkerror') ||
      errorMessage.includes('loading chunk') ||
      errorMessage.includes('unexpected token') ||
      errorMessage.includes('syntax')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout')
    ) {
      return 'medium';
    }

    // Default to medium severity
    return 'medium';
  };

  private getErrorAdvice = (error: Error): string => {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    if (errorName.includes('chunkerror') || errorMessage.includes('loading chunk')) {
      return 'This usually happens after an app update. Please refresh the page to load the latest version.';
    }

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Please check your internet connection and try again.';
    }

    if (errorMessage.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }

    return 'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const severity = error ? this.getErrorSeverity(error) : 'medium';
      const advice = error ? this.getErrorAdvice(error) : 'An unexpected error occurred.';
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-hostel-background flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  severity === 'high' ? 'bg-red-100 text-red-600' :
                  severity === 'medium' ? 'bg-orange-100 text-orange-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                  <CardDescription className="mt-1">
                    {advice}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error ID for support */}
              {this.state.errorId && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    Error ID: <code className="font-mono text-sm">{this.state.errorId}</code>
                    <br />
                    Please include this ID when contacting support.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Technical details (collapsible) */}
              {error && process.env.NODE_ENV === 'development' && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      Show Technical Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="rounded-md bg-muted p-4 text-sm">
                      <div className="font-semibold text-red-600 mb-2">
                        {error.name}: {error.message}
                      </div>
                      {error.stack && (
                        <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground overflow-auto max-h-48">
                          {error.stack}
                        </pre>
                      )}
                      {this.state.errorInfo && (
                        <details className="mt-3">
                          <summary className="cursor-pointer font-semibold text-muted-foreground">
                            Component Stack
                          </summary>
                          <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground mt-2">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook to manually trigger error boundary (for testing or manual error reporting)
export const useErrorBoundary = () => {
  const [, setError] = React.useState<Error | null>(null);

  const triggerError = React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);

  return { triggerError };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};