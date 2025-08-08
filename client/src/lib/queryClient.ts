import { QueryClient, QueryFunction, focusManager } from "@tanstack/react-query";
import { getQueryConfig } from "./queryConfig";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {})
  };
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = getAuthHeaders();
    
    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Configure focus manager to use Page Visibility API
focusManager.setEventListener((handleFocus) => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      handleFocus();
    }
  };
  
  const handleWindowFocus = () => {
    handleFocus();
  };

  // Listen to visibility change
  document.addEventListener('visibilitychange', handleVisibilityChange, false);
  
  // Also listen to focus for better browser compatibility
  window.addEventListener('focus', handleWindowFocus, false);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
  };
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Dynamic configuration based on query key
      staleTime: 5 * 60 * 1000, // Default: 5 minutes
      gcTime: 30 * 60 * 1000,   // Default: 30 minutes cache time
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: false,
      refetchOnReconnect: true,
      retry: false,
    },
    mutations: {
      retry: false,
      gcTime: 5 * 60 * 1000, // Keep mutation results for 5 minutes
    },
  },
});

// Override default query behavior with endpoint-specific configurations
const originalQuery = queryClient.defaultQueryOptions;
queryClient.setQueryDefaults = function(queryKey: unknown[], options: any) {
  const config = getQueryConfig(queryKey);
  return queryClient.setQueryDefaults(queryKey, {
    ...config,
    ...options,
  });
};
