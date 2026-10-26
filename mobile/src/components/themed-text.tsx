import { StyleSheet, type TextProps } from 'react-native';
import { Text } from '@/components/text';

import { fam, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /**
   * Tipografía de la app. Los títulos de pantalla NO se declaran aquí:
   * se renderizan con `ScreenHeader` (jerarquía única de 28/800).
   */
  type?: 'default' | 'small' | 'smallBold';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: fam(500),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontFamily: fam(700),
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontFamily: fam(500),
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
});
