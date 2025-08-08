/**
 * Error handling utilities to work with the global error boundary
 */

export interface AppError extends Error {
  code?: string;
  severity?: 'low' | 'medium' | 'high';
  context?: Record<string, any>;
  retryable?: boolean;
}

/**
 * Creates a standardized application error
 */
export const createAppError = (
  message: string,
  options: {
    code?: string;
    severity?: 'low' | 'medium' | 'high';
    context?: Record<string, any>;
    retryable?: boolean;
    cause?: Error;
  } = {}
): AppError => {
  const error = new Error(message) as AppError;
  error.code = options.code;
  error.severity = options.severity || 'medium';
  error.context = options.context;
  error.retryable = options.retryable !== false; // Default to retryable
  
  if (options.cause) {
    error.cause = options.cause;
    error.stack = options.cause.stack;
  }
  
  return error;
};

/**
 * Error types for common scenarios
 */
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CHUNK_LOAD_ERROR: 'CHUNK_LOAD_ERROR',
} as const;

/**
 * Parses fetch/API errors and converts them to AppErrors
 */
export const parseApiError = (error: unknown): AppError => {
  if (error instanceof Error) {
    const message = error.message;
    
    // Parse HTTP error responses
    if (message.includes(': ')) {
      const [statusCode, responseText] = message.split(': ', 2);
      const status = parseInt(statusCode);
      
      if (status >= 400 && status < 500) {
        // Client errors
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch {
          parsedResponse = { message: responseText };
        }
        
        return createAppError(parsedResponse.message || 'Request failed', {
          code: status === 400 ? ErrorTypes.VALIDATION_ERROR :
                status === 401 || status === 403 ? ErrorTypes.AUTHORIZATION_ERROR :
                status === 404 ? ErrorTypes.NOT_FOUND_ERROR : 'CLIENT_ERROR',
          severity: status === 400 ? 'low' : status === 404 ? 'low' : 'medium',
          context: { status, response: parsedResponse },
          retryable: false,
        });
      }
      
      if (status >= 500) {
        // Server errors
        return createAppError('Server error occurred', {
          code: ErrorTypes.SERVER_ERROR,
          severity: 'high',
          context: { status, response: responseText },
          retryable: true,
        });
      }
    }
    
    // Handle network errors
    if (message.toLowerCase().includes('network') || 
        message.toLowerCase().includes('fetch') ||
        message.toLowerCase().includes('connection')) {
      return createAppError('Network connection failed', {
        code: ErrorTypes.NETWORK_ERROR,
        severity: 'medium',
        retryable: true,
        cause: error,
      });
    }
    
    // Handle timeout errors
    if (message.toLowerCase().includes('timeout')) {
      return createAppError('Request timed out', {
        code: ErrorTypes.TIMEOUT_ERROR,
        severity: 'medium',
        retryable: true,
        cause: error,
      });
    }
    
    // Handle chunk loading errors (common after deployments)
    if (message.toLowerCase().includes('loading chunk') ||
        message.toLowerCase().includes('chunkerror')) {
      return createAppError('Application update detected', {
        code: ErrorTypes.CHUNK_LOAD_ERROR,
        severity: 'high',
        retryable: false,
        cause: error,
      });
    }
  }
  
  // Generic error fallback
  return createAppError('An unexpected error occurred', {
    severity: 'medium',
    context: { originalError: error },
    cause: error instanceof Error ? error : undefined,
  });
};

/**
 * Async error handler wrapper
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler?: (error: AppError) => void
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = parseApiError(error);
      
      if (errorHandler) {
        errorHandler(appError);
      } else {
        throw appError;
      }
    }
  }) as T;
};

/**
 * Retry utility with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2
  } = options;
  
  let lastError: AppError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = parseApiError(error);
      
      // Don't retry if error is not retryable
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Error boundary test utilities (for development/testing)
 */
export const errorBoundaryTests = {
  throwSyncError: () => {
    throw createAppError('Test synchronous error', {
      code: 'TEST_ERROR',
      severity: 'low',
    });
  },
  
  throwAsyncError: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw createAppError('Test asynchronous error', {
      code: 'TEST_ASYNC_ERROR',
      severity: 'medium',
    });
  },
  
  throwNetworkError: () => {
    throw createAppError('Simulated network error', {
      code: ErrorTypes.NETWORK_ERROR,
      severity: 'medium',
      retryable: true,
    });
  },
  
  throwChunkError: () => {
    const error = new Error('Loading chunk 5 failed.');
    error.name = 'ChunkLoadError';
    throw error;
  },
};

/**
 * Error reporting utility
 */
export const reportError = async (error: AppError, context?: Record<string, any>) => {
  const errorReport = {
    timestamp: new Date().toISOString(),
    message: error.message,
    code: error.code,
    severity: error.severity,
    stack: error.stack,
    context: {
      ...error.context,
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Report:', errorReport);
  }
  
  // Send to error reporting service in production
  if (process.env.NODE_ENV === 'production') {
    try {
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
  }
};