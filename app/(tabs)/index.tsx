<<<<<<< HEAD
// main home screen — COBE globe with IOTA validator visualization
=======
// main home screen — 3D globe with IOTA validator visualization
>>>>>>> 6d8623953224c284c4e9b3952036c4769ed21a89

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useValidators } from '@/hooks/use-validators';
<<<<<<< HEAD
import { GlobeView, GlobeLoader, ValidatorOverlay } from '@/components/globe';
=======
import { GlobeScene, GlobeLoader, ValidatorOverlay } from '@/components/globe';
>>>>>>> 6d8623953224c284c4e9b3952036c4769ed21a89
import { Palette, FontSize, FontWeight, Spacing } from '@/constants/theme';
import type { ValidatorApy } from '@/services/validators';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useValidators();
  const [selectedId, setSelectedId] = useState<string | null>(null);

<<<<<<< HEAD
  // extract validators — the API route unwraps V2
  const validators = useMemo(() => {
    if (!data?.systemState) return [];
    const state = data.systemState;
    const raw = state as unknown as Record<string, unknown>;
=======
  // extract validators — the API route now unwraps V2
  const validators = useMemo(() => {
    if (!data?.systemState) return [];
    const state = data.systemState;
    // handle both direct and V2-wrapped shapes for safety
    const raw = (state as unknown as Record<string, unknown>);
>>>>>>> 6d8623953224c284c4e9b3952036c4769ed21a89
    const activeValidators = raw.activeValidators
      ?? (raw.V2 as Record<string, unknown> | undefined)?.activeValidators;
    return Array.isArray(activeValidators) ? activeValidators : [];
  }, [data]);

  const apys = useMemo(() => {
    if (!data?.apys) return [];
    return Array.isArray(data.apys.apys) ? data.apys.apys : [];
  }, [data]);

  // debug logging
  useEffect(() => {
    if (data) {
      console.log('[Globe] validators count:', validators.length);
<<<<<<< HEAD
=======
      if (validators.length > 0) {
        console.log('[Globe] first validator:', validators[0].name, validators[0].iotaAddress?.slice(0, 16));
      }
>>>>>>> 6d8623953224c284c4e9b3952036c4769ed21a89
    }
    if (error) {
      console.log('[Globe] error:', error.message);
    }
  }, [data, error, validators]);

  // find the selected validator + its APY
  const selectedValidator = useMemo(
    () => validators.find((v) => v.iotaAddress === selectedId) ?? null,
    [validators, selectedId],
  );

  const selectedApy = useMemo(
    () => apys.find((a: ValidatorApy) => a.address === selectedId),
    [apys, selectedId],
  );

  const handleSelect = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  // loading state
  if (isLoading) {
    return <GlobeLoader />;
  }

  // error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorMessage}>
          {error.message || 'Unable to fetch validator data'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>OmniSphere</Text>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>
            {validators.length} validators
          </Text>
        </View>
      </View>

<<<<<<< HEAD
      {/* COBE globe */}
      <View style={styles.canvasWrapper}>
        <GlobeView
          validators={validators}
          onSelectValidator={handleSelect}
=======
      {/* 3D globe */}
      <View style={styles.canvasWrapper}>
        <GlobeScene
          validators={validators}
          selectedId={selectedId}
          onSelect={handleSelect}
>>>>>>> 6d8623953224c284c4e9b3952036c4769ed21a89
        />
      </View>

      {/* validator info overlay */}
      {selectedValidator && (
        <ValidatorOverlay
          validator={selectedValidator}
          apy={selectedApy}
          onClose={() => setSelectedId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.void,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    color: Palette.snow,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.white08,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 100,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.cyan,
  },
  badgeText: {
    color: Palette.silver,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  canvasWrapper: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Palette.void,
    padding: Spacing['2xl'],
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: Spacing.base,
  },
  errorTitle: {
    color: Palette.snow,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    color: Palette.steel,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
