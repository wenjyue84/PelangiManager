import { describe, it, expect } from '@jest/globals';
import { 
  createAppError, 
  parseApiError, 
  withErrorHandling, 
  retryWithBackoff,
  ErrorTypes,
  type AppError
} from '../client/src/lib/errorUtils';

describe('Error Handling Utilities', () => {
  describe('createAppError', () => {
    it('should create a basic app error', () => {
      const message = 'Test error message';
      const error = createAppError(message);
      
      expect(error.message).toBe(message);
      expect(error.severity).toBe('medium'); // default
      expect(error.retryable).toBe(true); // default
      expect(error.code).toBeUndefined();
    });

    it('should create an app error with custom options', () => {
      const message = 'Network error';
      const options = {
        code: ErrorTypes.NETWORK_ERROR,
        severity: 'high' as const,
        retryable: false,
        context: { endpoint: '/api/users' },
      };
      
      const error = createAppError(message, options);
      
      expect(error.message).toBe(message);
      expect(error.code).toBe(options.code);
      expect(error.severity).toBe(options.severity);
      expect(error.retryable).toBe(options.retryable);
      expect(error.context).toEqual(options.context);
    });

    it('should preserve original error stack when cause is provided', () => {
      const originalError = new Error('Original error');
      const appError = createAppError('Wrapper error', { cause: originalError });
      
      expect(appError.cause).toBe(originalError);
      expect(appError.stack).toBe(originalError.stack);
    });
  });

  describe('parseApiError', () => {
    it('should parse 400 validation errors', () => {
      const apiError = new Error('400: {"message": "Validation failed", "errors": []}');
      const appError = parseApiError(apiError);
      
      expect(appError.code).toBe(ErrorTypes.VALIDATION_ERROR);
      expect(appError.severity).toBe('low');
      expect(appError.retryable).toBe(false);
      expect(appError.message).toBe('Validation failed');
    });

    it('should parse 401 authorization errors', () => {
      const apiError = new Error('401: {"message": "Unauthorized access"}');
      const appError = parseApiError(apiError);
      
      expect(appError.code).toBe(ErrorTypes.AUTHORIZATION_ERROR);
      expect(appError.severity).toBe('medium');
      expect(appError.retryable).toBe(false);
    });

    it('should parse 404 not found errors', () => {
      const apiError = new Error('404: {"message": "Resource not found"}');
      const appError = parseApiError(apiError);
      
      expect(appError.code).toBe(ErrorTypes.NOT_FOUND_ERROR);
      expect(appError.severity).toBe('low');
      expect(appError.retryable).toBe(false);
    });

    it('should parse 500 server errors', () => {
      const apiError = new Error('500: Internal server error');
      const appError = parseApiError(apiError);
      
      expect(appError.code).toBe(ErrorTypes.SERVER_ERROR);
      expect(appError.severity).toBe('high');
      expect(appError.retryable).toBe(true);
    });

    it('should detect network errors', () => {
      const networkError = new Error('Network request failed');
      const appError = parseApiError(networkError);
      
      expect(appError.code).toBe(ErrorTypes.NETWORK_ERROR);
      expect(appError.severity).toBe('medium');
      expect(appError.retryable).toBe(true);
    });

    it('should detect timeout errors', () => {
      const timeoutError = new Error('Request timeout exceeded');
      const appError = parseApiError(timeoutError);
      
      expect(appError.code).toBe(ErrorTypes.TIMEOUT_ERROR);
      expect(appError.severity).toBe('medium');
      expect(appError.retryable).toBe(true);
    });

    it('should detect chunk loading errors', () => {
      const chunkError = new Error('Loading chunk 5 failed');
      const appError = parseApiError(chunkError);
      
      expect(appError.code).toBe(ErrorTypes.CHUNK_LOAD_ERROR);
      expect(appError.severity).toBe('high');
      expect(appError.retryable).toBe(false);
    });

    it('should handle non-Error objects', () => {
      const unknownError = { message: 'Unknown error type' };
      const appError = parseApiError(unknownError);
      
      expect(appError.message).toBe('An unexpected error occurred');
      expect(appError.severity).toBe('medium');
      expect(appError.context).toEqual({ originalError: unknownError });
    });

    it('should handle malformed JSON in API responses', () => {
      const malformedError = new Error('400: invalid json response}');
      const appError = parseApiError(malformedError);
      
      expect(appError.code).toBe(ErrorTypes.VALIDATION_ERROR);
      expect(appError.message).toBe('invalid json response}');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on successful function execution', async () => {
      const successFn = async (value: string) => `Success: ${value}`;
      const wrappedFn = withErrorHandling(successFn);
      
      const result = await wrappedFn('test');
      expect(result).toBe('Success: test');
    });

    it('should parse and throw AppError on function failure', async () => {
      const failingFn = async () => {
        throw new Error('500: Internal server error');
      };
      const wrappedFn = withErrorHandling(failingFn);
      
      try {
        await wrappedFn();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const appError = error as AppError;
        expect(appError.code).toBe(ErrorTypes.SERVER_ERROR);
        expect(appError.severity).toBe('high');
      }
    });

    it('should call custom error handler instead of throwing', async () => {
      const failingFn = async () => {
        throw new Error('Network error');
      };
      
      let caughtError: AppError | null = null;
      const errorHandler = (error: AppError) => {
        caughtError = error;
      };
      
      const wrappedFn = withErrorHandling(failingFn, errorHandler);
      
      const result = await wrappedFn();
      expect(result).toBeUndefined();
      expect(caughtError).not.toBeNull();
      expect(caughtError?.code).toBe(ErrorTypes.NETWORK_ERROR);
    });
  });

  describe('retryWithBackoff', () => {
    it('should return result on first successful attempt', async () => {
      const successFn = async () => 'success';
      const result = await retryWithBackoff(successFn);
      
      expect(result).toBe('success');
    });

    it('should retry on retryable errors', async () => {
      let attempts = 0;
      const eventualSuccessFn = async () => {
        attempts++;
        if (attempts < 3) {
          throw createAppError('Temporary failure', { retryable: true });
        }
        return 'success after retries';
      };
      
      const result = await retryWithBackoff(eventualSuccessFn, { maxRetries: 3 });
      
      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });

    it('should not retry on non-retryable errors', async () => {
      let attempts = 0;
      const nonRetryableFn = async () => {
        attempts++;
        throw createAppError('Validation error', { retryable: false });
      };
      
      try {
        await retryWithBackoff(nonRetryableFn, { maxRetries: 3 });
        fail('Should have thrown an error');
      } catch (error) {
        expect(attempts).toBe(1); // Should not retry
        expect((error as AppError).retryable).toBe(false);
      }
    });

    it('should respect maxRetries limit', async () => {
      let attempts = 0;
      const alwaysFailsFn = async () => {
        attempts++;
        throw createAppError('Always fails', { retryable: true });
      };
      
      try {
        await retryWithBackoff(alwaysFailsFn, { maxRetries: 2 });
        fail('Should have thrown an error');
      } catch (error) {
        expect(attempts).toBe(3); // Initial attempt + 2 retries
      }
    });

    it('should use exponential backoff delays', async () => {
      const startTime = Date.now();
      let attempts = 0;
      
      const failingFn = async () => {
        attempts++;
        throw createAppError('Always fails', { retryable: true });
      };
      
      try {
        await retryWithBackoff(failingFn, {
          maxRetries: 2,
          baseDelay: 100,
          backoffMultiplier: 2,
        });
      } catch {
        // Expected to fail
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should have waited at least for the delays: 100ms + 200ms = 300ms
      // Allow some tolerance for test execution time
      expect(totalTime).toBeGreaterThan(250);
      expect(attempts).toBe(3);
    });

    it('should respect maxDelay limit', async () => {
      let attempts = 0;
      
      const failingFn = async () => {
        attempts++;
        throw createAppError('Always fails', { retryable: true });
      };
      
      try {
        await retryWithBackoff(failingFn, {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 100, // Max delay is less than base delay
          backoffMultiplier: 2,
        });
      } catch {
        // Expected to fail
      }
      
      expect(attempts).toBe(4); // Initial + 3 retries
    });
  });

  describe('Error Type Constants', () => {
    it('should have all required error types defined', () => {
      expect(ErrorTypes.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorTypes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorTypes.AUTHORIZATION_ERROR).toBe('AUTHORIZATION_ERROR');
      expect(ErrorTypes.NOT_FOUND_ERROR).toBe('NOT_FOUND_ERROR');
      expect(ErrorTypes.SERVER_ERROR).toBe('SERVER_ERROR');
      expect(ErrorTypes.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
      expect(ErrorTypes.CHUNK_LOAD_ERROR).toBe('CHUNK_LOAD_ERROR');
    });
  });

  describe('Error Severity Classification', () => {
    it('should classify network errors as medium severity', () => {
      const error = parseApiError(new Error('Network connection failed'));
      expect(error.severity).toBe('medium');
    });

    it('should classify validation errors as low severity', () => {
      const error = parseApiError(new Error('400: Validation failed'));
      expect(error.severity).toBe('low');
    });

    it('should classify server errors as high severity', () => {
      const error = parseApiError(new Error('500: Internal server error'));
      expect(error.severity).toBe('high');
    });

    it('should classify chunk loading errors as high severity', () => {
      const error = parseApiError(new Error('Loading chunk failed'));
      expect(error.severity).toBe('high');
    });
  });

  describe('Error Context Preservation', () => {
    it('should preserve context information in parsed errors', () => {
      const apiError = new Error('404: {"message": "User not found"}');
      const appError = parseApiError(apiError);
      
      expect(appError.context).toBeDefined();
      expect(appError.context?.status).toBe(404);
      expect(appError.context?.response).toEqual({ message: "User not found" });
    });

    it('should preserve original error in context for unknown errors', () => {
      const originalError = new Error('Unknown error');
      const appError = parseApiError(originalError);
      
      expect(appError.context?.originalError).toBe(originalError);
    });
  });
});