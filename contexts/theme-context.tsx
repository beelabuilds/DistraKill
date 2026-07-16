import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    AuthPalette,
    type AuthTheme,
    type ThemeMode,
} from '@/constants/auth-theme';

const THEME_STORAGE_KEY = '@distrakill/theme-mode';

type AppThemeContextValue = {
  mode: ThemeMode;
  theme: AuthTheme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const AppThemeContext = createContext<AppThemeContextValue | undefined>(
  undefined,
);

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({
  children,
}: AppThemeProviderProps) {
  // Start with the existing dark appearance.
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    let isMounted = true;

    async function loadSavedTheme() {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (
          isMounted &&
          (savedMode === 'light' || savedMode === 'dark')
        ) {
          setMode(savedMode);
        }
      } catch (error) {
        console.warn('Unable to load saved theme:', error);
      }
    }

    void loadSavedTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);

    void AsyncStorage.setItem(
      THEME_STORAGE_KEY,
      newMode,
    ).catch((error) => {
      console.warn('Unable to save theme:', error);
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => {
      const nextMode =
        currentMode === 'dark' ? 'light' : 'dark';

      void AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        nextMode,
      ).catch((error) => {
        console.warn('Unable to save theme:', error);
      });

      return nextMode;
    });
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      theme: AuthPalette[mode],
      toggleTheme,
      setThemeMode,
    }),
    [mode, setThemeMode, toggleTheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error(
      'useAppTheme must be used inside AppThemeProvider.',
    );
  }

  return context;
}