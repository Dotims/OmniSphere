// native overlay card for selected validator info
// positioned at bottom of screen over the globe WebView
// Theme-aware — elevated surface, tint glow border, dimmed backdrop

import {
    Fonts,
    FontSize,
    FontWeight,
    Radius,
    Spacing,
} from "@/constants/theme";
import { useSettings } from "@/hooks/use-settings";
import type { ValidatorApy, ValidatorSummary } from "@/services/validators";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    FadeOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// format IOTA balance from raw string (nanos) to readable
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

interface ValidatorOverlayProps {
  validator: ValidatorSummary;
  apy?: ValidatorApy;
  onClose: () => void;
}

export default function ValidatorOverlay({
  validator,
  apy,
  onClose,
}: ValidatorOverlayProps) {
  const insets = useSafeAreaInsets();
  const { activeColors } = useSettings();

  const addr = validator.iotaAddress || "";
  const truncatedAddress =
    addr.length > 14 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
  const stake = formatStake(validator.stakingPoolIotaBalance);
  const apyPercent = apy ? `${(apy.apy * 100).toFixed(2)}%` : "—";
  const commission =
    validator.commissionRate != null
      ? `${(validator.commissionRate / 100).toFixed(0)}%`
      : "—";
  const votingPower =
    validator.votingPower != null
      ? `${(Number(validator.votingPower) / 100).toFixed(2)}%`
      : "—";

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
          {/* Stylistic Top Edge Notch */}
          <View
            style={[
              styles.notch,
              {
                backgroundColor: activeColors.background,
                borderColor: activeColors.border,
              },
            ]}
          />

          {/* drag handle */}
          <View style={styles.handleContainer}>
            <View
              style={[styles.handle, { backgroundColor: activeColors.border }]}
            />
          </View>

          {/* header */}
          <View style={styles.header}>
            <View
              style={[styles.indicator, { backgroundColor: activeColors.tint }]}
            />
            <View style={styles.headerText}>
              <Text
                style={[styles.name, { color: activeColors.text }]}
                numberOfLines={1}>
                {validator.name || "Unknown Validator"}
              </Text>
              <Text
                style={[styles.address, { color: activeColors.textSecondary }]}>
                {truncatedAddress}
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

          {/* stats grid */}
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statItem,
                { backgroundColor: activeColors.background },
              ]}>
              <Text
                style={[
                  styles.statLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Stake
              </Text>
              <Text style={[styles.statValue, { color: activeColors.text }]}>
                {stake}
              </Text>
            </View>
            <View
              style={[
                styles.statItem,
                { backgroundColor: activeColors.background },
              ]}>
              <Text
                style={[
                  styles.statLabel,
                  { color: activeColors.textSecondary },
                ]}>
                APY
              </Text>
              <Text style={[styles.statValue, { color: activeColors.tint }]}>
                {apyPercent}
              </Text>
            </View>
            <View
              style={[
                styles.statItem,
                { backgroundColor: activeColors.background },
              ]}>
              <Text
                style={[
                  styles.statLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Commission
              </Text>
              <Text style={[styles.statValue, { color: activeColors.text }]}>
                {commission}
              </Text>
            </View>
            <View
              style={[
                styles.statItem,
                { backgroundColor: activeColors.background },
              ]}>
              <Text
                style={[
                  styles.statLabel,
                  { color: activeColors.textSecondary },
                ]}>
                Voting Power
              </Text>
              <Text style={[styles.statValue, { color: activeColors.text }]}>
                {votingPower}
              </Text>
            </View>
          </View>
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
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    zIndex: 10,
  },
  // Elevated card
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  address: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.xs,
    marginTop: 2,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: "40%" as unknown as number,
    borderRadius: Radius.lg,
    padding: Spacing.md + 4,
  },
  statLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
});
