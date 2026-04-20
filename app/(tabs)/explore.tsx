/**
 * Explore tab — IOTA ecosystem quick-links and info cards.
 * Premium soft dark theme with pastel accent cards.
 */

import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FontSize,
  FontWeight,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";

// ── Data ────────────────────────────────────────────────────

interface LinkCard {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  url: string;
  accentBg: string;
  accentText: string;
}

const EXPLORE_LINKS: LinkCard[] = [
  {
    id: "wiki",
    title: "IOTA Wiki",
    subtitle: "Protocol docs, guides, and specs",
    emoji: "📚",
    url: "https://wiki.iota.org",
    accentBg: Palette.slate,
    accentText: Palette.sky,
  },
  {
    id: "explorer",
    title: "Explorer",
    subtitle: "Browse transactions on-chain",
    emoji: "🔍",
    url: "https://explorer.iota.org",
    accentBg: Palette.slate,
    accentText: Palette.mint,
  },
  {
    id: "github",
    title: "GitHub",
    subtitle: "Open-source IOTA repositories",
    emoji: "🐙",
    url: "https://github.com/iotaledger",
    accentBg: Palette.slate,
    accentText: Palette.lavender,
  },
  {
    id: "discord",
    title: "Discord",
    subtitle: "Join the IOTA community",
    emoji: "💬",
    url: "https://discord.iota.org",
    accentBg: Palette.slate,
    accentText: Palette.peach,
  },
  {
    id: "blog",
    title: "Blog",
    subtitle: "Latest news and announcements",
    emoji: "📝",
    url: "https://blog.iota.org",
    accentBg: Palette.slate,
    accentText: Palette.yellow,
  },
  {
    id: "governance",
    title: "Governance",
    subtitle: "Proposals, votes, and DAO",
    emoji: "🏛️",
    url: "https://govern.iota.org",
    accentBg: Palette.slate,
    accentText: Palette.rose,
  },
];

// ── Feature Highlights ──────────────────────────────────────

interface Feature {
  id: string;
  title: string;
  description: string;
  tag: string;
  tagColor: string;
}

const FEATURES: Feature[] = [
  {
    id: "move",
    title: "Move Smart Contracts",
    description: "Write safe, composable on-chain programs with the Move language.",
    tag: "Developer",
    tagColor: Palette.mint,
  },
  {
    id: "staking",
    title: "Liquid Staking",
    description: "Stake IOTA tokens and earn rewards while maintaining liquidity.",
    tag: "DeFi",
    tagColor: Palette.peach,
  },
  {
    id: "identity",
    title: "Decentralized Identity",
    description: "Self-sovereign identity framework built on IOTA's L1.",
    tag: "Identity",
    tagColor: Palette.lavender,
  },
];

// ── Component ───────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>IOTA Ecosystem</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Feature highlights ────────────────────── */}
        <Text style={styles.sectionLabel}>HIGHLIGHTS</Text>
        <View style={styles.featuresWrap}>
          {FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <View
                  style={[
                    styles.featureTag,
                    { backgroundColor: feature.tagColor },
                  ]}
                >
                  <Text style={styles.featureTagText}>{feature.tag}</Text>
                </View>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </View>
          ))}
        </View>

        {/* ── Quick links grid ──────────────────────── */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>
          QUICK LINKS
        </Text>
        <View style={styles.linksGrid}>
          {EXPLORE_LINKS.map((link) => (
            <Pressable
              key={link.id}
              style={[styles.linkCard, { backgroundColor: link.accentBg }]}
              onPress={() => Linking.openURL(link.url)}
            >
              <Text style={styles.linkEmoji}>{link.emoji}</Text>
              <Text style={[styles.linkTitle, { color: link.accentText }]}>
                {link.title}
              </Text>
              <Text style={styles.linkSubtitle}>{link.subtitle}</Text>
            </Pressable>
          ))}
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
  },
  sectionLabel: {
    color: Palette.steel,
    fontSize: 10,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },

  // ── Feature cards ──────────────────────────────────────────
  featuresWrap: {
    gap: Spacing.md,
  },
  featureCard: {
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: Spacing.lg,
  },
  featureHeader: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  featureTag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing["2xs"] + 1,
  },
  featureTagText: {
    color: Palette.void,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  featureTitle: {
    color: Palette.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  featureDesc: {
    color: Palette.silver,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },

  // ── Quick links grid ───────────────────────────────────────
  linksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  linkCard: {
    flex: 1,
    minWidth: "46%" as unknown as number,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  linkEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  linkTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing["2xs"],
  },
  linkSubtitle: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
});
