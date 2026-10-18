import { ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Spacing } from '@/constants/theme';
import { Screen } from '@/components/ui/screen';

interface LoadingProps {
  mensaje?: string;
}

/** Pantalla de carga a pantalla completa. */
export function Loading({ mensaje = 'Cargando…' }: LoadingProps) {
  const theme = useTheme();

  return (
    <Screen scroll={false} contentStyle={styles.contenido}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.texto, { color: theme.textSecondary }]}>{mensaje}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contenido: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  texto: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
  },
});
