/**
 * OmniSphere Design System
 * Premium crypto-aesthetic theme with dark-first palette.
 * IOTA-inspired accent colors with glassmorphism support.
 */

import { Platform } from "react-native";

// ─── Color Palette ───────────────────────────────────────────────────────────

export const Palette = {
  // Core blacks & grays (dark mode primaries)
  void: "#05060A",
  obsidian: "#0A0E17",
  graphite: "#111827",
  slate: "#1E293B",
  ash: "#334155",
  steel: "#64748B",
  silver: "#94A3B8",
  mist: "#CBD5E1",
  cloud: "#E2E8F0",
  snow: "#F8FAFC",

  // IOTA accent spectrum
  cyan: "#1AB3FF",
  cyanLight: "#66CCFF",
  cyanDim: "#008CCC",
  teal: "#0284C7",

  // Secondary accents
  violet: "#8B5CF6",
  violetLight: "#A78BFA",
  indigo: "#6366F1",
  blue: "#3B82F6",
  rose: "#F43F5E",

  // Semantic colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",

  // Transparency helpers
  white05: "rgba(255, 255, 255, 0.05)",
  white08: "rgba(255, 255, 255, 0.08)",
  white10: "rgba(255, 255, 255, 0.10)",
  white15: "rgba(255, 255, 255, 0.15)",
  white20: "rgba(255, 255, 255, 0.20)",
  white40: "rgba(255, 255, 255, 0.40)",
  white60: "rgba(255, 255, 255, 0.60)",
  white80: "rgba(255, 255, 255, 0.80)",
  black40: "rgba(0, 0, 0, 0.40)",
  black60: "rgba(0, 0, 0, 0.60)",
  cyan20: "rgba(26, 179, 255, 0.20)",
  cyan10: "rgba(26, 179, 255, 0.10)",
  violet20: "rgba(139, 92, 246, 0.20)",
} as const;

// ─── Theme Colors ────────────────────────────────────────────────────────────

export const Colors = {
  dark: {
    background: Palette.void,
    surface: Palette.obsidian,
    surfaceElevated: Palette.graphite,
    card: Palette.slate,
    border: Palette.ash,
    borderSubtle: Palette.white08,
    text: Palette.snow,
    textSecondary: Palette.silver,
    textMuted: Palette.steel,
    tint: Palette.cyan,
    tintSecondary: Palette.violet,
    icon: Palette.silver,
    tabIconDefault: Palette.steel,
    tabIconSelected: Palette.cyan,
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
    tint: "#0D9488",
    tintSecondary: "#7C3AED",
    icon: "#64748B",
    tabIconDefault: "#94A3B8",
    tabIconSelected: "#0D9488",
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  "2xl": 28,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  }),
} as const;

// ─── Gradients (for LinearGradient usage) ────────────────────────────────────

export const Gradients = {
  primary: [Palette.cyan, Palette.teal],
  accent: [Palette.violet, Palette.indigo],
  surface: [Palette.obsidian, Palette.graphite],
  card: [Palette.white05, Palette.white08],
  cyanGlow: [Palette.cyan20, "transparent"],
  violetGlow: [Palette.violet20, "transparent"],
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
