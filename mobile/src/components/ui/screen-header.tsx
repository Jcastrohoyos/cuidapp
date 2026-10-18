import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

interface ScreenHeaderProps {
  titulo: string;
  subtitulo?: string;
  /**
   * 'atras' → botón ‹ (pantallas apiladas) · 'cerrar' → ✕ (modales) ·
   * 'ninguno' → solo texto (pestañas, donde ya existe la barra nativa).
   */
  variante?: 'atras' | 'cerrar' | 'ninguno';
  /** Sustituye el `router.back()` por defecto (p. ej. cerrar con navegación propia). */
  onAccion?: () => void;
}

/** Cabecera común: garantiza salida visible + jerarquía tipográfica consistente. */
export function ScreenHeader({ titulo, subtitulo, variante = 'atras', onAccion }: ScreenHeaderProps) {
  const theme = useTheme();
  const esCierre = variante === 'cerrar';

  const pulsar = () => {
    if (onAccion) onAccion();
    else router.back();
  };

  return (
    <View style={styles.contenedor}>
      {variante !== 'ninguno' ? (
        <Pressable
          onPress={pulsar}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={esCierre ? 'Cerrar pantalla' : 'Volver'}
          accessibilityHint={esCierre ? 'Cierra esta pantalla' : 'Vuelve a la pantalla anterior'}
          style={({ pressed }) => [
            styles.boton,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            pressed && styles.pulsado,
          ]}>
          <Text style={[styles.glifo, esCierre && styles.glifoCierre, { color: theme.text }]}>
            {esCierre ? '✕' : '‹'}
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: theme.text }]} accessibilityRole="header">
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.subtitulo, { color: theme.textSecondary }]}>{subtitulo}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.two,
  },
  boton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsado: {
    opacity: 0.7,
  },
  glifo: {
    fontFamily: fam(600),
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  glifoCierre: {
    fontFamily: fam(400),
    fontSize: 16,
    lineHeight: 18,
  },
  textos: {
    gap: Spacing.one,
  },
  titulo: {
    fontFamily: fam(800),
    fontSize: FontSize['2xl'],
    lineHeight: 34,
    fontWeight: '800',
  },
  subtitulo: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
