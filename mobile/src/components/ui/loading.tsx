import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Spacing } from '@/constants/theme';
import { Screen } from '@/components/ui/screen';

interface LoadingProps {
  mensaje?: string;
  /**
   * Cabecera de la pantalla (con su botón de salida). En las pantallas
   * apiladas como modales, sin ella la familia se queda atrapada mientras
   * carga.
   */
  cabecera?: ReactNode;
}

/** Pantalla de carga a pantalla completa. */
export function Loading({ mensaje = 'Cargando…', cabecera }: LoadingProps) {
  const theme = useTheme();

  return (
    <Screen scroll={false}>
      {cabecera}
      <View style={styles.contenido}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.texto, { color: theme.textSecondary }]}>{mensaje}</Text>
      </View>
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
