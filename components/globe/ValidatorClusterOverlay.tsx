import {
    FontSize,
    FontWeight,
    Palette,
    Radius,
    Spacing,
} from "@/constants/theme";
import type { ValidatorSummary } from "@/services/validators";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

interface ValidatorClusterOverlayProps {
  validators: ValidatorSummary[];
  onClose: () => void;
}

function truncateAddress(address: string): string {
  return address.length > 14
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : address;
}

export default function ValidatorClusterOverlay({
  validators,
  onClose,
}: ValidatorClusterOverlayProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.container}>
      <View style={styles.card}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Dense Cluster</Text>
            <Text style={styles.subtitle}>
              {validators.length} validators in tap range
            </Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}>
          {validators.map((validator) => (
            <View key={validator.iotaAddress} style={styles.row}>
              <View style={styles.rowMarker} />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {validator.name || "Unknown Validator"}
                </Text>
                <Text style={styles.rowAddress} numberOfLines={1}>
                  {truncateAddress(validator.iotaAddress)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["2xl"],
  },
  card: {
    backgroundColor: "rgba(10, 14, 23, 0.94)",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: "rgba(26, 179, 255, 0.18)",
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Palette.ash,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: Palette.snow,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  subtitle: {
    marginTop: 2,
    color: Palette.steel,
    fontSize: FontSize.xs,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Palette.white10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: Palette.silver,
    fontSize: FontSize.sm,
  },
  list: {
    maxHeight: 240,
  },
  listContent: {
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Palette.white05,
    borderColor: Palette.white10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowMarker: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: Palette.cyan,
    borderWidth: 1,
    borderColor: "rgba(223, 247, 255, 0.95)",
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
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: "monospace",
  },
});
