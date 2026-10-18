import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Radius } from '@/constants/theme';

// En web no existe el módulo nativo de animación: hay que usar el driver JS.
const DRIVER_NATIVO = Platform.OS !== 'web';

interface SkeletonProps {
  /** Ancho del bloque (px o porcentaje). Si se omite, lo da el contenedor. */
  ancho?: number | `${number}%`;
  /** Alto en puntos (por defecto 16 = una línea de texto). */
  alto?: number;
  radio?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Bloque de carga con pulso (shimmer sencillo). Se usa en lugar del spinner
 * a pantalla completa cuando ya se conoce la forma del contenido: reduce el
 * flash percibido al navegar. Respeta "Reducir movimiento" del sistema.
 * El ancho por defecto lo da el contenedor (stretch); en filas se acota con `style`.
 */
export function Skeleton({ ancho, alto = 16, radio = Radius.sm, style }: SkeletonProps) {
  const theme = useTheme();
  const [opacidad] = useState(() => new Animated.Value(0.55));

  useEffect(() => {
    let montado = true;
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 1, duration: 650, useNativeDriver: DRIVER_NATIVO }),
        Animated.timing(opacidad, { toValue: 0.4, duration: 650, useNativeDriver: DRIVER_NATIVO }),
      ]),
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (montado && !reduce) pulso.start();
    });
    return () => {
      montado = false;
      pulso.stop();
    };
  }, [opacidad]);

  return (
    <Animated.View
      aria-busy
      style={[
        styles.bloque,
        { height: alto, borderRadius: radio, backgroundColor: theme.skeleton, opacity: opacidad },
        ancho !== undefined ? { width: ancho } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bloque: {
    overflow: 'hidden',
  },
});
