// native overlay card for selected validator info
// positioned at bottom of screen over the globe WebView
// Premium soft dark theme — elevated surface, blue glow border, dimmed backdrop

import {
  FontSize,
  FontWeight,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
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
          
          {/* drag handle */}
          <View style={styles.handle} />

          {/* header */}
          <View style={styles.header}>
            <View style={styles.indicator} />
            <View style={styles.headerText}>
              <Text style={styles.name} numberOfLines={1}>
                {validator.name || "Unknown Validator"}
              </Text>
              <Text style={styles.address}>{truncatedAddress}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Stake</Text>
              <Text style={styles.statValue}>{stake}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>APY</Text>
              <Text style={[styles.statValue, styles.statValueHighlight]}>
                {apyPercent}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Commission</Text>
              <Text style={styles.statValue}>{commission}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Voting Power</Text>
              <Text style={styles.statValue}>{votingPower}</Text>
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
    marginBottom: Spacing.base,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.blue,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: Palette.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  address: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontFamily: "monospace",
    marginTop: 2,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: "40%" as unknown as number,
    backgroundColor: Palette.slate, // #1C1C1E — darker than card's #242428
    borderRadius: Radius.md,
    padding: Spacing.md + 4,
  },
  statLabel: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: Palette.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  statValueHighlight: {
    color: Palette.blue,
  },
});
