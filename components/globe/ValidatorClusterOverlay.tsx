import {
    FontSize,
    FontWeight,
    Palette,
    Radius,
    Spacing,
} from "@/constants/theme";
import type { ValidatorApy, ValidatorSummary } from "@/services/validators";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown,
    FadeOutDown,
    LinearTransition,
} from "react-native-reanimated";

interface ValidatorClusterOverlayProps {
  validators: ValidatorSummary[];
  apys?: ValidatorApy[];
  onClose: () => void;
}

function truncateAddress(address: string): string {
  return address.length > 14
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;
}

function formatStake(raw: string | undefined | null): string {
  if (!raw || raw === "0") return "0 IOTA";
  try {
    const nano = BigInt(raw);
    const iota = Number(nano) / 1_000_000_000;
    if (iota >= 1_000_000) return `${(iota / 1_000_000).toFixed(1)}M IOTA`;
    if (iota >= 1_000) return `${(iota / 1_000).toFixed(1)}K IOTA`;
    return `${iota.toFixed(0)} IOTA`;
  } catch {
    return "— IOTA";
  }
}

function formatPercent(
  value: string | number | undefined | null,
  divisor = 100,
): string {
  if (value == null) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${(n / divisor).toFixed(2)}%`;
}

// ── Expandable row ──────────────────────────────────────────
function ValidatorRow({
  validator,
  apy,
  isFirst,
  isLast,
  isExpanded,
  onToggle,
}: {
  validator: ValidatorSummary;
  apy?: ValidatorApy;
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const stake = formatStake(validator.stakingPoolIotaBalance);
  const nextStake = formatStake(validator.nextEpochStake);
  const apyPercent = apy ? `${(apy.apy * 100).toFixed(2)}%` : "—";
  const commission = formatPercent(validator.commissionRate);
  const votingPower = formatPercent(validator.votingPower);

  return (
    <Animated.View layout={LinearTransition.duration(200)}>
      <Pressable
        onPress={onToggle}
        style={[
          styles.row,
          isFirst && styles.rowFirst,
          isLast && !isExpanded && styles.rowLast,
          !isLast && !isExpanded && styles.rowBorder,
        ]}
      >
        <View style={styles.rowMarker} />
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowName} numberOfLines={1}>
            {validator.name || "Unknown Validator"}
          </Text>
          <Text style={styles.rowAddress} numberOfLines={1}>
            {truncateAddress(validator.iotaAddress)}
          </Text>
        </View>
        <Text style={styles.chevron}>{isExpanded ? "▴" : "▾"}</Text>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          style={[
            styles.expandedPanel,
            isLast && styles.expandedPanelLast,
            !isLast && styles.rowBorder,
          ]}
        >
          <View style={styles.metricsGrid}>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Stake</Text>
              <Text style={styles.metricValue}>{stake}</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>APY</Text>
              <Text style={[styles.metricValue, styles.metricHighlight]}>
                {apyPercent}
              </Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Voting Power</Text>
              <Text style={styles.metricValue}>{votingPower}</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Commission</Text>
              <Text style={styles.metricValue}>{commission}</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Next Epoch Stake</Text>
              <Text style={styles.metricValue}>{nextStake}</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricLabel}>Next Commission</Text>
              <Text style={styles.metricValue}>
                {formatPercent(validator.nextEpochCommissionRate)}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ── Main overlay ────────────────────────────────────────────
export default function ValidatorClusterOverlay({
  validators,
  apys,
  onClose,
}: ValidatorClusterOverlayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const apyByAddress = React.useMemo(() => {
    const map = new Map<string, ValidatorApy>();
    if (apys) {
      for (const a of apys) {
        map.set(a.address, a);
      }
    }
    return map;
  }, [apys]);

  const handleToggle = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    [],
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}>
      <View style={styles.card}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Dense Cluster</Text>
            <Text style={styles.subtitle}>
              {validators.length} validators in tap range
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.listContainer}>
            {validators.map((validator, idx) => (
              <ValidatorRow
                key={validator.iotaAddress}
                validator={validator}
                apy={apyByAddress.get(validator.iotaAddress)}
                isFirst={idx === 0}
                isLast={idx === validators.length - 1}
                isExpanded={expandedId === validator.iotaAddress}
                onToggle={() => handleToggle(validator.iotaAddress)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["2xl"],
  },
  card: {
    backgroundColor: "rgba(11, 13, 20, 0.94)",
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.white08,
    padding: Spacing.xl,
    paddingTop: Spacing.base,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.ash,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: Palette.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    marginTop: 2,
    color: Palette.steel,
    fontSize: FontSize.xs,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.white10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: Palette.silver,
    fontSize: FontSize.sm,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingBottom: Spacing.xs,
  },
  // Continuous container with shared border radius
  listContainer: {
    borderRadius: Radius.md,
    backgroundColor: Palette.white02,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.white08,
    overflow: "hidden",
  },
  // ── Row styles (zero gap, divider-separated) ──────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  rowFirst: {
    // No extra styling needed — container handles top radius
  },
  rowLast: {
    // No extra styling needed — container handles bottom radius
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.white10,
  },
  rowMarker: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: Palette.blue,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowName: {
    color: Palette.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  rowAddress: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    marginTop: 1,
    fontFamily: "monospace",
  },
  chevron: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    marginLeft: Spacing.xs,
  },
  // ── Expanded detail panel ─────────────────────────────────
  expandedPanel: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  expandedPanelLast: {
    // Container handles bottom radius
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  metricCell: {
    minWidth: "46%" as unknown as number,
    flex: 1,
    backgroundColor: Palette.white03,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  metricLabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  metricValue: {
    color: Palette.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  metricHighlight: {
    color: Palette.blue,
  },
});
