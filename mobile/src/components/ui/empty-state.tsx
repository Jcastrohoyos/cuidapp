import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { fam, FontSize, Spacing } from '@/constants/theme';

interface EmptyStateProps {
  titulo: string;
  descripcion?: string;
  accion?: { texto: string; onPress: () => void };
}

export function EmptyState({ titulo, descripcion, accion }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.contenedor}>
      <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
      {descripcion ? (
        <Text style={[styles.descripcion, { color: theme.textSecondary }]}>{descripcion}</Text>
      ) : null}
      {accion ? (
        <Button titulo={accion.texto} onPress={accion.onPress} variante="secondary" tamano="sm" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  titulo: {
    fontFamily: fam(700),
    fontSize: FontSize.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  descripcion: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
