/**
 * Validators tab — premium soft dark theme.
 * True black bg, pastel accents, aggressive radius, zero borders/shadows.
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
    if (iota >= 1_000_000) return `${(iota / 1_000_000).toFixed(1)}M`;
    if (iota >= 1_000) return `${(iota / 1_000).toFixed(1)}K`;
    return `${iota.toFixed(0)}`;
  } catch {
    return "—";
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
        style={[styles.row, isExpanded && styles.rowExpanded]}
      >
        <View style={styles.rowDot} />
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowName} numberOfLines={1}>
            {validator.name || "Unknown Validator"}
          </Text>
          <Text style={styles.rowAddress} numberOfLines={1}>
            {truncateAddress(validator.iotaAddress)}
          </Text>
        </View>
        <Text style={styles.rowStakeHint} numberOfLines={1}>
          {stake}
        </Text>
        <Text style={styles.chevron}>{isExpanded ? "▴" : "▾"}</Text>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          style={styles.expandedPanel}
        >
          <View style={styles.metricsGrid}>
            <MetricCell label="STAKE" value={`${stake} IOTA`} />
            <MetricCell label="APY" value={apyPercent} accent />
            <MetricCell label="VOTING POWER" value={votingPower} />
            <MetricCell label="COMMISSION" value={commission} />
            <MetricCell label="NEXT EPOCH STAKE" value={`${nextStake} IOTA`} />
            <MetricCell
              label="NEXT COMMISSION"
              value={formatPercent(validator.nextEpochCommissionRate)}
            />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.metricCell}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.metricAccent]}>
        {value}
      </Text>
    </View>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Validators</Text>
        <View style={styles.countBadgeWrap}>
          <Text style={styles.countBadge}>
            {filteredValidators.length}
            {search ? ` / ${validators.length}` : ""}
          </Text>
        </View>
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
        <View style={styles.centerWrap}>
          <Text style={styles.mutedText}>Loading validators…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredValidators}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerWrap}>
              <Text style={styles.mutedText}>No validators found</Text>
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
    paddingVertical: Spacing.md,
  },
  title: {
    color: Palette.white,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  countBadgeWrap: {
    backgroundColor: Palette.slate,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing["2xs"] + 1,
  },
  countBadge: {
    color: Palette.blue,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Search — rounded, no border
  searchWrap: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Palette.slate,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    color: Palette.white,
    fontSize: FontSize.sm,
  },

  // Sort pills — pastel active state
  sortRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sortPill: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.full,
    backgroundColor: Palette.slate,
  },
  sortPillActive: {
    backgroundColor: Palette.blue,
  },
  sortPillText: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  sortPillTextActive: {
    color: Palette.void,
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["2xl"],
    gap: Spacing.sm,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  mutedText: {
    color: Palette.steel,
    fontSize: FontSize.sm,
  },

  // Row — individual rounded cards, no border
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 4,
    backgroundColor: Palette.slate,
    borderRadius: Radius.lg,
  },
  rowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    fontSize: 10,
    marginTop: 2,
    fontFamily: "monospace",
  },
  rowStakeHint: {
    color: Palette.mist,
    fontSize: 11,
    fontWeight: FontWeight.bold,
    maxWidth: 80,
    textAlign: "right",
  },
  chevron: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    marginLeft: Spacing.xs,
  },

  // Expanded panel — connected to row
  expandedPanel: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Palette.slate,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricCell: {
    minWidth: "46%" as unknown as number,
    flex: 1,
    backgroundColor: Palette.ash,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
  },
  metricLabel: {
    color: Palette.steel,
    fontSize: 9,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metricValue: {
    color: Palette.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  metricAccent: {
    color: Palette.blue,
  },
});
