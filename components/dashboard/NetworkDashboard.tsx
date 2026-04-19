/**
 * NetworkDashboard — compact summary of IOTA network health metrics.
 * Displayed below the globe on the main screen.
 *
 * Widgets:
 *  - Epoch Lifecycle (epoch number + progress bar)
 *  - Total Stake
 *  - Reference Gas Price
 *  - Active Validators count
 *  - Average Network APY
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

// ── Epoch Progress Hook ─────────────────────────────────────

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
    const interval = setInterval(tick, 15_000); // update every 15s
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
      <View style={styles.epochCard}>
        <View style={styles.epochHeader}>
          <Text style={styles.epochLabel}>Epoch</Text>
          <Text style={styles.epochNumber}>#{systemState.epoch}</Text>
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
          <Text style={styles.epochPercent}>
            {(progress * 100).toFixed(0)}%
          </Text>
          <Text style={styles.epochRemaining}>{remaining} remaining</Text>
        </View>
      </View>

      {/* ── Metric Cards Grid ──────────────────────────── */}
      <View style={styles.grid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Stake</Text>
          <Text style={styles.metricValue}>{totalStake}</Text>
          <Text style={styles.metricUnit}>IOTA</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg APY</Text>
          <Text style={[styles.metricValue, styles.metricHighlight]}>
            {avgApy}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Validators</Text>
          <Text style={styles.metricValue}>{validatorCount}</Text>
          <Text style={styles.metricUnit}>active</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Gas Price</Text>
          <Text style={styles.metricValue}>{gasPrice}</Text>
          <Text style={styles.metricUnit}>MIST</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },

  // Epoch card
  epochCard: {
    backgroundColor: Palette.white05,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.white08,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  epochHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs + 2,
  },
  epochLabel: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  epochNumber: {
    color: Palette.snow,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.white10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: Palette.cyan,
    minWidth: 2,
  },
  epochFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  epochPercent: {
    color: Palette.silver,
    fontSize: 10,
    fontWeight: FontWeight.medium,
  },
  epochRemaining: {
    color: Palette.steel,
    fontSize: 10,
  },

  // Metric grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  metricCard: {
    flex: 1,
    minWidth: "46%" as unknown as number,
    backgroundColor: Palette.white05,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.white08,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  metricLabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    color: Palette.snow,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  metricHighlight: {
    color: Palette.cyan,
  },
  metricUnit: {
    color: Palette.steel,
    fontSize: 10,
    marginTop: 1,
  },
});
