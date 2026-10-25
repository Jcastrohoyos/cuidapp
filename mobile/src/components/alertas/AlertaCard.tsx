import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Animated, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AlertaMedica, PrioridadAlerta, AccionAlerta } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface AlertaCardProps {
  alerta: AlertaMedica;
  onLeer?: () => void;
  onDescartar?: () => void;
  onPosponer?: (minutos: number) => void;
  onAccion?: (accion: AccionAlerta) => void;
  onPress?: () => void;
}

const PRIORIDAD_COLOR: Record<PrioridadAlerta, string> = {
  baja: '#6B7280',
  media: '#3B82F6',
  alta: '#F59E0B',
  critica: '#EF4444',
};

const PRIORIDAD_ICON: Record<PrioridadAlerta, string> = {
  baja: '🔵',
  media: '🔵',
  alta: '🟠',
  critica: '🔴',
};

const TIPO_ICON: Record<AlertaMedica['tipo'], string> = {
  medicacion: '💊',
  signos_vitales: '📊',
  cita: '📅',
  recordatorio: '🔔',
  urgencia: '🚨',
};

export function AlertaCard({
  alerta,
  onLeer,
  onDescartar,
  onPosponer,
  onAccion,
  onPress,
}: AlertaCardProps) {
  const theme = useTheme();
  const prioridadColor = PRIORIDAD_COLOR[alerta.prioridad];
  const tipoIcon = TIPO_ICON[alerta.tipo];
  const prioridadIcon = PRIORIDAD_ICON[alerta.prioridad];

  const [swipeX, setSwipeX] = useState(0);
  const [mostrarAcciones, setMostrarAcciones] = useState(false);

  const translateX = useRef(new Animated.Value(0));

  const SWIPE_THRESHOLD = 80;
  const SWIPE_MAX = 240;

  const panGesture = Gesture.Pan()
    // eslint-disable-next-line react-hooks/refs
    .onUpdate((e) => {
      const newX = Math.max(-SWIPE_MAX, Math.min(0, e.translationX));
      setSwipeX(newX);
      translateX.current.setValue(newX);
    })
    // eslint-disable-next-line react-hooks/refs
    .onEnd((e) => {
      const velocity = e.velocityX;
      const currentX = swipeX;
      const shouldOpen = currentX < -SWIPE_THRESHOLD || velocity < -500;

      if (shouldOpen) {
        Animated.timing(translateX.current, {
          toValue: -SWIPE_MAX,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setMostrarAcciones(true));
      } else {
        Animated.timing(translateX.current, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setMostrarAcciones(false));
      }
      setSwipeX(0);
    });

  const cerrarSwipe = useCallback(() => {
    Animated.timing(translateX.current, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMostrarAcciones(false));
  }, []);

  const handleLeer = useCallback(() => {
    onLeer?.();
    cerrarSwipe();
  }, [onLeer]);

  const handleDescartar = useCallback(() => {
    onDescartar?.();
    cerrarSwipe();
  }, [onDescartar]);

  const handlePosponer = useCallback((minutos: number) => {
    onPosponer?.(minutos);
    cerrarSwipe();
  }, [onPosponer]);

  const handleAccion = useCallback((accion: AccionAlerta) => {
    onAccion?.(accion);
    cerrarSwipe();
  }, [onAccion]);

  const fechaFormateada = formatDistanceToNow(new Date(alerta.fechaHora), {
    addSuffix: true,
    locale: es,
  });

  const tieneAccion = !!alerta.accion;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            // eslint-disable-next-line react-hooks/refs
            transform: [{ translateX: translateX.current }],
            borderLeftColor: prioridadColor,
            backgroundColor: alerta.leida ? Color.gray50 : theme.backgroundElement,
          },
        ]}
      >
        {/* Contenido principal */}
        <Pressable
          style={styles.content}
          onPress={onPress}
          onLongPress={() => setMostrarAcciones(true)}
          hitSlop={8}
        >
          <>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{tipoIcon}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.tituloRow}>
                  <ThemedText style={[styles.titulo, { color: theme.text }]} numberOfLines={1}>
                    {alerta.titulo}
                  </ThemedText>
                  <ThemedText style={[styles.prioridadBadge, { backgroundColor: prioridadColor }]}>
                    {prioridadIcon} {alerta.prioridad.toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.mensaje, { color: theme.textSecondary }]} numberOfLines={2}>
                  {alerta.mensaje}
                </ThemedText>
              </View>
              <View style={styles.meta}>
                <ThemedText style={[styles.fecha, { color: Color.gray500 }]}>
                  {fechaFormateada}
                </ThemedText>
                {alerta.escalada && (
                  <ThemedText style={[styles.escaladaBadge, { color: theme.danger }]}>
                    ⬆️ Escalada Nv.{alerta.nivelEscaladoActual}
                  </ThemedText>
                )}
              </View>
            </View>

            {tieneAccion && (
              <View style={styles.accionPrincipal}>
                <Pressable
                  style={[
                    styles.botonAccion,
                    { backgroundColor: prioridadColor },
                  ]}
                  onPress={() => handleAccion(alerta.accion!)}
                  hitSlop={8}
                >
                  <ThemedText style={styles.botonAccionTexto}>
                    {obtenerTextoAccion(alerta.accion!)}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </>
        </Pressable>

        {/* Acciones de swipe (derecha) */}
        <View style={styles.swipeActions} pointerEvents={mostrarAcciones ? 'box-none' : 'none'}>
          <Pressable
            style={styles.swipeBtnLeer}
            onPress={handleLeer}
            hitSlop={12}
          >
            <Text style={styles.swipeBtnIcon}>✅</Text>
            <Text style={styles.swipeBtnTexto}>Leída</Text>
          </Pressable>
          <Pressable
            style={styles.swipeBtnPosponer}
            onPress={() => handlePosponer(15)}
            hitSlop={12}
          >
            <Text style={styles.swipeBtnIcon}>⏰</Text>
            <Text style={styles.swipeBtnTexto}>+15 min</Text>
          </Pressable>
          <Pressable
            style={styles.swipeBtnDescartar}
            onPress={handleDescartar}
            hitSlop={12}
          >
            <Text style={styles.swipeBtnIcon}>🗑️</Text>
            <Text style={styles.swipeBtnTexto}>Descartar</Text>
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

function obtenerTextoAccion(accion: AccionAlerta): string {
  switch (accion.tipo) {
    case 'abrir_tarea':
      return 'Ver tarea';
    case 'abrir_incidencia':
      return 'Ver incidencia';
    case 'llamar':
      return 'Llamar ahora';
    case 'url':
      return 'Abrir enlace';
    case 'registrar_valor':
      return `Registrar ${accion.valor}`;
    default:
      return 'Actuar';
  }
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.four,
    marginVertical: Spacing.two,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    flex: 1,
  },
  header: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Color.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: Spacing.two,
  },
  tituloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titulo: {
    fontFamily: fam(600),
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  prioridadBadge: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    color: '#fff',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  mensaje: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  fecha: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    color: Color.gray500,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  escaladaBadge: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    color: Color.red600,
    backgroundColor: Color.red50,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  accionPrincipal: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Color.gray200,
  },
  botonAccion: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    alignItems: 'center',
    minHeight: 36,
  },
  botonAccionTexto: {
    fontFamily: fam(600),
    fontSize: FontSize.sm,
    color: '#fff',
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  swipeBtnLeer: {
    backgroundColor: '#10B981',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  swipeBtnPosponer: {
    backgroundColor: '#3B82F6',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  swipeBtnDescartar: {
    backgroundColor: '#EF4444',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  swipeBtnIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  swipeBtnTexto: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    color: '#fff',
  },
});