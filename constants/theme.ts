/**
 * OmniSphere Design System — Modern Web3 Aesthetic
 *
 * Deep dark backgrounds (#0B0D14), vibrant blue (#3B82F6) accents,
 * pure white primary text, muted slate secondaries.
 * Ultra-thin borders, transparent card fills, generous whitespace.
 */

import { Platform } from "react-native";

// ─── Color Palette ───────────────────────────────────────────────────────────

export const Palette = {
  // Core backgrounds — deep dark
  void: "#05060A",
  obsidian: "#0B0D14",
  graphite: "#10131C",
  slate: "#181C28",
  ash: "#232838",
  steel: "#5A607A",
  silver: "#8A93A6",
  mist: "#B0B8CA",
  cloud: "#D0D6E2",
  snow: "#EDF0F7",
  white: "#FFFFFF",

  // Primary accent — vibrant blue
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  blueDim: "#2563EB",
  blueMuted: "#1D4ED8",

  // Secondary accents
  teal: "#2DD4BF",
  violet: "#8B5CF6",
  indigo: "#6366F1",
  cyan: "#22D3EE",

  // Semantic colors
  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Transparency helpers
  white02: "rgba(255, 255, 255, 0.02)",
  white03: "rgba(255, 255, 255, 0.03)",
  white04: "rgba(255, 255, 255, 0.04)",
  white05: "rgba(255, 255, 255, 0.05)",
  white06: "rgba(255, 255, 255, 0.06)",
  white08: "rgba(255, 255, 255, 0.08)",
  white10: "rgba(255, 255, 255, 0.10)",
  white15: "rgba(255, 255, 255, 0.15)",
  white20: "rgba(255, 255, 255, 0.20)",
  white40: "rgba(255, 255, 255, 0.40)",
  white60: "rgba(255, 255, 255, 0.60)",
  white80: "rgba(255, 255, 255, 0.80)",
  black40: "rgba(0, 0, 0, 0.40)",
  black60: "rgba(0, 0, 0, 0.60)",
  blue12: "rgba(59, 130, 246, 0.12)",
  blue08: "rgba(59, 130, 246, 0.08)",
  blue20: "rgba(59, 130, 246, 0.20)",
} as const;

// ─── Theme Colors ────────────────────────────────────────────────────────────

export const Colors = {
  dark: {
    background: Palette.void,
    surface: Palette.obsidian,
    surfaceElevated: Palette.graphite,
    card: Palette.slate,
    border: Palette.ash,
    borderSubtle: Palette.white06,
    text: Palette.white,
    textSecondary: Palette.silver,
    textMuted: Palette.steel,
    tint: Palette.blue,
    tintSecondary: Palette.violet,
    icon: Palette.silver,
    tabIconDefault: Palette.steel,
    tabIconSelected: Palette.blue,
    statusBar: "light" as const,
  },
  light: {
    background: "#F0F4F8",
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    borderSubtle: "rgba(0, 0, 0, 0.06)",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    tint: "#3B82F6",
    tintSecondary: "#7C3AED",
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#3B82F6",
    statusBar: "dark" as const,
  },
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', SFMono-Regular, Menlo, monospace",
  },
})!;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  "2xl": 30,
  "3xl": 36,
  "4xl": 48,
  hero: 64,
} as const;

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const Spacing = {
  "2xs": 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  "6xl": 80,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 28,
  full: 9999,
} as const;

// ─── Shadows (subtle — no harsh drops) ───────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  }),
} as const;

// ─── Gradients ───────────────────────────────────────────────────────────────

export const Gradients = {
  primary: [Palette.blue, Palette.blueDim],
  accent: [Palette.violet, Palette.indigo],
  surface: [Palette.obsidian, Palette.graphite],
  card: [Palette.white02, Palette.white04],
  blueGlow: [Palette.blue12, "transparent"],
} as const;

// ─── Animation Durations ─────────────────────────────────────────────────────

export const Duration = {
  fast: 150,
  normal: 300,
  slow: 500,
  glacial: 1000,
} as const;

// ─── Z-Index Scale ───────────────────────────────────────────────────────────

export const ZIndex = {
  base: 0,
  card: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;
