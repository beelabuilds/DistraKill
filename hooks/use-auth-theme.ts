import { useAppTheme } from '@/contexts/theme-context';

export function useAuthTheme() {
  const { theme } = useAppTheme();

  return theme;
}