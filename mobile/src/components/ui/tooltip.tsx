import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useEffect, useCallback } from 'react';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';

// Tipo genérico para cualquier ref que tenga measureInWindow
type RefTarget = React.RefObject<{ measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void } | null> | null;

interface TooltipProps {
  /** Clave única del tooltip (debe coincidir con ONBOARDING_KEYS). */
  clave: string;
  /** Texto que se muestra en la burbuja. */
  texto: string;
  /** Referencia al elemento que se resalta (target). */
  targetRef: RefTarget;
  /** Posición preferida de la burbuja respecto al target. */
  posicion?: 'arriba' | 'abajo' | 'izquierda' | 'derecha';
  /** Desplazamiento extra en px. */
  offset?: number;
  /** Callback cuando el usuario lo descarta. */
  onDescartar?: () => void;
  /** Si true, muestra un indicador de "pulsar para continuar". */
  mostrarContinuar?: boolean;
  /** Texto del botón de cerrar (por defecto "Entendido"). */
  textoCerrar?: string;
}

/**
 * Tooltip estilo coach-mark para onboarding.
 * - Se ancla a un targetRef y se posiciona automáticamente.
 * - Se descarta con tap fuera, botón, Escape (web) o gesto de arrastre.
 * - Animado con Reanimated 3 (nativo en iOS/Android, JS en web).
 */
export function Tooltip({
  clave,
  texto,
  targetRef,
  posicion = 'abajo',
  offset = 12,
  onDescartar,
  mostrarContinuar = false,
  textoCerrar = 'Entendido',
}: TooltipProps) {
  const theme = useTheme();
  const visible = useSharedValue(false);
  const targetLayout = useSharedValue<{ x: number; y: number; width: number; height: number } | null>(null);

  // Medir el target cuando se monta
  const medirTarget = useCallback(() => {
    if (!targetRef || !targetRef.current) return;
    targetRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      targetLayout.value = { x, y, width, height };
      visible.value = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- targetLayout y visible son shared values estables de Reanimated
  }, [targetRef]);

  const ocultar = () => {
    // eslint-disable-next-line react-hooks/immutability -- visible es shared value de Reanimated
    visible.value = false;
    onDescartar?.();
  };

  // Medir al montar (después del primer render)
  useEffect(() => {
    if (targetLayout.value === null) {
      medirTarget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- targetLayout.value es shared value estable
  }, [medirTarget]);

  if (!visible.value && targetLayout.value === null) {
    // Aún no medido: no renderizar nada
    return null;
  }

  const { x, y, width, height } = targetLayout.value ?? { x: 0, y: 0, width: 0, height: 0 };

  // Calcular posición de la burbuja
  const burbujaX = posicion === 'izquierda' ? x - offset - 280 : x + width / 2 - 140;
  const burbujaY =
    posicion === 'arriba'
      ? y - offset - 120
      : posicion === 'abajo'
      ? y + height + offset
      : y + height / 2 - 60;

  const handleTapFuera = Gesture.Tap().onEnd(() => ocultar());
  const handlePan = Gesture.Pan()
    .onEnd(() => {
      // Un swipe rápido descarta
      ocultar();
    });

  return (
    <GestureDetector gesture={Gesture.Simultaneous(handleTapFuera, handlePan)}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: visible.value ? 1 : 0,
          },
        ]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        pointerEvents="box-none"
      >
        {/* Spotlight: área oscurecida con hueco en el target */}
        <View style={styles.spotlightContainer} pointerEvents="none">
          <View
            style={[
              styles.spotlightHole,
              {
                left: x - 8,
                top: y - 8,
                width: width + 16,
                height: height + 16,
                borderRadius: Radius.md,
              },
            ]}
          />
        </View>

        {/* Burbuja del tooltip */}
        <Animated.View
          style={[
            styles.burbuja,
            { left: burbujaX, top: burbujaY },
          ]}
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(200)}
        >
          <View style={styles.flecha} pointerEvents="none" />
          <View style={styles.contenido}>
            <Text style={[styles.texto, { color: theme.text }]}>{texto}</Text>
            <View style={styles.acciones}>
              {mostrarContinuar && (
                <Text
                  style={[
                    styles.continuar,
                    { color: theme.primary },
                  ]}>
                  ▸ Pulsa para continuar
                </Text>
              )}
              <Pressable
                onPress={ocultar}
                accessibilityRole="button"
                accessibilityLabel={`Cerrar ${textoCerrar}`}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.botonCerrar,
                  { backgroundColor: pressed ? theme.primarySoft : theme.primary },
                ]}>
                <Text style={[styles.botonTexto, { color: theme.primaryText }]}>{textoCerrar}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 1000,
  },
  spotlightContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  spotlightHole: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: 'rgba(0,0,0,0.55)',
    overflow: 'hidden',
  },
  burbuja: {
    position: 'absolute',
    width: 280,
    maxWidth: '90%',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1001,
  },
  flecha: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
  },
  contenido: {
    gap: Spacing.two,
  },
  texto: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  continuar: {
    fontFamily: fam(500),
    fontSize: FontSize.xs,
  },
  botonCerrar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonTexto: {
    fontFamily: fam(700),
    fontSize: FontSize.sm,
  },
});