/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  // `useColorScheme` puede devolver null (el sistema no define esquema):
  // cualquier valor que no sea 'dark' se trata como claro.
  const theme = scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}
