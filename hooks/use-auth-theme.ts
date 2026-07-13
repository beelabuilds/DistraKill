import { AuthPalette } from '@/constants/auth-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAuthTheme() {
  const scheme = useColorScheme() ?? 'light';
  return AuthPalette[scheme === 'dark' ? 'dark' : 'light'];
}
