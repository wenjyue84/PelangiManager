import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { usePageVisibility } from './usePageVisibility';

interface VisibilityQueryOptions<TData> extends Omit<UseQueryOptions<TData>, 'enabled'> {
  enabled?: boolean;
  pauseWhenHidden?: boolean;
  refetchIntervalWhenVisible?: number | false;
}

/**
 * Custom hook that wraps useQuery with visibility-aware behavior
 * Automatically pauses queries when the tab is hidden and resumes when visible
 */
export function useVisibilityQuery<TData = unknown>(
  options: VisibilityQueryOptions<TData>
): UseQueryResult<TData> {
  const isVisible = usePageVisibility();
  
  const {
    enabled = true,
    pauseWhenHidden = true,
    refetchIntervalWhenVisible = false,
    refetchInterval,
    ...restOptions
  } = options;

  // Determine if query should be enabled based on visibility
  const queryEnabled = pauseWhenHidden ? (enabled && isVisible) : enabled;
  
  // Use refetch interval only when visible
  const activeRefetchInterval = isVisible ? (refetchIntervalWhenVisible || refetchInterval) : false;

  return useQuery({
    ...restOptions,
    enabled: queryEnabled,
    refetchInterval: activeRefetchInterval,
  });
}