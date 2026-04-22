/**
 * Analytics Tab — live IOTA network statistics.
 * Premium Soft Dark theme. High-end financial dashboard UI.
 */

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { G, Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimatedRN, { FadeInDown } from "react-native-reanimated";

import { FontSize, FontWeight, Palette, Radius, Spacing } from "@/constants/theme";
import { useValidators } from "@/hooks/use-validators";
import type { ValidatorSummary } from "@/services/validators";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = Spacing.xl;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.base * 2 - CARD_PADDING * 2;
const FALLBACK_TOTAL_SUPPLY_IOTA = 4_600_000_000;

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatIota(raw: string | undefined | null): string {
  if (!raw || raw === "0") return "0";
  try {
    const iota = Number(BigInt(raw)) / 1_000_000_000;
    if (iota >= 1_000_000_000) return `${(iota / 1_000_000_000).toFixed(2)}B`;
    if (iota >= 1_000_000) return `${(iota / 1_000_000).toFixed(2)}M`;
    if (iota >= 1_000) return `${(iota / 1_000).toFixed(1)}K`;
    return iota.toFixed(0);
  } catch {
    return "—";
  }
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : `${str.slice(0, max - 1)}…`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ width, height, style }: { width?: number | string; height: number; style?: object }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        { width: width ?? "100%", height, borderRadius: Radius.sm, backgroundColor: Palette.ash, opacity },
        style,
      ]}
    />
  );
}

