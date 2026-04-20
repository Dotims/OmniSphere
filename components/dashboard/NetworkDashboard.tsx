/**
 * NetworkDashboard — Web3-styled network health summary.
 *
 * Transparent card fills, ultra-thin borders, vibrant blue accents,
 * uppercase muted labels, large bold white values.
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  FontSize,
  FontWeight,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import type { SystemState, ValidatorApy } from "@/services/validators";

interface NetworkDashboardProps {
  systemState: SystemState;
  apys: ValidatorApy[];
}

// ── Formatters ──────────────────────────────────────────────

function formatIota(raw: string | undefined | null): string {
  if (!raw || raw === "0") return "0";
  try {
    const iota = Number(BigInt(raw)) / 1_000_000_000;
    if (iota >= 1_000_000_000) return `${(iota / 1_000_000_000).toFixed(2)}B`;
    if (iota >= 1_000_000) return `${(iota / 1_000_000).toFixed(1)}M`;
    if (iota >= 1_000) return `${(iota / 1_000).toFixed(1)}K`;
    return iota.toFixed(0);
  } catch {
    return "—";
  }
}

function formatGasPrice(raw: string | undefined | null): string {
  if (!raw) return "—";
  try {
    const mist = Number(BigInt(raw));
    if (mist >= 1_000_000) return `${(mist / 1_000_000).toFixed(1)}M`;
    if (mist >= 1_000) return `${(mist / 1_000).toFixed(0)}K`;
    return mist.toFixed(0);
  } catch {
    return "—";
  }
}

// ── Epoch Progress ──────────────────────────────────────────

function useEpochProgress(systemState: SystemState) {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState("");

  const startMs = useMemo(
    () =>
      systemState.epochStartTimestampMs
        ? Number(systemState.epochStartTimestampMs)
        : 0,
    [systemState.epochStartTimestampMs],
  );

  const durationMs = useMemo(
    () =>
      systemState.epochDurationMs ? Number(systemState.epochDurationMs) : 0,
    [systemState.epochDurationMs],
  );

  useEffect(() => {
    if (!startMs || !durationMs) {
      setProgress(0);
      setRemaining("—");
      return;
    }

    function tick() {
      const elapsed = Date.now() - startMs;
      const pct = Math.min(1, Math.max(0, elapsed / durationMs));
      setProgress(pct);

      const remainMs = Math.max(0, durationMs - elapsed);
      const hours = Math.floor(remainMs / 3_600_000);
      const mins = Math.floor((remainMs % 3_600_000) / 60_000);
      setRemaining(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`);
    }

    tick();
    const interval = setInterval(tick, 15_000);
    return () => clearInterval(interval);
  }, [startMs, durationMs]);

  return { progress, remaining };
}

// ── Component ───────────────────────────────────────────────

export default function NetworkDashboard({
  systemState,
  apys,
}: NetworkDashboardProps) {
  const { progress, remaining } = useEpochProgress(systemState);

  const avgApy = useMemo(() => {
    if (!apys.length) return "—";
    const sum = apys.reduce((acc, a) => acc + a.apy, 0);
    return `${((sum / apys.length) * 100).toFixed(2)}%`;
  }, [apys]);

  const totalStake = formatIota(systemState.totalStake);
  const gasPrice = formatGasPrice(systemState.referenceGasPrice);
  const validatorCount = Array.isArray(systemState.activeValidators)
    ? systemState.activeValidators.length
    : 0;

  return (
    <View style={styles.container}>
      {/* ── Epoch Lifecycle ─────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.epochHeader}>
          <Text style={styles.label}>EPOCH</Text>
          <Text style={styles.epochTag}>#{systemState.epoch}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(progress * 100).toFixed(1)}%` as unknown as number },
            ]}
          />
        </View>
        <View style={styles.epochFooter}>
          <Text style={styles.sublabel}>
            {(progress * 100).toFixed(0)}% complete
          </Text>
          <Text style={styles.sublabel}>{remaining} remaining</Text>
        </View>
      </View>

      {/* ── Metric Grid ────────────────────────────────── */}
      <View style={styles.grid}>
        <View style={[styles.card, styles.gridCard]}>
          <Text style={styles.label}>TOTAL STAKE</Text>
          <Text style={styles.value}>{totalStake}</Text>
          <Text style={styles.unit}>IOTA</Text>
        </View>

        <View style={[styles.card, styles.gridCard]}>
          <Text style={styles.label}>AVG APY</Text>
          <Text style={[styles.value, styles.valueAccent]}>{avgApy}</Text>
        </View>

        <View style={[styles.card, styles.gridCard]}>
          <Text style={styles.label}>VALIDATORS</Text>
          <Text style={styles.value}>{validatorCount}</Text>
          <Text style={styles.unit}>active</Text>
        </View>

        <View style={[styles.card, styles.gridCard]}>
          <Text style={styles.label}>GAS PRICE</Text>
          <Text style={styles.value}>{gasPrice}</Text>
          <Text style={styles.unit}>MIST</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },

  // Shared card tile
  card: {
    backgroundColor: Palette.white03,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.white08,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },

  // Labels — small, uppercase, muted
  label: {
    color: Palette.silver,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  sublabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },
  unit: {
    color: Palette.steel,
    fontSize: 10,
    marginTop: 2,
  },

  // Values — large, bold, white
  value: {
    color: Palette.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  valueAccent: {
    color: Palette.blue,
  },

  // Epoch specific
  epochHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  epochTag: {
    color: Palette.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.white08,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Palette.blue,
    minWidth: 2,
  },
  epochFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  gridCard: {
    flex: 1,
    minWidth: "46%" as unknown as number,
  },
});
