import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

interface StatProps {
  valor: string;
  etiqueta: string;
}

/** Indicador numérico usado en informes. */
export function Stat({ valor, etiqueta }: StatProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Text style={[styles.valor, { color: theme.primary }]}>{valor}</Text>
      <Text style={[styles.etiqueta, { color: theme.textSecondary }]} numberOfLines={2}>
        {etiqueta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    // 84pt: 3 cajas caben en pantallas de 320dp (252 + huecos ≤ 288 útiles).
    minWidth: 84,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  valor: {
    fontFamily: fam(800),
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  etiqueta: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
});
