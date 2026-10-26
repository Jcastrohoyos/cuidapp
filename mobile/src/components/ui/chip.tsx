import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius } from '@/constants/theme';

interface ChipProps {
  texto: string;
  seleccionado?: boolean;
  onPress?: () => void;
}

export function Chip({ texto, seleccionado, onPress }: ChipProps) {
  const theme = useTheme();

  const contenido = (
    <Text
      style={[
        styles.texto,
        { color: seleccionado ? theme.primaryText : theme.textSecondary },
      ]}
      numberOfLines={1}>
      {texto}
    </Text>
  );

  const estilo = [
    styles.chip,
    {
      backgroundColor: seleccionado ? theme.primary : theme.backgroundElement,
      borderColor: seleccionado ? theme.primary : theme.border,
    },
  ];

  if (!onPress) {
    return <View style={estilo}>{contenido}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!seleccionado }}
      hitSlop={4}
      style={({ pressed }) => [estilo, styles.interactivo, pressed && styles.pressed]}
      onPress={onPress}>
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  /** Los chips seleccionables crecen a 40pt (+ hitSlop) para cumplir 44pt. */
  interactivo: {
    minHeight: 40,
  },
  texto: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
