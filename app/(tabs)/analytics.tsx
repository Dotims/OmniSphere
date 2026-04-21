/**
 * Analytics tab — network statistics and visualizations.
 *
 * Premium soft dark theme — true black background, vibrant blue accent,
 * aggressive radius, no borders.
 */

import React, { useMemo } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PieChart, ProgressChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  FontSize,
  FontWeight,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useValidators } from "@/hooks/use-validators";
import type { ValidatorSummary } from "@/services/validators";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.base * 2 - Spacing.xl * 2;

// Hardcoded fallback for Total Supply if not available from RPC
const FALLBACK_TOTAL_SUPPLY_IOTA = 4_600_000_000;

// Formatters
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

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 1)}…`;
}

// ── Components ──────────────────────────────────────────────

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, isRefetching } = useValidators();

  // ── Data Processing ────────────────────────────────────────
  const systemState = data?.systemState;
  const apys = data?.apys?.apys || [];

  const activeValidators = useMemo<ValidatorSummary[]>(() => {
    if (!systemState) return [];
    const raw = systemState as unknown as Record<string, unknown>;
    const av =
      raw.activeValidators ??
      (raw.V2 as Record<string, unknown> | undefined)?.activeValidators;
    return Array.isArray(av) ? (av as ValidatorSummary[]) : [];
  }, [systemState]);

  // 1. Stake Distribution (Pie Chart)
  const pieChartData = useMemo(() => {
    if (!activeValidators.length) return [];

    // Sort by voting power (descending)
    const sorted = [...activeValidators].sort(
      (a, b) => Number(b.votingPower || 0) - Number(a.votingPower || 0)
    );

    const top10 = sorted.slice(0, 10);
    const rest = sorted.slice(10);

    const colors = [
      Palette.blue,
      Palette.mint,
      Palette.peach,
      Palette.lavender,
      Palette.yellow,
      Palette.sky,
      Palette.rose,
      Palette.blueLight,
      Palette.mintSoft,
      Palette.peachSoft,
    ];

    const dataPoints = top10.map((v, i) => ({
      name: truncateString(v.name || "Unknown", 10),
      votingPower: Number(v.votingPower || 0) / 100, // Basis points to percentage
      color: colors[i % colors.length],
      legendFontColor: Palette.steel,
      legendFontSize: 11,
    }));

    if (rest.length > 0) {
      const restVotingPower = rest.reduce(
        (acc, v) => acc + Number(v.votingPower || 0),
        0
      );
      dataPoints.push({
        name: "Rest",
        votingPower: restVotingPower / 100,
        color: Palette.ash, // Neutral for the rest
        legendFontColor: Palette.steel,
        legendFontSize: 11,
      });
    }

    return dataPoints;
  }, [activeValidators]);

  // 2. Staking Ratio (Progress Chart)
  const stakingRatioData = useMemo(() => {
    if (!systemState) return { data: [0], text: "0%" };

    const totalStakeNanos = Number(BigInt(systemState.totalStake || "0"));
    const totalStakeIota = totalStakeNanos / 1_000_000_000;

    let totalSupplyIota = FALLBACK_TOTAL_SUPPLY_IOTA;
    if (systemState.iotaTotalSupply) {
      totalSupplyIota = Number(BigInt(systemState.iotaTotalSupply)) / 1_000_000_000;
    }

    const ratio = Math.min(1, Math.max(0, totalStakeIota / totalSupplyIota));

    return {
      data: [ratio],
      text: `${(ratio * 100).toFixed(1)}%`,
    };
  }, [systemState]);

  // 3. APY Leaderboard (Horizontal Bars)
  const apyLeaderboard = useMemo(() => {
    if (!activeValidators.length || !apys.length) return [];

    // Sort by stake first to get top 10 validators by stake
    const topByStake = [...activeValidators]
      .sort((a, b) => {
        const sa = Number(BigInt(a.stakingPoolIotaBalance || "0"));
        const sb = Number(BigInt(b.stakingPoolIotaBalance || "0"));
        return sb - sa;
      })
      .slice(0, 10);

    // Map APY values and sort them by APY descending
    const withApy = topByStake
      .map((v) => {
        const apyObj = apys.find((a) => a.address === v.iotaAddress);
        return {
          id: v.iotaAddress,
          name: v.name || truncateString(v.iotaAddress, 10),
          apy: apyObj ? apyObj.apy : 0,
        };
      })
      .sort((a, b) => b.apy - a.apy);

    // Find max APY for scaling bars
    const maxApy = Math.max(...withApy.map((v) => v.apy), 0.0001); // Prevent div by 0

    return withApy.map((v) => ({
      ...v,
      percentageOfMax: (v.apy / maxApy) * 100,
      displayValue: `${(v.apy * 100).toFixed(2)}%`,
    }));
  }, [activeValidators, apys]);

  // Network Health Values
  let displayTotalSupply = `${FALLBACK_TOTAL_SUPPLY_IOTA / 1_000_000_000}B`;
  if (systemState?.iotaTotalSupply) {
    displayTotalSupply = formatIota(systemState.iotaTotalSupply);
  }
  const protocolVersion = systemState?.protocolVersion || "—";
  let displayGasPrice = "—";
  if (systemState?.referenceGasPrice) {
    displayGasPrice = `${systemState.referenceGasPrice} MIST`;
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Network Statistics</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 82 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={Palette.blue}
            colors={[Palette.blue]}
          />
        }
      >
        {/* 1. Staking Ratio Gauge */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.card}>
          <Text style={styles.cardTitle}>STAKING RATIO</Text>
          <Text style={styles.cardSubtitle}>
            Total Stake vs Total Supply
          </Text>
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeCenterTextContainer}>
              <Text style={styles.gaugeValueText}>{stakingRatioData.text}</Text>
              <Text style={styles.gaugeLabelText}>Staked</Text>
            </View>
            <ProgressChart
              data={stakingRatioData}
              width={CHART_WIDTH}
              height={200}
              strokeWidth={20}
              radius={80}
              chartConfig={{
                backgroundColor: Palette.slate,
                backgroundGradientFrom: Palette.slate,
                backgroundGradientTo: Palette.slate,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Vibrant Blue
                labelColor: () => Palette.steel,
              }}
              hideLegend={true}
              style={styles.chartStyle}
            />
          </View>
        </Animated.View>

        {/* 2. Stake Distribution */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>VOTING POWER</Text>
          <Text style={styles.cardSubtitle}>Top 10 Validators vs Rest</Text>
          {pieChartData.length > 0 ? (
            <View style={styles.pieChartContainer}>
              <PieChart
                data={pieChartData}
                width={SCREEN_WIDTH - Spacing.base * 2}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="votingPower"
                backgroundColor="transparent"
                paddingLeft="0"
                center={[0, 0]}
                absolute
              />
            </View>
          ) : (
            <Text style={styles.mutedText}>No data available</Text>
          )}
        </Animated.View>

        {/* 3. APY Leaderboard */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(200)}
          style={styles.card}
        >
          <Text style={styles.cardTitle}>APY LEADERBOARD</Text>
          <Text style={styles.cardSubtitle}>Top 10 Validators by Stake</Text>

          <View style={styles.barChartContainer}>
            {apyLeaderboard.length > 0 ? (
              apyLeaderboard.map((item, index) => (
                <View key={item.id} style={styles.barRow}>
                  <View style={styles.barLabelContainer}>
                    <Text style={styles.barName} numberOfLines={1}>
                      {index + 1}. {item.name}
                    </Text>
                    <Text style={styles.barValue}>{item.displayValue}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${item.percentageOfMax}%` as unknown as number },
                      ]}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.mutedText}>No APY data available</Text>
            )}
          </View>
        </Animated.View>

        {/* 4. Network Health Cards */}
        <Text style={styles.sectionLabel}>NETWORK HEALTH</Text>
        <View style={styles.grid}>
          <Animated.View
            entering={FadeInDown.duration(300).delay(300)}
            style={[styles.smallCard, styles.cardLavender]}
          >
            <Text style={styles.smallCardLabel}>TOTAL SUPPLY</Text>
            <Text style={styles.smallCardValue}>{displayTotalSupply}</Text>
            <Text style={styles.smallCardUnit}>IOTA</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(350)}
            style={[styles.smallCard, styles.cardPeach]}
          >
            <Text style={styles.smallCardLabel}>PROTOCOL</Text>
            <Text style={styles.smallCardValue}>v{protocolVersion}</Text>
            <Text style={styles.smallCardUnit}>Version</Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.duration(300).delay(400)}
            style={[styles.smallCard, styles.cardMint]}
          >
            <Text style={styles.smallCardLabel}>REF GAS PRICE</Text>
            <Text style={styles.smallCardValue}>{displayGasPrice}</Text>
            <Text style={styles.smallCardUnit}>Current Epoch</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.void,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    color: Palette.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Palette.steel,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["3xl"],
    gap: Spacing.md,
  },
  sectionLabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  mutedText: {
    color: Palette.steel,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.lg,
  },

  // Premium Cards (Absolute Black aesthetic, no borders)
  card: {
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
  },
  cardTitle: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardSubtitle: {
    color: Palette.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },

  // Charts
  chartStyle: {
    marginVertical: 8,
    borderRadius: Radius.lg,
  },
  gaugeContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gaugeCenterTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  gaugeValueText: {
    color: Palette.white,
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1,
  },
  gaugeLabelText: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  pieChartContainer: {
    alignItems: "center",
    marginLeft: -Spacing.base, // Adjust chart-kit default padding
  },

  // Horizontal Bar Chart
  barChartContainer: {
    gap: Spacing.md,
  },
  barRow: {
    flexDirection: "column",
    gap: 6,
  },
  barLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barName: {
    color: Palette.white,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  barValue: {
    color: Palette.blue,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  barTrack: {
    height: 8,
    backgroundColor: Palette.ash,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: Palette.blue,
    borderRadius: 4,
  },

  // Network Health Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  smallCard: {
    flex: 1,
    minWidth: "46%" as unknown as number,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cardMint: { backgroundColor: Palette.slate },
  cardPeach: { backgroundColor: Palette.slate },
  cardLavender: { backgroundColor: Palette.slate },

  smallCardLabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  smallCardValue: {
    color: Palette.white,
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -1,
  },
  smallCardUnit: {
    color: Palette.steel,
    fontSize: 10,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
});
