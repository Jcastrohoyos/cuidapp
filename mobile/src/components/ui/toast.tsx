import { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { useToastStore, type TipoAviso } from '@/store/toast-store';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

const GLIFO: Record<TipoAviso, string> = { exito: '✓', error: '!', info: 'i' };

// react-native-web no tiene módulo nativo de animación: usar el driver nativo
// allí solo genera el warning "useNativeDriver is not supported". En nativo sí.
const DRIVER_NATIVO = Platform.OS !== 'web';

/**
 * Contenedor del aviso global. Se monta una sola vez en `AppProviders`,
 * superpuesto a la app, y desaparece solo a los pocos segundos.
 */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const aviso = useToastStore((estado) => estado.aviso);
  const ocultar = useToastStore((estado) => estado.ocultar);

  const id = aviso?.id;
  // Animated.Value estable entre renders (estado sin disparar re-renders al
  // mutar: Animated no pasa por setState).
  const [opacidad] = useState(() => new Animated.Value(0));
  const [desplazamiento] = useState(() => new Animated.Value(12));

  useEffect(() => {
    if (!id) return;
    opacidad.setValue(0);
    desplazamiento.setValue(12);
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: 200, useNativeDriver: DRIVER_NATIVO }),
      Animated.spring(desplazamiento, { toValue: 0, friction: 8, useNativeDriver: DRIVER_NATIVO }),
    ]).start();
  }, [id, opacidad, desplazamiento]);

  if (!aviso) return null;

  const colores: Record<TipoAviso, { fondo: string; borde: string; texto: string; glifo: string }> = {
    exito: { fondo: theme.successSoft, borde: theme.success, texto: theme.text, glifo: theme.success },
    error: { fondo: theme.dangerSoft, borde: theme.danger, texto: theme.text, glifo: theme.danger },
    info: { fondo: theme.backgroundSelected, borde: theme.borderStrong, texto: theme.text, glifo: theme.textSecondary },
  };
  const c = colores[aviso.tipo];

  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: insets.bottom + Spacing.three }]}>
      <Animated.View style={{ opacity: opacidad, transform: [{ translateY: desplazamiento }] }}>
        <Pressable
          onPress={ocultar}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${aviso.mensaje}. Toca para cerrar.`}
          style={[styles.aviso, { backgroundColor: c.fondo, borderColor: c.borde }]}>
          <View style={[styles.circulo, { borderColor: c.glifo }]}>
            <Text style={[styles.glifo, { color: c.glifo }]} accessible={false}>
              {GLIFO[aviso.tipo]}
            </Text>
          </View>
          <Text style={[styles.mensaje, { color: c.texto }]}>{aviso.mensaje}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 520,
    width: '100%',
    paddingVertical: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    // Elevación mínima para separar el banner del contenido subyacente.
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  circulo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glifo: {
    fontFamily: fam(800),
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  mensaje: {
    fontFamily: fam(600),
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontWeight: '600',
  },
});
