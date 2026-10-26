import { Pressable, StyleSheet, View } from 'react-native';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import type { ReglaAlerta, TipoRegla } from '@/types';

const TIPO_ICON: Record<TipoRegla, string> = {
  medicacion: '💊',
  signos_vitales: '📊',
  cita: '📅',
  recordatorio: '🔔',
  personalizada: '⚙️',
};

const TIPO_LABEL: Record<TipoRegla, string> = {
  medicacion: 'Medicación',
  signos_vitales: 'Signos vitales',
  cita: 'Cita médica',
  recordatorio: 'Recordatorio',
  personalizada: 'Personalizada',
};

export interface ReglaCardProps {
  regla: ReglaAlerta;
  onToggle: (id: string, activa: boolean) => void;
  onEditar: (regla: ReglaAlerta) => void;
  onEliminar: (id: string) => void;
}

export function ReglaCard({ regla, onToggle, onEditar, onEliminar }: ReglaCardProps) {
  const theme = useTheme();
  const icono = TIPO_ICON[regla.tipo] || '📋';
  const tipoLabel = TIPO_LABEL[regla.tipo] || regla.tipo;

  return (
    <Card style={styles.card} onPress={() => onEditar(regla)}>
      <View style={styles.header}>
        <View style={styles.tipoBadge}>
          <ThemedText style={styles.tipoIcon}>{icono}</ThemedText>
        </View>
        <View style={styles.info}>
          <ThemedText style={[styles.nombre, { color: theme.text }]} numberOfLines={1}>
            {regla.nombre}
          </ThemedText>
          <View style={styles.meta}>
            <ThemedText style={[styles.tipo, { color: theme.textSecondary }]}>
              {tipoLabel}
            </ThemedText>
            {regla.condicion.hora && (
              <ThemedText style={[styles.hora, { color: Color.gray500 }]}>
                🕐 {regla.condicion.hora}
              </ThemedText>
            )}
            {regla.condicion.horasEntreTomas && (
              <ThemedText style={[styles.hora, { color: Color.gray500 }]}>
                🔄 Cada {regla.condicion.horasEntreTomas}h
              </ThemedText>
            )}
            {regla.condicion.tipoValor && (
              <ThemedText style={[styles.hora, { color: Color.gray500 }]}>
                📊 {regla.condicion.tipoValor} {regla.condicion.operador} {regla.condicion.umbral}
              </ThemedText>
            )}
            {regla.condicion.fechaCita && (
              <ThemedText style={[styles.hora, { color: Color.gray500 }]}>
                📅 {regla.condicion.fechaCita}
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <Switch
            value={regla.activa}
            onValueChange={(v) => onToggle(regla.id, v)}
            disabled={!regla.activa && regla.vecesEjecutada === 0}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.btnEditar}
          onPress={() => onEditar(regla)}
          hitSlop={8}
        >
          <ThemedText style={styles.btnTexto}>✏️ Editar</ThemedText>
        </Pressable>
        <Pressable
          style={styles.btnEliminar}
          onPress={() => onEliminar(regla.id)}
          hitSlop={8}
        >
          <ThemedText style={styles.btnTextoPeligro}>🗑️ Eliminar</ThemedText>
        </Pressable>
        {regla.escalado && (
          <ThemedText style={styles.escaladoBadge}>
            ⬆️ {regla.escalado.niveles.length} niveles
          </ThemedText>
        )}
        <ThemedText style={[styles.contador, { color: Color.gray500 }]}>
          Ejecutada {regla.vecesEjecutada} vez{regla.vecesEjecutada !== 1 ? 'es' : ''}
        </ThemedText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  tipoBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Color.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tipoIcon: {
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  nombre: {
    fontFamily: fam(600),
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tipo: {
    fontFamily: fam(500),
    fontSize: FontSize.xs,
    backgroundColor: Color.gray100,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  hora: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    color: Color.gray500,
  },
  actions: {
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Color.gray100,
    gap: Spacing.two,
  },
  btnEditar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    backgroundColor: Color.gray100,
  },
  btnEliminar: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    backgroundColor: Color.red50,
  },
  btnTexto: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    color: Color.gray700,
  },
  btnTextoPeligro: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    color: Color.red600,
  },
  escaladoBadge: {
    fontFamily: fam(600),
    fontSize: FontSize.xs,
    color: Color.orange600,
    backgroundColor: Color.orange50,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
  },
  contador: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
  },
});