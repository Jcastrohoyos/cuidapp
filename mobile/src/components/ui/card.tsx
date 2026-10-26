import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /** Aplica layout en fila (icono + contenido). */
  row?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Qué hace la tarjeta al pulsarla (lectores de pantalla). */
  accessibilityHint?: string;
}

export function Card({ children, onPress, row, style, accessibilityHint }: CardProps) {
  const theme = useTheme();
  const estilo = [
    styles.card,
    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
    row && styles.row,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [estilo, pressed && styles.pressed]}
        onPress={onPress}>
        {children}
      </Pressable>
    );
  }
  return <View style={estilo}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
});
