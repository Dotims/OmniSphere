/**
 * OmniSphere Design System — Premium Soft Dark Theme
 *
 * True black background (#0A0A0C), vibrant blue (#3B82F6) primary accent,
 * aggressive border radius (24–32px), zero borders / shadows,
 * extremely large bold data values, muted tiny labels.
 * Soft pastel colors retained for secondary accents (cards, badges).
 */

import { Platform } from "react-native";

// ─── Color Palette ───────────────────────────────────────────────────────────

export const Palette = {
  // Core backgrounds — true black
  void: "#0A0A0C",
  obsidian: "#0A0A0C",
  graphite: "#141416",
  slate: "#1C1C1E",
  ash: "#2C2C2E",
  steel: "#636366",
  silver: "#8E8E93",
  mist: "#AEAEB2",
  cloud: "#D1D1D6",
  snow: "#F2F2F7",
  white: "#FFFFFF",

  // Primary accent — vibrant blue (restored)
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  blueDim: "#2563EB",
  blueMuted: "#1D4ED8",

  // Soft pastel accents (for secondary UI elements)
  mint: "#A8F0D4",
  mintSoft: "#D4FAE9",
  mintDim: "#3DDEA0",
  peach: "#FFD5C2",
  peachSoft: "#FFE8DD",
  peachDim: "#FF9F7A",
  yellow: "#FFF3C4",
  yellowSoft: "#FFF9E0",
  yellowDim: "#FFD95C",
  lavender: "#D8C4F6",
  lavenderSoft: "#EDE0FF",
  lavenderDim: "#A78BFA",
  sky: "#BAE6FD",
  skySoft: "#E0F2FE",
  skyDim: "#38BDF8",
  rose: "#FFC9D5",
  roseSoft: "#FFE4EC",
  roseDim: "#F472B6",

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
    surface: Palette.graphite,
    surfaceElevated: Palette.slate,
    card: Palette.slate,
    border: "transparent",
    borderSubtle: "transparent",
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

// ─── Border Radius — aggressive round ────────────────────────────────────────

export const Radius = {
  sm: 12,
  md: 20,
  lg: 24,
  xl: 28,
  "2xl": 32,
  full: 9999,
} as const;

// ─── Shadows — NONE for premium flat aesthetic ───────────────────────────────

export const Shadows = {
  sm: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  lg: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  glow: (_color: string) => ({
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  }),
} as const;

// ─── Gradients ───────────────────────────────────────────────────────────────

export const Gradients = {
  primary: [Palette.blue, Palette.blueDim],
  accent: [Palette.violet, Palette.indigo],
  surface: [Palette.graphite, Palette.slate],
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
