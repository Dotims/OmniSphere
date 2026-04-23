import {
  Fonts,
  FontSize,
  FontWeight,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useSettings } from "@/hooks/use-settings";
import type { ValidatorApy, ValidatorSummary } from "@/services/validators";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  activeColors,
}: {
  validator: ValidatorSummary;
  apy?: ValidatorApy;
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  activeColors: any;
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
          !isLast &&
            !isExpanded && {
              borderBottomWidth: 1,
              borderBottomColor: activeColors.border,
            },
        ]}>
        <View
          style={[styles.rowMarker, { backgroundColor: activeColors.tint }]}
        />
        <View style={styles.rowTextWrap}>
          <Text
            style={[styles.rowName, { color: activeColors.text }]}
            numberOfLines={1}>
            {validator.name || "Unknown Validator"}
          </Text>
          <Text
            style={[styles.rowAddress, { color: activeColors.textSecondary }]}
            numberOfLines={1}>
            {truncateAddress(validator.iotaAddress)}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: activeColors.textSecondary }]}>
          {isExpanded ? "▴" : "▾"}
        </Text>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          style={[
            styles.expandedPanel,
            { backgroundColor: activeColors.background },
            !isLast && {
              borderBottomWidth: 1,
              borderBottomColor: activeColors.border,
            },
          ]}>
          <View style={styles.metricsGrid}>
            <View
              style={[styles.metricCell, { borderColor: activeColors.border }]}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Stake
              </Text>
              <Text style={[styles.metricValue, { color: activeColors.tint }]}>
                {stake}
              </Text>
            </View>
            <View
              style={[styles.metricCell, { borderColor: activeColors.border }]}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: activeColors.textSecondary },
                ]}>
                APY
              </Text>
              <Text style={[styles.metricValue, { color: activeColors.tint }]}>
                {apyPercent}
              </Text>
            </View>
            <View
              style={[styles.metricCell, { borderColor: activeColors.border }]}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Voting Power
              </Text>
              <Text style={[styles.metricValue, { color: activeColors.tint }]}>
                {votingPower}
              </Text>
            </View>
            <View
              style={[styles.metricCell, { borderColor: activeColors.border }]}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Commission
              </Text>
              <Text style={[styles.metricValue, { color: activeColors.tint }]}>
                {commission}
              </Text>
            </View>
            <View
              style={[styles.metricCell, { borderColor: activeColors.border }]}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Next Epoch Stake
              </Text>
              <Text style={[styles.metricValue, { color: activeColors.tint }]}>
                {nextStake}
              </Text>
            </View>
            <View
              style={[styles.metricCell, { borderColor: activeColors.border }]}>
              <Text
                style={[
                  styles.metricLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Next Commission
              </Text>
              <Text style={[styles.metricValue, { color: activeColors.tint }]}>
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
  const { activeColors } = useSettings();

  const apyByAddress = React.useMemo(() => {
    const map = new Map<string, ValidatorApy>();
    if (apys) {
      for (const a of apys) {
        map.set(a.address, a);
      }
    }
    return map;
  }, [apys]);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <>
      {/* ── Scrim: dims the dashboard behind ──────────────── */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* ── Card ──────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(300).springify()}
        exiting={FadeOutDown.duration(200)}
        style={[
          styles.container,
          { paddingBottom: 82 + insets.bottom + Spacing.lg },
        ]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: activeColors.surfaceElevated,
              borderColor: activeColors.border,
              shadowColor: activeColors.tint,
            },
          ]}>
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: activeColors.textSecondary },
              ]}
            />
          </View>

          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: activeColors.text }]}>
                Dense Cluster
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: activeColors.textSecondary },
                ]}>
                {validators.length} validators in tap range
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                { backgroundColor: activeColors.border },
              ]}
              hitSlop={12}>
              <Text
                style={[
                  styles.closeBtnText,
                  { color: activeColors.textSecondary },
                ]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.listContainer,
                { backgroundColor: activeColors.background },
              ]}>
              {validators.map((validator, idx) => (
                <ValidatorRow
                  key={validator.iotaAddress}
                  validator={validator}
                  apy={apyByAddress.get(validator.iotaAddress)}
                  isFirst={idx === 0}
                  isLast={idx === validators.length - 1}
                  isExpanded={expandedId === validator.iotaAddress}
                  onToggle={() => handleToggle(validator.iotaAddress)}
                  activeColors={activeColors}
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
  // Elevated card
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    paddingTop: Spacing.base,
    // Subtle outer glow for boundary definition
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    // Thin hairline border for additional separation
    borderWidth: 1,
  },
  handleContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: Radius.full,
    opacity: 0.55,
    alignSelf: "center",
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
    fontFamily: Fonts.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.sm,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingBottom: Spacing.xs,
  },
  // Inner list container
  listContainer: {
    borderRadius: Radius.lg,
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
  rowMarker: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowName: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  rowAddress: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  chevron: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.xs,
    marginLeft: Spacing.xs,
  },
  // ── Expanded detail panel ─────────────────────────────────
  expandedPanel: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metricCell: {
    minWidth: "46%" as unknown as number,
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 4,
  },
  metricLabel: {
    fontFamily: Fonts.sans,
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
});
