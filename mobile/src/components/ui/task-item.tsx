import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useTheme } from '@/hooks/use-theme';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';
import type { EstadoRegistro, Tarea } from '@/types';

interface TareaItemProps {
  tarea: Tarea;
  estado: EstadoRegistro;
  onToggle: () => void;
}

/** Fila de tarea diaria con estado realizada / pendiente / incidencia. */
export function TareaItem({ tarea, estado, onToggle }: TareaItemProps) {
  const theme = useTheme();
  const realizada = estado === 'realizada';
  const incidencia = estado === 'incidencia';

  const colorEstado = incidencia ? theme.danger : realizada ? theme.primary : theme.border;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: realizada }}
      // El estado completo viaja en la etiqueta: "incidencia" no se comunica
      // solo por el color del punto rojo.
      accessibilityLabel={`${tarea.nombre}, ${tarea.hora}${incidencia ? ', con incidencia' : realizada ? ', realizada' : ', pendiente'}`}
      accessibilityHint="Marca o desmarca la tarea como realizada"
      onPress={onToggle}
      style={({ pressed }) => [
        styles.fila,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.check, { borderColor: colorEstado, backgroundColor: realizada ? theme.primary : 'transparent' }]}>
        {realizada ? <Text style={[styles.marca, { color: theme.primaryText }]}>✓</Text> : null}
      </View>
      <View style={styles.info}>
        <Text style={[styles.nombre, { color: theme.text }, realizada && styles.tachado]} numberOfLines={1}>
          {tarea.nombre}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {tarea.hora}
          {tarea.personalizada ? ' · personalizada' : ''}
          {incidencia ? ' · incidencia' : ''}
        </Text>
      </View>
      {incidencia ? (
        <View style={[styles.punto, { backgroundColor: theme.danger }]} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.75,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marca: {
    fontFamily: fam(800),
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontFamily: fam(600),
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  tachado: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  meta: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
