import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { fam, FontSize, Spacing } from '@/constants/theme';

interface ErrorStateProps {
  titulo?: string;
  descripcion?: string;
  accion?: { texto: string; onPress: () => void };
}

/**
 * Estado de error de pantalla. Equivalente a `EmptyState`: aquí el dato existe
 * pero no se pudo cargar — siempre ofrece un reintento para no dejar a la
 * familia en un callejón sin salida.
 */
export function ErrorState({
  titulo = 'No hemos podido cargar la información',
  descripcion = 'Revisa tu conexión a internet e inténtalo de nuevo. Tus datos siguen guardados.',
  accion,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.contenedor}>
      <View style={[styles.icono, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
        <Text style={[styles.marca, { color: theme.danger }]} accessible={false}>
          !
        </Text>
      </View>
      <Text style={[styles.titulo, { color: theme.text }]}>{titulo}</Text>
      <Text style={[styles.descripcion, { color: theme.textSecondary }]}>{descripcion}</Text>
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
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  marca: {
    fontFamily: fam(800),
    fontSize: FontSize.xl,
    fontWeight: '800',
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
    lineHeight: 20,
    textAlign: 'center',
  },
});
