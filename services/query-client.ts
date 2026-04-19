import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Aggressive caching defaults for crypto data
        staleTime: 60 * 1000,           // 1 minute
        gcTime: 10 * 60 * 1000,         // 10 minutes
        refetchOnWindowFocus: false,
        retry: 2,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
