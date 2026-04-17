// native overlay card for selected validator info
// positioned at bottom of screen over the 3D canvas
// since drei's <Html> doesn't work in RN, we use a native View overlay

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Palette, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';
import type { ValidatorSummary, ValidatorApy } from '@/services/validators';

// format IOTA balance from raw string (nanos) to readable
function formatStake(raw: string | undefined | null): string {
  if (!raw || raw === '0') return '0 IOTA';
  try {
    const nano = BigInt(raw);
    const iota = Number(nano) / 1_000_000_000;
    if (iota >= 1_000_000) return `${(iota / 1_000_000).toFixed(1)}M IOTA`;
    if (iota >= 1_000) return `${(iota / 1_000).toFixed(1)}K IOTA`;
    return `${iota.toFixed(0)} IOTA`;
  } catch {
    return '— IOTA';
  }
}

interface ValidatorOverlayProps {
  validator: ValidatorSummary;
  apy?: ValidatorApy;
  onClose: () => void;
}

export default function ValidatorOverlay({ validator, apy, onClose }: ValidatorOverlayProps) {
  const addr = validator.iotaAddress || '';
  const truncatedAddress = addr.length > 14
    ? `${addr.slice(0, 8)}...${addr.slice(-6)}`
    : addr;
  const stake = formatStake(validator.stakingPoolIotaBalance);
  const apyPercent = apy ? `${(apy.apy * 100).toFixed(2)}%` : '—';
  const commission = validator.commissionRate != null
    ? `${(validator.commissionRate / 100).toFixed(0)}%`
    : '—';
  const votingPower = validator.votingPower != null
    ? `${(Number(validator.votingPower) / 100).toFixed(2)}%`
    : '—';

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* drag handle */}
        <View style={styles.handle} />

        {/* header */}
        <View style={styles.header}>
          <View style={styles.indicator} />
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {validator.name || 'Unknown Validator'}
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
            <Text style={[styles.statValue, styles.statValueHighlight]}>{apyPercent}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  card: {
    backgroundColor: 'rgba(10, 14, 23, 0.92)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 224, 202, 0.15)',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.ash,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.cyan,
    marginRight: Spacing.sm,
    shadowColor: Palette.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: Palette.snow,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  address: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.white10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: Palette.silver,
    fontSize: FontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statItem: {
    flex: 1,
    minWidth: '40%' as unknown as number,
    backgroundColor: Palette.white05,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  statLabel: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: Palette.snow,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  statValueHighlight: {
    color: Palette.cyan,
  },
});
