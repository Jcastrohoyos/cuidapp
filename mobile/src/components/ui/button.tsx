import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { forwardRef } from 'react';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamano = 'md' | 'sm';

interface ButtonProps {
  titulo: string;
  onPress?: () => void;
  variante?: Variante;
  tamano?: Tamano;
  disabled?: boolean;
  cargando?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(({
  titulo,
  onPress,
  variante = 'primary',
  tamano = 'md',
  disabled,
  cargando,
  fullWidth,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const inactivo = disabled || cargando;

  const colores: Record<Variante, { fondo: string; texto: string; borde: string }> = {
    primary: { fondo: theme.primary, texto: theme.primaryText, borde: theme.primary },
    secondary: { fondo: theme.primarySoft, texto: theme.primary, borde: theme.primarySoftStrong },
    ghost: { fondo: 'transparent', texto: theme.text, borde: theme.borderStrong },
    danger: { fondo: theme.dangerSoft, texto: theme.danger, borde: theme.danger },
  };
  const c = colores[variante];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      disabled={inactivo}
      onPress={onPress}
      hitSlop={tamano === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        tamano === 'sm' && styles.sm,
        fullWidth && styles.fullWidth,
        { backgroundColor: c.fondo, borderColor: c.borde },
        pressed && styles.pressed,
        inactivo && styles.disabled,
        style,
      ]}>
      {cargando ? (
        <ActivityIndicator size="small" color={c.texto} />
      ) : (
        <View style={styles.contenido}>
          <Text style={[styles.texto, tamano === 'sm' && styles.textoSm, { color: c.texto }]}>
            {titulo}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    // 40pt + hitSlop(4) = 48pt de objetivo táctil efectivo (HIG recomienda 44).
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  texto: {
    fontFamily: fam(700),
    fontSize: FontSize.base,
    fontWeight: '700',
  },
  textoSm: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
