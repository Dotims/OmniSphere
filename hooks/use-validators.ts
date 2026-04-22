import {
  fetchValidators,
  type ValidatorsResponse,
} from "@/services/validators";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/use-settings";

export const VALIDATORS_QUERY_KEY = ["validators"] as const;

export function useValidators() {
  const { refreshInterval } = useSettings();

  return useQuery<ValidatorsResponse, Error>({
    queryKey: VALIDATORS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const result = await fetchValidators({ signal });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    staleTime: refreshInterval,
    gcTime: 30 * 60 * 1000,
    refetchInterval: refreshInterval,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15_000),
  });
}
