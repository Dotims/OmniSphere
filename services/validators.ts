import { apiFetch, type ApiResult } from "./api/client";

// types
export interface ValidatorApy {
  address: string;
  apy: number;
}

export interface ValidatorApyResponse {
  apys: ValidatorApy[];
  epoch: string;
}

export interface ValidatorSummary {
  iotaAddress: string;
  netAddress?: string | null;
  p2pAddress?: string | null;
  primaryAddress?: string | null;
  name: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  stakingPoolIotaBalance: string;
  commissionRate: number;
  nextEpochStake: string;
  nextEpochCommissionRate: number;
  nextEpochGasPrice: string;
  votingPower: string;
}

export interface SystemState {
  epoch: string;
  activeValidators: ValidatorSummary[];
  totalStake: string;
  storageFundTotalObjectStorageRebates: string;
  referenceGasPrice: string;
  /** Epoch start time (ms since Unix epoch) — from RPC V2 envelope */
  epochStartTimestampMs?: string;
  /** Epoch duration (ms) — from RPC V2 envelope */
  epochDurationMs?: string;
}

export interface ValidatorsResponse {
  systemState: SystemState;
  apys: ValidatorApyResponse;
}

//  service function
export async function fetchValidators(): Promise<
  ApiResult<ValidatorsResponse>
> {
  return apiFetch<ValidatorsResponse>("/api/validators");
}
