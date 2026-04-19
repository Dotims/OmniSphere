/**
 * Validators tab — full scrollable list of active validators
 * with search filtering, sort toggles, and expandable accordion rows.
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import {
  FontSize,
  FontWeight,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";
import { useValidators } from "@/hooks/use-validators";
import type { ValidatorApy, ValidatorSummary } from "@/services/validators";

// ── Sort keys ───────────────────────────────────────────────

type SortKey = "stake" | "votingPower" | "apy" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "stake", label: "Stake" },
  { key: "votingPower", label: "Power" },
  { key: "apy", label: "APY" },
  { key: "name", label: "Name" },
];

// ── Formatters ──────────────────────────────────────────────

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

function truncateAddress(address: string): string {
  return address.length > 14
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;
}

// ── Row component ───────────────────────────────────────────

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
        <Text style={styles.rowStakeHint} numberOfLines={1}>
          {formatStake(validator.stakingPoolIotaBalance)}
        </Text>
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

// ── Main screen ─────────────────────────────────────────────

export default function ValidatorsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useValidators();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stake");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const validators = useMemo<ValidatorSummary[]>(() => {
    if (!data?.systemState) return [];
    const state = data.systemState;
    const raw = state as unknown as Record<string, unknown>;
    const av =
      raw.activeValidators ??
      (raw.V2 as Record<string, unknown> | undefined)?.activeValidators;
    return Array.isArray(av) ? (av as ValidatorSummary[]) : [];
  }, [data]);

  const apys = useMemo(() => {
    if (!data?.apys) return [];
    return Array.isArray(data.apys.apys) ? data.apys.apys : [];
  }, [data]);

  const apyByAddress = useMemo(() => {
    const m = new Map<string, ValidatorApy>();
    for (const a of apys) m.set(a.address, a);
    return m;
  }, [apys]);

  // Filter + sort
  const filteredValidators = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = validators;

    if (query) {
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(query) ||
          v.iotaAddress.toLowerCase().includes(query),
      );
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "stake": {
          const sa = Number(BigInt(a.stakingPoolIotaBalance || "0"));
          const sb = Number(BigInt(b.stakingPoolIotaBalance || "0"));
          cmp = sb - sa;
          break;
        }
        case "votingPower": {
          cmp = Number(b.votingPower || 0) - Number(a.votingPower || 0);
          break;
        }
        case "apy": {
          const aa = apyByAddress.get(a.iotaAddress)?.apy ?? 0;
          const ab = apyByAddress.get(b.iotaAddress)?.apy ?? 0;
          cmp = ab - aa;
          break;
        }
        case "name": {
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        }
      }
      return sortAsc ? -cmp : cmp;
    });

    return sorted;
  }, [validators, search, sortKey, sortAsc, apyByAddress]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortAsc((prev) => !prev);
      } else {
        setSortKey(key);
        setSortAsc(false);
      }
    },
    [sortKey],
  );

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: ValidatorSummary;
      index: number;
    }) => (
      <ValidatorRow
        validator={item}
        apy={apyByAddress.get(item.iotaAddress)}
        isFirst={index === 0}
        isLast={index === filteredValidators.length - 1}
        isExpanded={expandedId === item.iotaAddress}
        onToggle={() => handleToggle(item.iotaAddress)}
      />
    ),
    [apyByAddress, expandedId, filteredValidators.length, handleToggle],
  );

  const keyExtractor = useCallback(
    (item: ValidatorSummary) => item.iotaAddress,
    [],
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Validators</Text>
        <Text style={styles.countBadge}>
          {filteredValidators.length}
          {search ? ` / ${validators.length}` : ""}
        </Text>
      </View>

      {/* ── Search ─────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or address…"
          placeholderTextColor={Palette.steel}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Sort pills ─────────────────────────────────── */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => handleSort(opt.key)}
              style={[styles.sortPill, active && styles.sortPillActive]}
            >
              <Text
                style={[
                  styles.sortPillText,
                  active && styles.sortPillTextActive,
                ]}
              >
                {opt.label}
                {active ? (sortAsc ? " ↑" : " ↓") : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── List ───────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading validators…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredValidators}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No validators found</Text>
            </View>
          }
        />
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  title: {
    color: Palette.snow,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  countBadge: {
    color: Palette.steel,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },

  // Search
  searchWrap: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Palette.white05,
    borderWidth: 1,
    borderColor: Palette.white10,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Palette.snow,
    fontSize: FontSize.sm,
  },

  // Sort
  sortRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sortPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 100,
    backgroundColor: Palette.white05,
    borderWidth: 1,
    borderColor: Palette.white08,
  },
  sortPillActive: {
    backgroundColor: "rgba(26, 179, 255, 0.12)",
    borderColor: "rgba(26, 179, 255, 0.30)",
  },
  sortPillText: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  sortPillTextActive: {
    color: Palette.cyan,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["2xl"],
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Palette.steel,
    fontSize: FontSize.sm,
  },
  emptyWrap: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  emptyText: {
    color: Palette.steel,
    fontSize: FontSize.sm,
  },

  // Row — zero gap, divider-separated
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Palette.white05,
  },
  rowFirst: {
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
  },
  rowLast: {
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.white10,
  },
  rowMarker: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: Palette.cyan,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowName: {
    color: Palette.snow,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  rowAddress: {
    color: Palette.steel,
    fontSize: 10,
    marginTop: 1,
    fontFamily: "monospace",
  },
  rowStakeHint: {
    color: Palette.silver,
    fontSize: 10,
    fontWeight: FontWeight.medium,
    maxWidth: 80,
    textAlign: "right",
  },
  chevron: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    marginLeft: Spacing.xs,
  },

  // Expanded
  expandedPanel: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  expandedPanelLast: {
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  metricCell: {
    minWidth: "46%" as unknown as number,
    flex: 1,
    backgroundColor: Palette.white05,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
  },
  metricLabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValue: {
    color: Palette.snow,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  metricHighlight: {
    color: Palette.cyan,
  },
});
