import type { ValidatorCoordinatesMap } from "@/services/validator-location";
import type { ValidatorSummary } from "@/services/validators";

export interface GlobeViewProps {
  validators: ValidatorSummary[];
  coordinatesById?: ValidatorCoordinatesMap;
  onSelectValidator?: (id: string | null) => void;
}

/** Payload shape sent to the WebView for each validator marker. */
export interface ValidatorMarkerPayload {
  id: string;
  name: string;
  lat: number;
  lon: number;
  stakeNorm: number;
}
