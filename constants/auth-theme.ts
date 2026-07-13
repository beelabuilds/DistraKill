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
    background: '#F4F7FF',
    surface: '#FFFFFF',
    surfaceSoft: '#EEF3FF',
    inputBackground: '#FFFFFF',
    primary: '#4F46E5',
    secondary: '#14B8A6',
    text: '#16233D',
    textMuted: '#5D6B84',
    border: '#D4DDF0',
    error: '#B42318',
    glow: 'rgba(79, 70, 229, 0.14)',
  },
  dark: {
    background: '#0B1220',
    surface: '#111A2E',
    surfaceSoft: '#17233D',
    inputBackground: '#111A2E',
    primary: '#8B8CFF',
    secondary: '#2DD4BF',
    text: '#F5F7FF',
    textMuted: '#AAB4D1',
    border: '#24314D',
    error: '#F97066',
    glow: 'rgba(139, 140, 255, 0.20)',
  },
} as const;

export type AuthTheme = typeof AuthPalette.light;

export const Spacing = AuthMetrics.spacing;
export const Radius = AuthMetrics.radius;
export const Typography = AuthMetrics.typography;
