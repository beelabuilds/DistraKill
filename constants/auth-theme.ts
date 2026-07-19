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

export type ThemeMode = 'light' | 'dark';

export type AuthTheme = {
  background: string;
  surface: string;
  surfaceSoft: string;
  inputBackground: string;
  primary: string;
  secondary: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  glow: string;
  buttonText: string;
};

export const AuthPalette: Record<ThemeMode, AuthTheme> = {
  light: {
    // Quran-inspired cream background
    background: '#F7F4EF',

    // Cream-colored cards
    surface: '#F8F1E1',

    // Pale blue decorative areas
    surfaceSoft: '#EAF1F6',

    // Input fields
    inputBackground: '#FFFDF8',

    // Main Quran-inspired blue
    primary: '#8BAAC9',

    // Secondary blue-gray
    secondary: '#7893A3',

    // Main dark text
    text: '#3E454D',

    // Muted text
    textMuted: '#747B80',

    // Soft gray-beige borders
    border: '#DED9D1',

    error: '#C95C56',

    glow: 'rgba(139, 170, 201, 0.20)',

    buttonText: '#FFFFFF',
  },

  dark: {
    // Keep the original dark theme
    background: '#182933',
    surface: '#304753',
    surfaceSoft: '#384E4C',
    inputBackground: '#182933',
    primary: '#BCD0D5',
    secondary: '#7999A4',
    text: '#FFFFFF',
    textMuted: '#7999A4',
    border: '#496772',
    error: '#F97066',
    glow: 'rgba(188, 208, 213, 0.12)',
    buttonText: '#182933',
  },
};

export const Spacing = AuthMetrics.spacing;
export const Radius = AuthMetrics.radius;
export const Typography = AuthMetrics.typography;