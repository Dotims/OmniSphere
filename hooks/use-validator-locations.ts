import {
    resolveValidatorCoordinates,
    type ValidatorCoordinatesMap,
    type ValidatorSummary,
} from "@/services";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const VALIDATOR_LOCATIONS_QUERY_KEY = ["validator-locations"] as const;

// build a unique signature for the set of validators based on their network addresses
function buildLocationSignature(validators: ValidatorSummary[]): string {
  return validators
    .map(
      (validator) =>
        `${validator.iotaAddress}|${validator.netAddress ?? ""}|${validator.p2pAddress ?? ""}|${validator.primaryAddress ?? ""}`,
    )
    .sort()
    .join("||");
}

// custom hook to fetch and cache validator locations based on their network addresses
export function useValidatorLocations(validators: ValidatorSummary[]) {
  const locationSignature = useMemo(
    () => buildLocationSignature(validators),
    [validators],
  );
  return useQuery<ValidatorCoordinatesMap>({
    queryKey: [...VALIDATOR_LOCATIONS_QUERY_KEY, locationSignature],
    queryFn: () => resolveValidatorCoordinates(validators),
    enabled: validators.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 30 * 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