function SkeletonChartCard() {
  return (
    <View style={styles.chartCard}>
      <SkeletonBlock width={100} height={12} style={{ marginBottom: 8 }} />
      <SkeletonBlock width={160} height={20} style={{ marginBottom: Spacing.xl }} />
      <SkeletonBlock height={200} style={{ borderRadius: Radius.full, width: 200, alignSelf: "center" }} />
    </View>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠</Text>
      <Text style={styles.errorTitle}>Connection Failed</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Retry Connection</Text>
      </Pressable>
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PieSlice {
  name: string;
  votingPower: number;
  stakeFormatted: string;
  color: string;
}

// ─── Custom Interactive Donut Chart ───────────────────────────────────────────

function CustomDonutChart({
  data,
  activeSlice,
  onSlicePress,
}: {
  data: PieSlice[];
  activeSlice: PieSlice | null;
  onSlicePress: (slice: PieSlice) => void;
}) {
  const size = 260;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2 - 10; // Extra padding for highlight expansion
  const tooltipRadius = radius + 20;

  const total = data.reduce((acc, slice) => acc + slice.votingPower, 0);
  let currentPercentage = 0;

  // Helpers for exact SVG Path hit-testing
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  const slicesWithAngles = data.map((slice) => {
    const slicePercentage = slice.votingPower / total;
    const startPercentage = currentPercentage;
    const endPercentage = currentPercentage + slicePercentage;
    const midPercentage = currentPercentage + slicePercentage / 2;
    currentPercentage += slicePercentage;

    let startAngle = startPercentage * 360;
    let endAngle = endPercentage * 360;
    
    // Create a visual gap between slices (except if there's only 1)
    if (data.length > 1) {
      endAngle = Math.max(startAngle + 0.1, endAngle - 1.5);
    }

    const midAngleRad = (midPercentage * 360 - 90) * (Math.PI / 180);
    const tooltipX = size / 2 + tooltipRadius * Math.cos(midAngleRad);
    const tooltipY = size / 2 + tooltipRadius * Math.sin(midAngleRad);
    const pathData = describeArc(size / 2, size / 2, radius, startAngle, endAngle);

    return { ...slice, pathData, tooltipX, tooltipY };
  });

  const activeData = slicesWithAngles.find((s) => s.name === activeSlice?.name);

  return (
    <View style={{ width: size, height: size, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slicesWithAngles.map((slice) => {
          const isActive = activeData?.name === slice.name;
          const currentStrokeWidth = isActive ? strokeWidth + 6 : strokeWidth;
          
          return (
            <Path
              key={slice.name}
              d={slice.pathData}
              stroke={slice.color}
              strokeWidth={currentStrokeWidth}
              fill="none"
              onPress={() => onSlicePress(slice)}
            />
          );
        })}
      </Svg>

      {/* Floating Tooltip */}
      {activeData && (
        <AnimatedRN.View
          key={activeData.name}
          entering={FadeInDown.duration(200).springify()}
          pointerEvents="none"
          style={{
            position: "absolute",
            ...(activeData.tooltipX < size / 2
              ? { right: size - activeData.tooltipX }
              : { left: activeData.tooltipX }),
            ...(activeData.tooltipY < size / 2
              ? { bottom: size - activeData.tooltipY }
              : { top: activeData.tooltipY }),
            backgroundColor: "#202024", // Premium soft dark card
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
            zIndex: 100,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 8,
          }}
        >
          <Text style={{ color: Palette.white, fontSize: 11, fontWeight: "bold" }}>
            {activeData.name}
          </Text>
        </AnimatedRN.View>
      )}

      {/* Dynamic Center Hole Data */}
      <View style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center", padding: 40 }]} pointerEvents="none">
        {activeSlice ? (
          <AnimatedRN.View entering={FadeInDown.duration(200)} style={{ alignItems: "center" }}>
            <Text style={{ color: Palette.steel, fontSize: 10, fontWeight: "bold", textTransform: "uppercase", marginBottom: 4, textAlign: "center" }} numberOfLines={1}>
              {activeSlice.name}
            </Text>
            <Text style={{ color: Palette.blue, fontSize: 32, fontWeight: "800", letterSpacing: -1 }}>
              {activeSlice.votingPower.toFixed(2)}%
            </Text>
            <Text style={{ color: Palette.white, fontSize: 13, fontWeight: "600", marginTop: 4 }}>
              {activeSlice.stakeFormatted}
            </Text>
          </AnimatedRN.View>
        ) : (
          <AnimatedRN.View style={{ alignItems: "center" }}>
            <Text style={{ color: Palette.steel, fontSize: 10, fontWeight: "bold", textTransform: "uppercase", marginBottom: 4 }}>
              Total Network
            </Text>
            <Text style={{ color: Palette.white, fontSize: 18, fontWeight: "800", letterSpacing: -0.5, textAlign: "center" }}>
              Tap a slice
            </Text>
          </AnimatedRN.View>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, error, refetch } = useValidators();
  
  const [activeSlice, setActiveSlice] = useState<PieSlice | null>(null);
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const isInitialLoad = isLoading && !data;
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);

  const systemState = data?.systemState;
  const apys = data?.apys?.apys ?? [];

  // ── Active Validators ───────────────────────────────────────────────────────
  const activeValidators = useMemo<ValidatorSummary[]>(() => {
    if (!systemState) return [];
    const raw = systemState as unknown as Record<string, unknown>;
    const av = raw.activeValidators ?? (raw.V2 as Record<string, unknown> | undefined)?.activeValidators;
    return Array.isArray(av) ? (av as ValidatorSummary[]) : [];
  }, [systemState]);

  // ── Pie Chart Data ──────────────────────────────────────────────────────────
  const pieChartData = useMemo<PieSlice[]>(() => {
    if (!activeValidators.length) return [];
    const sorted = [...activeValidators].sort((a, b) => Number(b.votingPower ?? 0) - Number(a.votingPower ?? 0));
    const top10 = sorted.slice(0, 10);
    const rest = sorted.slice(10);
    
    // Premium Soft Dark Palette for slices
    const slices: PieSlice[] = top10.map((v, i) => {
      let color = Palette.blue;
      if (i === 0) color = Palette.blue; // Primary IOTA Blue for lead slice
      else if (i === 1) color = "rgba(59, 130, 246, 0.75)";
      else if (i === 2) color = "rgba(59, 130, 246, 0.45)";
      else if (i === 3) color = "rgba(255, 255, 255, 0.5)"; // Deep grays / muted accents
      else if (i === 4) color = "rgba(255, 255, 255, 0.4)";
      else if (i === 5) color = "rgba(255, 255, 255, 0.3)";
      else if (i === 6) color = "rgba(255, 255, 255, 0.2)";
      else if (i === 7) color = "rgba(255, 255, 255, 0.15)";
      else if (i === 8) color = "rgba(255, 255, 255, 0.1)";
      else if (i === 9) color = "rgba(255, 255, 255, 0.05)";

      return {
        name: truncate(v.name || "Unknown", 14),
        votingPower: Number(v.votingPower ?? 0) / 100,
        stakeFormatted: formatIota(v.stakingPoolIotaBalance) + " IOTA",
        color,
      };
    });

    if (rest.length) {
      const combinedStake = rest.reduce((s, v) => s + BigInt(v.stakingPoolIotaBalance || "0"), 0n);
      slices.push({
        name: "Others",
        votingPower: rest.reduce((s, v) => s + Number(v.votingPower ?? 0), 0) / 100,
        stakeFormatted: formatIota(combinedStake.toString()) + " IOTA",
        color: "rgba(255, 255, 255, 0.04)", // Visually subtle darker shade
      });
    }
    return slices;
  }, [activeValidators]);

  // Set default active slice when data loads
  React.useEffect(() => {
    if (!activeSlice && pieChartData && pieChartData.length > 0) {
      setActiveSlice(pieChartData[0]);
    }
  }, [pieChartData, activeSlice]);

  // ── APY Leaderboard ─────────────────────────────────────────────────────────


  // ── APY Leaderboard ─────────────────────────────────────────────────────────
  const apyLeaderboard = useMemo(() => {
    if (!activeValidators.length || !apys.length) return [];
    const topByStake = [...activeValidators]
      .sort((a, b) => Number(BigInt(b.stakingPoolIotaBalance || "0")) - Number(BigInt(a.stakingPoolIotaBalance || "0")))
      .slice(0, 10);
    const withApy = topByStake
      .map((v) => {
        const apyObj = apys.find((a) => a.address === v.iotaAddress);
        return { id: v.iotaAddress, name: v.name || truncate(v.iotaAddress, 10), apy: apyObj?.apy ?? 0 };
      })
      .sort((a, b) => b.apy - a.apy);
    const maxApy = Math.max(...withApy.map((v) => v.apy), 0.0001);
    return withApy.map((v) => ({
      ...v,
      percentageOfMax: (v.apy / maxApy) * 100,
      displayValue: `${(v.apy * 100).toFixed(2)}%`,
    }));
  }, [activeValidators, apys]);

  const handleRetry = useCallback(() => {
    setIsManualRefresh(true);
    refetch().finally(() => setIsManualRefresh(false));
  }, [refetch]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Network Statistics · Live</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {isError && !isLoading && (
        <ErrorState
          message={error?.message ?? "Unable to reach the IOTA RPC endpoint."}
          onRetry={handleRetry}
        />
      )}

      {!isError && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefresh}
              onRefresh={handleRetry}
              tintColor={Palette.blue}
              colors={[Palette.blue]}
            />
          }
        >
          {/* 1. Voting Power Chart (Donut) */}
          {isInitialLoad ? (
            <SkeletonChartCard />
          ) : (
            <AnimatedRN.View entering={FadeInDown.duration(300).delay(100)} style={styles.chartCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardSectionLabel}>VOTING POWER</Text>
                <Text style={styles.cardTitle}>Network Consensus</Text>
              </View>
              {pieChartData.length > 0 ? (
                <View style={styles.pieChartContainer}>
                  <CustomDonutChart
                    data={pieChartData}
                    activeSlice={activeSlice}
                    onSlicePress={setActiveSlice}
                  />
                </View>
              ) : (
                <Text style={styles.mutedText}>No validator data available</Text>
              )}
            </AnimatedRN.View>
          )}

          {/* 3. Premium Legend Cards */}
          {!isInitialLoad && pieChartData.length > 0 && (
            <View style={styles.legendSection}>
              <Text style={styles.sectionLabel}>VALIDATOR LEADERBOARD</Text>
              <View style={styles.legendList}>
                {(isLegendExpanded ? pieChartData : pieChartData.slice(0, 3)).map((slice, index) => {
                  const isActive = activeSlice?.name === slice.name;
                  return (
                    <AnimatedRN.View key={slice.name} entering={FadeInDown.duration(300).delay(150 + index * 30)}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.legendCard,
                          isActive && styles.legendCardActive,
                          pressed && styles.cardPressed
                        ]}
                        onPress={() => setActiveSlice(isActive ? null : slice)}
                      >
                        <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                        <View style={styles.legendTextWrap}>
                          <Text style={styles.legendName} numberOfLines={1}>{slice.name}</Text>
                          <Text style={styles.legendSub}>
                            {slice.name === "Others" ? "Combined voting power" : `Rank ${index + 1}`}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.legendValue}>{slice.votingPower.toFixed(2)}%</Text>
                          <Text style={styles.legendSubRight}>{slice.stakeFormatted}</Text>
                        </View>
                      </Pressable>
                    </AnimatedRN.View>
                  );
                })}
              </View>
              {pieChartData.length > 3 && (
                <Pressable
                  style={styles.expandButton}
                  onPress={() => setIsLegendExpanded(!isLegendExpanded)}
                >
                  <Text style={styles.expandButtonText}>
                    {isLegendExpanded ? "Show Less" : `Show All Validators (${pieChartData.length})`}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* 4. APY Horizontal Carousel */}
          {!isInitialLoad && apyLeaderboard.length > 0 && (
            <View style={styles.apySection}>
              <Text style={[styles.sectionLabel, { paddingHorizontal: Spacing.base }]}>HIGHEST YIELD (APY)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.apyCarousel}
                decelerationRate="fast"
                snapToInterval={216} // 200 width + 16 gap
              >
                {apyLeaderboard.map((item, index) => (
                  <AnimatedRN.View key={item.id} entering={FadeInDown.duration(300).delay(200 + index * 50)}>
                    <View style={styles.apyCard}>
                      <View style={styles.apyHeader}>
                        <Text style={styles.apyRank}>#{index + 1}</Text>
                        <Text style={styles.apyValue}>{item.displayValue}</Text>
                      </View>
                      <Text style={styles.apyName} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${item.percentageOfMax}%` as unknown as number }]} />
                      </View>
                    </View>
                  </AnimatedRN.View>
                ))}
              </ScrollView>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.void },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: Palette.white, fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  subtitle: { color: Palette.steel, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 2 },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(59,130,246,0.12)",
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.blue },
  liveText: { color: Palette.blue, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1 },

  content: { paddingVertical: Spacing.md, gap: Spacing.xl },
  
  sectionLabel: {
    color: Palette.steel,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  mutedText: { color: Palette.steel, fontSize: FontSize.sm, paddingVertical: Spacing.lg, textAlign: "center" },

  // Primary Chart Cards
  chartCard: {
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: CARD_PADDING,
    marginHorizontal: Spacing.base,
  },
  cardHeader: { marginBottom: Spacing.xl },
  cardSectionLabel: { color: Palette.steel, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5, textTransform: "uppercase" },
  cardTitle: { color: Palette.white, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, marginTop: 4 },

  pieChartContainer: { alignItems: "center", justifyContent: "center", marginVertical: Spacing.sm },

  // Premium Legend Cards
  legendSection: { paddingHorizontal: Spacing.base },
  legendList: { gap: Spacing.md },
  legendCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: "transparent",
  },
  expandButton: {
    marginTop: Spacing.md,
    alignSelf: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: Radius.full,
  },
  expandButtonText: {
    color: Palette.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  legendCardActive: {
    borderColor: "rgba(59, 130, 246, 0.3)",
    backgroundColor: "#202024",
  },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendTextWrap: { flex: 1 },
  legendName: { color: Palette.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  legendSub: { color: Palette.steel, fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginTop: 4 },
  legendSubRight: { color: Palette.steel, fontSize: FontSize.xs, fontWeight: FontWeight.medium, marginTop: 4 },
  legendValue: { color: Palette.blue, fontSize: FontSize["2xl"], fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },

  // APY Horizontal Carousel
  apySection: { marginTop: Spacing.md },
  apyCarousel: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  apyCard: {
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    width: 200,
    justifyContent: "space-between",
  },
  apyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  apyRank: { color: Palette.steel, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  apyValue: { color: Palette.blue, fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  apyName: { color: Palette.white, fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.lg },
  barTrack: { height: 6, backgroundColor: Palette.ash, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: Palette.blue, borderRadius: 3 },

  // Error
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing["3xl"], gap: Spacing.md },
  errorIcon: { fontSize: 48, color: Palette.steel },
  errorTitle: { color: Palette.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  errorMessage: { color: Palette.steel, fontSize: FontSize.base, textAlign: "center", lineHeight: 22 },
  retryBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Palette.ash,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  retryBtnText: { color: Palette.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
