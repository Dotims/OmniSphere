/**
 * NetworkDashboard — Premium theme-aware dashboard.
 *
 * Dynamic bg/text colors via activeColors context, 32px radius, zero borders/shadows,
 * massive bold values (32px / extrabold), tiny muted labels.
 */

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Fonts,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useSettings } from "@/hooks/use-settings";
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
  const { activeColors } = useSettings();

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
      {/* ── Epoch Card ────────────────────────────────── */}
      <View style={[styles.epochCard, { backgroundColor: activeColors.surfaceElevated }]}>
        <View style={styles.epochHeader}>
          <Text style={[styles.epochLabel, { color: activeColors.textSecondary }]}>EPOCH</Text>
          <View style={[styles.epochBadge, { backgroundColor: activeColors.tint }]}>
            <Text style={[styles.epochBadgeText, { color: activeColors.background }]}>#{systemState.epoch}</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: activeColors.border }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: activeColors.tint, width: `${(progress * 100).toFixed(1)}%` as unknown as number },
            ]}
          />
        </View>

        <View style={styles.epochFooter}>
          <Text style={[styles.epochProgress, { color: activeColors.tint }]}>
            {(progress * 100).toFixed(0)}%
          </Text>
          <Text style={[styles.epochRemaining, { color: activeColors.textSecondary }]}>{remaining} left</Text>
        </View>
      </View>

      {/* ── Metric Grid ────────────────────────────────── */}
      <View style={styles.grid}>
        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <Text style={[styles.label, { color: activeColors.textSecondary }]}>TOTAL STAKE</Text>
          <Text style={[styles.valueHuge, { color: activeColors.text }]}>{totalStake}</Text>
          <Text style={[styles.unit, { color: activeColors.textSecondary }]}>IOTA</Text>
        </View>

        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <Text style={[styles.label, { color: activeColors.textSecondary }]}>AVG APY</Text>
          <Text style={[styles.valueHuge, { color: activeColors.tint }]}>{avgApy}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <Text style={[styles.label, { color: activeColors.textSecondary }]}>VALIDATORS</Text>
          <Text style={[styles.valueHuge, { color: activeColors.text }]}>{validatorCount}</Text>
          <Text style={[styles.unit, { color: activeColors.textSecondary }]}>active</Text>
        </View>

        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <Text style={[styles.label, { color: activeColors.textSecondary }]}>GAS PRICE</Text>
          <Text style={[styles.valueHuge, { color: activeColors.text }]}>{gasPrice}</Text>
          <Text style={[styles.unit, { color: activeColors.textSecondary }]}>MIST</Text>
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
    gap: Spacing.md,
  },

  // ── Epoch card ─────────────────────────────────────────────
  epochCard: {
    borderRadius: Radius["2xl"],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  epochHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  epochLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  epochBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing["2xs"],
  },
  epochBadgeText: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 2,
  },
  epochFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  epochProgress: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  epochRemaining: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // ── Metric Grid ────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  // Shared card — no border, no shadow
  card: {
    flex: 1,
    minWidth: "46%" as unknown as number,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  // Labels — tiny, uppercase, muted
  label: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  unit: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },

  // Values — extremely large, bold
  valueHuge: {
    fontFamily: Fonts.sans,
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1,
  },
});
