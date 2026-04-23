import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts, FontSize, FontWeight, Radius, Spacing } from "@/constants/theme";
import { useSettings, type ThemeType, type RefreshInterval } from "@/hooks/use-settings";

// Custom animated toggle switch
function CustomSwitch({ value, onValueChange, activeColor, inactiveColor }: { value: boolean, onValueChange: (val: boolean) => void, activeColor: string, inactiveColor: string }) {
  const trackStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(value ? activeColor : inactiveColor, { duration: 250 }),
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(value ? 24 : 2, { damping: 15, stiffness: 120 }) }],
    };
  });

  return (
    <Pressable onPress={() => onValueChange(!value)} style={styles.switchContainer}>
      <Animated.View style={[styles.switchTrack, trackStyle]}>
        <Animated.View style={[styles.switchThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

// Custom segment control
function SegmentControl<T extends string | number>({
  options,
  selectedValue,
  onSelect,
  activeColors,
}: {
  options: { label: string; value: T }[];
  selectedValue: T;
  onSelect: (val: T) => void;
  activeColors: any;
}) {
  return (
    <View style={[styles.segmentContainer, { backgroundColor: activeColors.background, borderColor: activeColors.borderSubtle }]}>
      {options.map((opt) => {
        const isActive = selectedValue === opt.value;
        return (
          <Pressable
            key={String(opt.value)}
            style={[
              styles.segmentButton,
              isActive && { backgroundColor: activeColors.tint },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: isActive ? activeColors.background : activeColors.textSecondary },
                isActive && { fontWeight: FontWeight.bold },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    theme,
    setTheme,
    refreshInterval,
    setRefreshInterval,
    autoRotation,
    setAutoRotation,
    clearCache,
    activeColors,
    activePalette,
  } = useSettings();

  const [cacheCleared, setCacheCleared] = React.useState(false);

  const handleClearCache = async () => {
    await clearCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const isLight = theme === "light";

  return (
    <View style={[styles.container, { backgroundColor: activeColors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: activeColors.text }]}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* APPEARANCE */}
        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="paintbrush.fill" size={20} color={activeColors.tint} />
            <Text style={[styles.cardTitle, { color: activeColors.text }]}>Appearance</Text>
          </View>
          
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: activeColors.text }]}>Theme</Text>
              <Text style={[styles.sublabel, { color: activeColors.textSecondary }]}>Toggle light or dark mode</Text>
            </View>
            <CustomSwitch
              value={isLight}
              onValueChange={(val) => setTheme(val ? "light" : "dark")}
              activeColor={activeColors.tint}
              inactiveColor={activePalette.ash}
            />
          </View>
        </View>

        {/* DATA & NETWORK */}
        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="network" size={20} color={activeColors.tint} />
            <Text style={[styles.cardTitle, { color: activeColors.text }]}>Data & Network</Text>
          </View>

          <View style={styles.rowColumn}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: activeColors.text }]}>Refresh Interval</Text>
              <Text style={[styles.sublabel, { color: activeColors.textSecondary }]}>
                How often to fetch blockchain state
              </Text>
            </View>
            <SegmentControl
              options={[
                { label: "15s", value: 15000 },
                { label: "30s", value: 30000 },
                { label: "60s", value: 60000 },
              ]}
              selectedValue={refreshInterval}
              onSelect={(val) => setRefreshInterval(val as RefreshInterval)}
              activeColors={activeColors}
            />
          </View>
        </View>

        {/* BEHAVIOR */}
        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="sparkles" size={20} color={activeColors.tint} />
            <Text style={[styles.cardTitle, { color: activeColors.text }]}>Experience</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: activeColors.text }]}>Auto-Rotation</Text>
              <Text style={[styles.sublabel, { color: activeColors.textSecondary }]}>
                Slowly rotate the globe when idle
              </Text>
            </View>
            <CustomSwitch
              value={autoRotation}
              onValueChange={setAutoRotation}
              activeColor={activeColors.tint}
              inactiveColor={activePalette.ash}
            />
          </View>
        </View>

        {/* ADVANCED */}
        <View style={[styles.card, { backgroundColor: activeColors.surfaceElevated }]}>
          <View style={styles.cardHeader}>
            <IconSymbol name="wrench.and.screwdriver.fill" size={20} color={activeColors.tint} />
            <Text style={[styles.cardTitle, { color: activeColors.text }]}>Advanced</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: activeColors.tint },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleClearCache}
          >
            <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>
              {cacheCleared ? "Cache Cleared!" : "Clear Location Cache"}
            </Text>
          </Pressable>
          <Text style={[styles.sublabel, { color: activeColors.textSecondary, marginTop: Spacing.md, textAlign: "center" }]}>
            Forces a fresh DNS and GeoIP resolution on next launch.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: FontSize["2xl"],
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    // Note: No shadows to maintain the premium flat aesthetic
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowColumn: {
    flexDirection: "column",
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  sublabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: Spacing.base,
  },
  // Switch styles
  switchContainer: {
    width: 52,
    height: 30,
    justifyContent: "center",
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  // Segment control
  segmentContainer: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    padding: 4,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  segmentText: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  // Action Button
  actionButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
  },
  actionButtonText: {
    fontFamily: Fonts.sans,
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
});
