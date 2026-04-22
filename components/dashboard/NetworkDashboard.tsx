/**
 * NetworkDashboard — Premium soft dark theme.
 *
 * True black bg, pastel accent cards, 32px radius, zero borders/shadows,
 * massive bold values (32px / extrabold), tiny muted labels.
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
      {/* ── Epoch Card — Mint accent ────────────────────── */}
      <View style={styles.epochCard}>
        <View style={styles.epochHeader}>
          <Text style={styles.epochLabel}>EPOCH</Text>
          <View style={styles.epochBadge}>
            <Text style={styles.epochBadgeText}>#{systemState.epoch}</Text>
          </View>
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
          <Text style={styles.epochProgress}>
            {(progress * 100).toFixed(0)}%
          </Text>
          <Text style={styles.epochRemaining}>{remaining} left</Text>
        </View>
      </View>

      {/* ── Metric Grid ────────────────────────────────── */}
      <View style={styles.grid}>
        <View style={[styles.card, styles.cardMint]}>
          <Text style={styles.label}>TOTAL STAKE</Text>
          <Text style={styles.valueHuge}>{totalStake}</Text>
          <Text style={styles.unit}>IOTA</Text>
        </View>

        <View style={[styles.card, styles.cardPeach]}>
          <Text style={styles.label}>AVG APY</Text>
          <Text style={[styles.valueHuge, styles.valuePeach]}>{avgApy}</Text>
        </View>

        <View style={[styles.card, styles.cardLavender]}>
          <Text style={styles.label}>VALIDATORS</Text>
          <Text style={styles.valueHuge}>{validatorCount}</Text>
          <Text style={styles.unit}>active</Text>
        </View>

        <View style={[styles.card, styles.cardYellow]}>
          <Text style={styles.label}>GAS PRICE</Text>
          <Text style={styles.valueHuge}>{gasPrice}</Text>
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
    gap: Spacing.md,
  },

  // ── Epoch card ─────────────────────────────────────────────
  epochCard: {
    backgroundColor: Palette.slate,
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
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  epochBadge: {
    backgroundColor: Palette.blue,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing["2xs"],
  },
  epochBadgeText: {
    color: Palette.void,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.ash,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Palette.blue,
    minWidth: 2,
  },
  epochFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  epochProgress: {
    color: Palette.blue,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  epochRemaining: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // ── Metric Grid ────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  // Shared card — no border, no shadow, solid color contrast
  card: {
    flex: 1,
    minWidth: "46%" as unknown as number,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  // Pastel card backgrounds
  cardMint: {
    backgroundColor: Palette.slate,
  },
  cardPeach: {
    backgroundColor: Palette.slate,
  },
  cardLavender: {
    backgroundColor: Palette.slate,
  },
  cardYellow: {
    backgroundColor: Palette.slate,
  },

  // Labels — tiny, uppercase, muted
  label: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  unit: {
    color: Palette.steel,
    fontSize: 10,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },

  // Values — extremely large, bold
  valueHuge: {
    color: Palette.white,
    fontSize: 32,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1,
  },
  valuePeach: {
    color: Palette.blue,
  },
});
