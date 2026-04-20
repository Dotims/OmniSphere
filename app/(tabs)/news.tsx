/**
 * News tab — @iota X (Twitter) feed display.
 *
 * Mock UI structured like a social feed.
 * Premium soft dark theme — aggressive radius, pastel accents, no borders.
 *
 * Architecture: Uses a mock data component for smooth performance.
 * The feed does NOT overlay the 3D globe — it's in its own dedicated tab.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  FontSize,
  FontWeight,
  Palette,
  Radius,
  Spacing,
} from "@/constants/theme";

// ── Types ───────────────────────────────────────────────────

interface Tweet {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  images?: string[];
  isVerified: boolean;
  tags?: string[];
}

// ── Mock feed data ──────────────────────────────────────────

const MOCK_TWEETS: Tweet[] = [
  {
    id: "1",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "🚀 IOTA Rebased is here! The biggest upgrade in IOTA's history brings Move smart contracts, liquid staking, and a fully decentralized validator network. The future of DLT is now. #IOTA #Rebased",
    timestamp: "2h",
    likes: 4821,
    retweets: 1563,
    replies: 342,
    isVerified: true,
    tags: ["Launch", "Rebased"],
  },
  {
    id: "2",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "📊 Network Stats Update:\n\n• 150+ Active Validators\n• 99.98% Uptime\n• 10,000+ TPS sustained\n• Sub-second finality\n\nThe IOTA network has never been stronger. Check the live dashboard →",
    timestamp: "5h",
    likes: 2934,
    retweets: 892,
    replies: 156,
    isVerified: true,
    tags: ["Network"],
  },
  {
    id: "3",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "🏛️ Governance Proposal #47 is live! The community vote on treasury allocation for ecosystem grants closes in 48h. Make your voice heard.\n\nEvery IOTA holder can participate in shaping the future.",
    timestamp: "8h",
    likes: 1847,
    retweets: 634,
    replies: 298,
    isVerified: true,
    tags: ["Governance"],
  },
  {
    id: "4",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "🔐 Security-first approach: IOTA's Move VM brings formal verification and resource-oriented programming. Build with confidence.\n\nDeveloper docs are live → wiki.iota.org",
    timestamp: "12h",
    likes: 1523,
    retweets: 487,
    replies: 89,
    isVerified: true,
    tags: ["Developer", "Security"],
  },
  {
    id: "5",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "🌍 IOTA nodes are now distributed across 50+ countries worldwide. True decentralization means geographic diversity.\n\nSee the live globe at OmniSphere 🌐",
    timestamp: "1d",
    likes: 3156,
    retweets: 1023,
    replies: 201,
    isVerified: true,
    tags: ["Network", "Global"],
  },
  {
    id: "6",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "💰 Staking rewards are now live! Delegate your IOTA tokens to validators and earn passive income. Current average APY: ~6.2%.\n\nStart staking today through any supported wallet.",
    timestamp: "1d",
    likes: 5432,
    retweets: 1876,
    replies: 445,
    isVerified: true,
    tags: ["Staking", "DeFi"],
  },
  {
    id: "7",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "🎯 Ecosystem Growth: 200+ projects building on IOTA.\n\nFrom DeFi and NFTs to supply chain and digital identity — the IOTA ecosystem is thriving. Apply for a grant to join them.",
    timestamp: "2d",
    likes: 2789,
    retweets: 934,
    replies: 178,
    isVerified: true,
    tags: ["Ecosystem"],
  },
  {
    id: "8",
    author: "IOTA",
    handle: "@iota",
    avatar: "https://pbs.twimg.com/profile_images/1790048580467044353/h5vEiRjp_200x200.jpg",
    content:
      "⚡ Performance milestone: IOTA Rebased achieves consistent sub-second finality across all validators. This is enterprise-grade infrastructure for the decentralized world.",
    timestamp: "3d",
    likes: 4102,
    retweets: 1345,
    replies: 267,
    isVerified: true,
    tags: ["Performance"],
  },
];

// ── Tag color mapping ───────────────────────────────────────

function getTagColor(tag: string): string {
  const map: Record<string, string> = {
    Launch: Palette.mint,
    Rebased: Palette.mintSoft,
    Network: Palette.sky,
    Governance: Palette.lavender,
    Developer: Palette.yellow,
    Security: Palette.peach,
    Global: Palette.mint,
    Staking: Palette.peach,
    DeFi: Palette.rose,
    Ecosystem: Palette.lavender,
    Performance: Palette.sky,
  };
  return map[tag] || Palette.silver;
}

// ── Number formatter ────────────────────────────────────────

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Tweet card component ────────────────────────────────────

function TweetCard({ tweet, index }: { tweet: Tweet; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 60)}
      style={styles.tweetCard}
    >
      {/* Author row */}
      <View style={styles.authorRow}>
        <Image
          source={{ uri: tweet.avatar }}
          style={styles.avatar}
        />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{tweet.author}</Text>
            {tweet.isVerified && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          <Text style={styles.handle}>{tweet.handle}</Text>
        </View>
        <Text style={styles.timestamp}>{tweet.timestamp}</Text>
      </View>

      {/* Content */}
      <Text style={styles.tweetContent}>{tweet.content}</Text>

      {/* Tags */}
      {tweet.tags && tweet.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tweet.tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                { backgroundColor: getTagColor(tag) },
              ]}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Engagement row */}
      <View style={styles.engagementRow}>
        <View style={styles.engagementItem}>
          <Text style={styles.engagementIcon}>💬</Text>
          <Text style={styles.engagementCount}>
            {formatCount(tweet.replies)}
          </Text>
        </View>
        <View style={styles.engagementItem}>
          <Text style={styles.engagementIcon}>🔄</Text>
          <Text style={styles.engagementCount}>
            {formatCount(tweet.retweets)}
          </Text>
        </View>
        <View style={styles.engagementItem}>
          <Text style={styles.engagementIcon}>❤️</Text>
          <Text style={styles.engagementCount}>
            {formatCount(tweet.likes)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main screen ─────────────────────────────────────────────

export default function NewsScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [tweets, setTweets] = useState(MOCK_TWEETS);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setTweets([...MOCK_TWEETS]);
      setRefreshing(false);
    }, 1200);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Tweet; index: number }) => (
      <TweetCard tweet={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Tweet) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>News</Text>
          <Text style={styles.subtitle}>@iota on X</Text>
        </View>
        <Pressable
          style={styles.openXBtn}
          onPress={() => Linking.openURL("https://x.com/iota")}
        >
          <Text style={styles.openXBtnText}>Open X</Text>
        </Pressable>
      </View>

      {/* Feed */}
      <FlatList
        data={tweets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.mint}
            colors={[Palette.mint]}
          />
        }
        ListHeaderComponent={
          <View style={styles.feedHeader}>
            <View style={styles.feedHeaderDot} />
            <Text style={styles.feedHeaderText}>
              Latest from the official IOTA account
            </Text>
          </View>
        }
      />
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
  subtitle: {
    color: Palette.steel,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  openXBtn: {
    backgroundColor: Palette.slate,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 3,
  },
  openXBtnText: {
    color: Palette.sky,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },

  // Feed
  feedContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },
  feedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  feedHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.mint,
  },
  feedHeaderText: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // Tweet card
  tweetCard: {
    backgroundColor: Palette.slate,
    borderRadius: Radius["2xl"],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Palette.ash,
    marginRight: Spacing.sm,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  authorName: {
    color: Palette.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  verifiedBadge: {
    color: Palette.sky,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  handle: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  timestamp: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },

  // Content
  tweetContent: {
    color: Palette.cloud,
    fontSize: FontSize.base,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing["2xs"] + 1,
  },
  tagText: {
    color: Palette.void,
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },

  // Engagement
  engagementRow: {
    flexDirection: "row",
    gap: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.ash,
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  engagementIcon: {
    fontSize: 14,
  },
  engagementCount: {
    color: Palette.steel,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
});
