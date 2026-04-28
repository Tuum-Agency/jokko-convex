export const theme = {
  ink: {
    100: "#F5F4F1",
    300: "#D7D3CC",
    500: "#8A847C",
    700: "#3F3B35",
    900: "#1A1814"
  },
  surface: {
    default: "#FAF9F7",
    raised: "#FFFFFF",
    sunken: "#EFEDE8"
  },
  accent: {
    primary: "#4A6CF7"
  },
  semantic: {
    success: "#4A8F6A",
    warning: "#C9883C",
    danger: "#C25450"
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
} as const;

export type Theme = typeof theme;
