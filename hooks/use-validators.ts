import {
  fetchValidators,
  type ValidatorsResponse,
} from "@/services/validators";
import { useQuery } from "@tanstack/react-query";

export const VALIDATORS_QUERY_KEY = ["validators"] as const;

/**
 * Fetches live validator and system-state data from the IOTA RPC proxy.
 *
 * - Refreshes every 30 seconds automatically (background + foreground).
 * - Exposes isError / error so callers can render graceful error states.
 */
export function useValidators() {
  return useQuery<ValidatorsResponse, Error>({
    queryKey: VALIDATORS_QUERY_KEY,
    queryFn: async () => {
      const result = await fetchValidators();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data;
    },
    staleTime: 30 * 1000,           // 30 s — data stays fresh for one refresh cycle
    gcTime: 30 * 60 * 1000,         // 30 min in cache
    refetchInterval: 30 * 1000,     // auto-refresh every 30 s
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15_000),
  });
}
