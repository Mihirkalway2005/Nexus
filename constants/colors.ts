/**
 * Nexus Design Tokens — Three themes: light, dark, warm.
 * Each theme is a complete set of semantic color roles.
 * Components consume these via useTheme() — never hardcode hex values.
 */

export type ThemeName = "light" | "dark" | "warm";

export interface ColorTokens {
  // Backgrounds
  bg: string;
  bgCard: string;
  bgInput: string;
  bgMuted: string;

  // Borders
  border: string;
  borderSubtle: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand
  accent: string;           // Primary interactive color
  accentMuted: string;      // Softer accent for backgrounds
  accentText: string;       // Text on top of accent fills

  // Semantic
  success: string;
  warning: string;
  danger: string;

  // Tab / Nav
  tabActive: string;
  tabInactive: string;
}

export const themes: Record<ThemeName, ColorTokens> = {
  dark: {
    bg: "#0a0a0f",
    bgCard: "#111118",
    bgInput: "#16161f",
    bgMuted: "#1a1a24",

    border: "#2a2a38",
    borderSubtle: "#1e1e28",

    textPrimary: "#f0f0f8",
    textSecondary: "#9898b8",
    textMuted: "#55556a",
    textInverse: "#0a0a0f",

    accent: "#7c6ff7",
    accentMuted: "#7c6ff718",
    accentText: "#ffffff",

    success: "#34d399",
    warning: "#fbbf24",
    danger: "#f87171",

    tabActive: "#7c6ff7",
    tabInactive: "#44445a",
  },

  light: {
    bg: "#f8f8fc",
    bgCard: "#ffffff",
    bgInput: "#f2f2f8",
    bgMuted: "#eeeef6",

    border: "#e0e0ec",
    borderSubtle: "#eaeaf2",

    textPrimary: "#0f0f1a",
    textSecondary: "#555568",
    textMuted: "#9898aa",
    textInverse: "#ffffff",

    accent: "#6657e8",
    accentMuted: "#6657e810",
    accentText: "#ffffff",

    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",

    tabActive: "#6657e8",
    tabInactive: "#aaaabc",
  },

  warm: {
    bg: "#16120e",
    bgCard: "#1e1912",
    bgInput: "#241f16",
    bgMuted: "#2a2418",

    border: "#3a3020",
    borderSubtle: "#302820",

    textPrimary: "#f5ede0",
    textSecondary: "#a89078",
    textMuted: "#6a5840",
    textInverse: "#16120e",

    accent: "#e8a045",
    accentMuted: "#e8a04518",
    accentText: "#16120e",

    success: "#86efac",
    warning: "#fcd34d",
    danger: "#fca5a5",

    tabActive: "#e8a045",
    tabInactive: "#5a4830",
  },
};

/** Category colors for the budget breakdown chart. */
export const CATEGORY_COLORS = {
  Food: "#7c6ff7",
  Travel: "#34d399",
  Essentials: "#fbbf24",
  Entertainment: "#f472b6",
  Other: "#94a3b8",
};

/** Course color palette — users pick from these. */
export const COURSE_COLORS = [
  "hsl(258,80%,65%)",
  "hsl(162,60%,55%)",
  "hsl(38,90%,60%)",
  "hsl(330,70%,62%)",
  "hsl(200,80%,58%)",
  "hsl(20,85%,60%)",
];
