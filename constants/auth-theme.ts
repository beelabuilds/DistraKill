export const AuthMetrics = {
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 24,
    pill: 999,
  },
  typography: {
    caption: 12,
    label: 14,
    body: 16,
    button: 16,
    title: 24,
    display: 34,
  },
} as const;

export const AuthPalette = {
  light: {
    background: "#182933",
    surface: "#304753",
    surfaceSoft: "#384E4C",
    inputBackground: "#182933",
    primary: "#BCD0D5",
    secondary: "#7999A4",
    text: "#FFFFFF",
    textMuted: "#7999A4",
    border: "#496772",
    error: "#F97066",
    glow: "rgba(188, 208, 213, 0.12)",
    buttonText: "#182933",
  },
  dark: {
    background: "#182933",
    surface: "#304753",
    surfaceSoft: "#384E4C",
    inputBackground: "#182933",
    primary: "#BCD0D5",
    secondary: "#7999A4",
    text: "#FFFFFF",
    textMuted: "#7999A4",
    border: "#496772",
    error: "#F97066",
    glow: "rgba(188, 208, 213, 0.12)",
    buttonText: "#182933",
  },
} as const;

export type AuthTheme = typeof AuthPalette.light;

export const Spacing = AuthMetrics.spacing;
export const Radius = AuthMetrics.radius;
export const Typography = AuthMetrics.typography;
