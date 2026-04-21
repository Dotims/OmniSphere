import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FontSize, FontWeight, Palette, Spacing } from "@/constants/theme";

export default function NewsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: 82 + insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>News</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>News feed coming soon.</Text>
      </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: Palette.steel,
    fontSize: FontSize.base,
  },
});
