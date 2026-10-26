import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

interface ProgressBarProps {
  /** Progreso de 0 a 100. */
  valor: number;
  etiqueta?: string;
  detalle?: string;
}

export function ProgressBar({ valor, etiqueta, detalle }: ProgressBarProps) {
  const theme = useTheme();
  const ancho = Math.max(0, Math.min(100, valor));

  return (
    <View style={styles.contenedor}>
      {etiqueta || detalle ? (
        <View style={styles.cabecera}>
          {etiqueta ? <Text style={[styles.etiqueta, { color: theme.textSecondary }]}>{etiqueta}</Text> : null}
          {detalle ? <Text style={[styles.detalle, { color: theme.text }]}>{detalle}</Text> : null}
        </View>
      ) : null}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: ancho }}
        style={[styles.pista, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.relleno, { width: `${ancho}%`, backgroundColor: theme.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.two,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiqueta: {
    fontFamily: fam(600),
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  detalle: {
    fontFamily: fam(700),
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  pista: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  relleno: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
