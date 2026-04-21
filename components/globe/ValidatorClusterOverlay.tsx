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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
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
              <Text style={styles.metricValue}>
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
  const insets = useSafeAreaInsets();

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
    <>
      {/* ── Scrim: dims the dashboard behind ──────────────── */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.scrim}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* ── Card ──────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        exiting={FadeOutDown.duration(200)}
        style={[styles.container, { paddingBottom: 82 + insets.bottom + Spacing.lg }]}>
        <View style={styles.card}>
          {/* Stylistic Top Edge Notch */}
          <View style={styles.notch} />
          
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
    </>
  );
}

const styles = StyleSheet.create({
  // Full-screen dim backdrop — separates overlay from dashboard
  scrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Extend well past bottom to cover the tab bar
    bottom: -100,
    backgroundColor: "rgba(0, 0, 0, 0.70)",
    zIndex: 28,
  },

  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    zIndex: 30,
  },
  notch: {
    position: "absolute",
    top: -1,
    alignSelf: "center",
    width: 48,
    height: 6,
    backgroundColor: Palette.void,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.12)",
    zIndex: 10,
  },
  // Elevated card — #242428 is distinctly lighter than the #1C1C1E dashboard cards
  card: {
    backgroundColor: "#242428",
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    paddingTop: Spacing.base,
    // Subtle blue outer glow for boundary definition
    shadowColor: Palette.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    // Thin hairline border for additional separation
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.12)",
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
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    color: Palette.steel,
    fontSize: FontSize.xs,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.ash,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: Palette.mist,
    fontSize: FontSize.sm,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingBottom: Spacing.xs,
  },
  // Inner list container — slightly darker than card for depth
  listContainer: {
    borderRadius: Radius.md,
    backgroundColor: Palette.slate, // #1C1C1E — darker than card's #242428
    overflow: "hidden",
  },
  // ── Row styles ────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 4,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
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
    fontWeight: FontWeight.semibold,
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
    backgroundColor: "#1C1C1E", // Slightly darker to create a nested effect
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricCell: {
    minWidth: "46%" as unknown as number,
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)", // Subtle inner border
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 4,
  },
  metricLabel: {
    color: Palette.steel, // Muted gray for labels
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    color: Palette.blue, // Large bold blue for metrics
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
});
