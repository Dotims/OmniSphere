// main home screen — COBE globe (top 50%) + Network Dashboard (bottom 50%)

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NetworkDashboard } from "@/components/dashboard";
import {
    GlobeLoader,
    GlobeView,
    ValidatorClusterOverlay,
    ValidatorOverlay,
} from "@/components/globe";
import { FontSize, FontWeight, Palette, Radius, Spacing } from "@/constants/theme";
import { useValidatorLocations } from "@/hooks/use-validator-locations";
import { useValidators } from "@/hooks/use-validators";
import type { ValidatorApy, ValidatorSummary } from "@/services/validators";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useValidators();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // extract validators — the API route unwraps V2
  const validators = useMemo<ValidatorSummary[]>(() => {
    if (!data?.systemState) return [];
    const state = data.systemState;
    const raw = state as unknown as Record<string, unknown>;
    const activeValidators =
      raw.activeValidators ??
      (raw.V2 as Record<string, unknown> | undefined)?.activeValidators;
    return Array.isArray(activeValidators)
      ? (activeValidators as ValidatorSummary[])
      : [];
  }, [data]);

  const { data: coordinatesById } = useValidatorLocations(validators);

  const apys = useMemo(() => {
    if (!data?.apys) return [];
    return Array.isArray(data.apys.apys) ? data.apys.apys : [];
  }, [data]);

  useEffect(() => {
    if (data) {
      console.log("[Globe] validators count:", validators.length);
    }
    if (error) {
      console.log("[Globe] error:", error.message);
    }
  }, [data, error, validators]);

  const validatorsById = useMemo(() => {
    const map = new Map<string, ValidatorSummary>();
    validators.forEach((validator) => {
      map.set(validator.iotaAddress, validator);
    });
    return map;
  }, [validators]);

  const selectedValidators = useMemo(
    () =>
      selectedIds
        .map((id) => validatorsById.get(id))
        .filter((validator): validator is ValidatorSummary => !!validator),
    [selectedIds, validatorsById],
  );

  const selectedValidator = useMemo(
    () => (selectedValidators.length === 1 ? selectedValidators[0] : null),
    [selectedValidators],
  );

  const selectedApy = useMemo(
    () =>
      selectedValidator
        ? apys.find(
            (a: ValidatorApy) => a.address === selectedValidator.iotaAddress,
          )
        : undefined,
    [apys, selectedValidator],
  );

  const handleSelect = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  useEffect(() => {
    setSelectedIds((previous) =>
      previous.filter((validatorId) => validatorsById.has(validatorId)),
    );
  }, [validatorsById]);

  if (isLoading) {
    return <GlobeLoader />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorMessage}>
          {error.message || "Unable to fetch validator data"}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.header}>
        <Text style={styles.title}>OmniSphere</Text>
      </View>

      {/* ── Top half: Globe ──────────────────────────────── */}
      <View style={styles.globeSection}>
        <GlobeView
          validators={validators}
          coordinatesById={coordinatesById}
          selectedValidatorIds={selectedIds}
          onSelectValidator={handleSelect}
        />
        <View style={styles.overlayBadge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{validators.length} validators</Text>
        </View>
      </View>

      {/* ── Bottom half: Dashboard ───────────────────────── */}
      <View style={styles.dashboardSection}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.dashboardContent}
        >
          {data?.systemState && (
            <NetworkDashboard systemState={data.systemState} apys={apys} />
          )}
        </ScrollView>
      </View>

      {/* validator info overlay */}
      {selectedValidator && (
        <ValidatorOverlay
          validator={selectedValidator}
          apy={selectedApy}
          onClose={() => setSelectedIds([])}
        />
      )}

      {selectedValidators.length > 1 && (
        <ValidatorClusterOverlay
          validators={selectedValidators}
          apys={apys}
          onClose={() => setSelectedIds([])}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  title: {
    color: Palette.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },

  // Globe: top ~50% — strictly edge-to-edge
  globeSection: {
    flex: 1,
    position: "relative",
    marginHorizontal: 0,
    paddingHorizontal: 0,
  },

  // Dashboard: bottom ~50% — no border
  dashboardSection: {
    flex: 1,
  },
  dashboardContent: {
    paddingBottom: Spacing.base,
  },

  overlayBadge: {
    position: "absolute",
    bottom: Spacing.sm,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Palette.slate,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.blue,
  },
  badgeText: {
    color: Palette.silver,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Palette.void,
    padding: Spacing["2xl"],
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: Spacing.base,
  },
  errorTitle: {
    color: Palette.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    color: Palette.steel,
    fontSize: FontSize.base,
    textAlign: "center",
    lineHeight: 22,
  },
});
