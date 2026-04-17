// maps validator data to 3D pins on the globe surface
// uses deterministic hashing so pins always appear in the same place

import React, { useMemo } from 'react';
import { hashToSphereArray } from '@/utils/spherical-hash';
import type { ValidatorSummary } from '@/services/validators';
import ValidatorPin from './ValidatorPin';

interface ValidatorPinsProps {
  validators: ValidatorSummary[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// format IOTA balance from raw string (nanos) to readable
function formatStake(raw: string): string {
  const nano = BigInt(raw);
  const iota = Number(nano) / 1_000_000_000;

  if (iota >= 1_000_000) {
    return `${(iota / 1_000_000).toFixed(1)}M IOTA`;
  }
  if (iota >= 1_000) {
    return `${(iota / 1_000).toFixed(1)}K IOTA`;
  }
  return `${iota.toFixed(0)} IOTA`;
}

export default function ValidatorPins({ validators, selectedId, onSelect }: ValidatorPinsProps) {
  // memoize positions so they don't recompute every frame
  const pinData = useMemo(
    () =>
      validators.map((v) => ({
        id: v.iotaAddress,
        name: v.name || v.iotaAddress.slice(0, 12),
        stake: formatStake(v.stakingPoolIotaBalance),
        position: hashToSphereArray(v.iotaAddress, 1.02),
      })),
    [validators],
  );

  return (
    <group>
      {pinData.map((pin, i) => (
        <ValidatorPin
          key={pin.id}
          position={pin.position}
          validatorId={pin.id}
          name={pin.name}
          stake={pin.stake}
          index={i}
          onSelect={onSelect}
          isSelected={selectedId === pin.id}
        />
      ))}
    </group>
  );
}

export { formatStake };
