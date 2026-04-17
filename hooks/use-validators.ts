import { fetchValidators, type ValidatorsResponse } from '@/services/validators';
import { useQuery } from '@tanstack/react-query';

export const VALIDATORS_QUERY_KEY = ['validators'] as const;

export function useValidators() {
  return useQuery<ValidatorsResponse>({
    queryKey: VALIDATORS_QUERY_KEY,
    queryFn: async () => {
      const result = await fetchValidators();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    staleTime: 5 * 60 * 1000,       // 5 minutes
    gcTime: 30 * 60 * 1000,          // 30 minutes in cache
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
