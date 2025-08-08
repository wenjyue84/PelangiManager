import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { getQueryConfig } from '@/lib/queryConfig';

/**
 * Custom hook that applies smart query configurations automatically
 * Uses endpoint-based caching strategies without manual configuration
 */
export function useConfiguredQuery<TData = unknown>(
  queryKey: unknown[],
  options?: Omit<UseQueryOptions<TData>, 'queryKey'>
): UseQueryResult<TData> {
  // Get the appropriate configuration based on endpoint
  const smartConfig = getQueryConfig(queryKey);
  
  return useQuery<TData>({
    queryKey,
    ...smartConfig,
    ...options, // Allow custom overrides
  } as UseQueryOptions<TData>);
}