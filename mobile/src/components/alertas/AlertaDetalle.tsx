import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AlertaMedica, PrioridadAlerta, AccionAlerta } from '@/types';
import { endpoints } from '@/api/endpoints';
import { cancelarEscalado } from '@/utils/alertas/escalado';

const PRIORIDAD_COLOR: Record<PrioridadAlerta, string> = {
  baja: '#6B7280',
  media: '#3B82F6',
  alta: '#F59E0B',
  critica: '#EF4444',
};

const TIPO_ICON: Record<AlertaMedica['tipo'], string> = {
  medicacion: '💊',
  signos_vitales: '📊',
  cita: '📅',
  recordatorio: '🔔',
  urgencia: '🚨',
};

export interface AlertaDetalleProps {
  alerta: AlertaMedica;
  perfilId: string;
  onCerrar: () => void;
  onActualizar?: (alerta: AlertaMedica) => void;
}

export function AlertaDetalle({ alerta, perfilId, onCerrar, onActualizar }: AlertaDetalleProps) {
  const theme = useTheme();
  const [cargando, setCargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const prioridadColor = PRIORIDAD_COLOR[alerta.prioridad];
  const tipoIcon = TIPO_ICON[alerta.tipo];

  const handleMarcarLeida = useCallback(async () => {
    if (alerta.leida) return;
    setCargando(true);
    try {
      await endpoints.marcarAlertaLeida(alerta.id);
      await cancelarEscalado(alerta.id);
      const actualizada = { ...alerta, leida: true, leidaEn: new Date().toISOString() };
      onActualizar?.(actualizada);
      onCerrar();
    } catch (e) {
      console.error('[AlertaDetalle] Error marcando leída:', e);
      Alert.alert('Error', 'No se pudo marcar como leída');
    } finally {
      setCargando(false);
    }
  }, [alerta, onActualizar, onCerrar]);

  const handleDescartar = useCallback(async () => {
    Alert.alert(
      'Descartar alerta',
      '¿Seguro que quieres descartar esta alerta? No podrá recuperarse.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            setEliminando(true);
            try {
              await endpoints.descartarAlerta(alerta.id);
              await cancelarEscalado(alerta.id);
              const actualizada = { ...alerta, descartada: true };
              onActualizar?.(actualizada);
              onCerrar();
            } catch (e) {
              console.error('[AlertaDetalle] Error descartando:', e);
              Alert.alert('Error', 'No se pudo descartar');
            } finally {
              setEliminando(false);
            }
          },
        },
      ],
    );
  }, [alerta, onActualizar, onCerrar]);

  const handleAccion = useCallback(async () => {
    if (!alerta.accion) return;

    const accion = alerta.accion;
    try {
      switch (accion.tipo) {
        case 'abrir_tarea':
          router.push(`/rutina?task=${accion.valor}`);
          break;
        case 'abrir_incidencia':
          router.push(`/perfil?incidencia=${accion.valor}`);
          break;
        case 'llamar':
          const { Linking } = await import('react-native');
          await Linking.openURL(`tel:${accion.valor}`);
          break;
        case 'url':
          const { Linking: Linking2 } = await import('react-native');
          await Linking2.openURL(accion.valor);
          break;
        case 'registrar_valor':
          router.push(`/perfil?registrar=${accion.valor}&alerta=${alerta.id}`);
          break;
      }
      // Marcar como leída al actuar
      if (!alerta.leida) {
        await handleMarcarLeida();
      }
    } catch (e) {
      console.error('[AlertaDetalle] Error en acción:', e);
      Alert.alert('Error', 'No se pudo realizar la acción');
    }
  }, [alerta, handleMarcarLeida]);

  const fechaFormateada = format(new Date(alerta.fechaHora), 'EEEE, d MMMM yyyy \'a las\' HH:mm', { locale: es });
  const haceTiempo = formatDistanceToNow(new Date(alerta.fechaHora), { addSuffix: true, locale: es });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header con prioridad */}
      <View style={[styles.header, { borderBottomColor: prioridadColor }]}>
        <View style={styles.headerTop}>
          <View style={[styles.prioridadIndicador, { backgroundColor: prioridadColor }]} />
          <View style={styles.headerInfo}>
            <View style={styles.tituloRow}>
              <ThemedText style={[styles.titulo, { color: theme.text }]}>{alerta.titulo}</ThemedText>
              <View style={[styles.prioridadBadge, { backgroundColor: prioridadColor }]}>
                <ThemedText style={styles.prioridadTexto}>{alerta.prioridad.toUpperCase()}</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.tipo, { color: theme.textSecondary }]}>
              {tipoIcon} {alerta.tipo.charAt(0).toUpperCase() + alerta.tipo.slice(1)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metaRow}>
          <ThemedText style={[styles.metaItem, { color: Color.gray500 }]}>
            📅 {fechaFormateada}
          </ThemedText>
          <ThemedText style={[styles.metaItem, { color: Color.gray500 }]}>
            ⏱ {haceTiempo}
          </ThemedText>
        </View>
      </View>

      {/* Mensaje principal */}
      <Card style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Mensaje</ThemedText>
        <ThemedText style={[styles.mensaje, { color: theme.text }]}>{alerta.mensaje}</ThemedText>
      </Card>

      {/* Detalles técnicos */}
      <Card style={styles.section}>
        <SectionHeader titulo="Detalles" />
        <View style={styles.detallesGrid}>
          <View style={styles.detalleItem}>
            <ThemedText style={[styles.detalleLabel, { color: Color.gray500 }]}>ID</ThemedText>
            <ThemedText style={[styles.detalleValor, { color: theme.text, fontFamily: 'monospace' }]}>{alerta.id}</ThemedText>
          </View>
          <View style={styles.detalleItem}>
            <ThemedText style={[styles.detalleLabel, { color: Color.gray500 }]}>Perfil</ThemedText>
            <ThemedText style={[styles.detalleValor, { color: theme.text }]}>{perfilId}</ThemedText>
          </View>
          <View style={styles.detalleItem}>
            <ThemedText style={[styles.detalleLabel, { color: Color.gray500 }]}>Regla</ThemedText>
            <ThemedText style={[styles.detalleValor, { color: theme.text, fontFamily: 'monospace' }]}>{alerta.reglaId || 'Manual'}</ThemedText>
          </View>
          <View style={styles.detalleItem}>
            <ThemedText style={[styles.detalleLabel, { color: Color.gray500 }]}>Creada</ThemedText>
            <ThemedText style={[styles.detalleValor, { color: theme.text }]}>{formatDistanceToNow(new Date(alerta.creadaEn), { addSuffix: true, locale: es })}</ThemedText>
          </View>
          {alerta.leidaEn && (
            <View style={styles.detalleItem}>
              <ThemedText style={[styles.detalleLabel, { color: Color.gray500 }]}>Leída</ThemedText>
              <ThemedText style={[styles.detalleValor, { color: theme.text }]}>{formatDistanceToNow(new Date(alerta.leidaEn!), { addSuffix: true, locale: es })}</ThemedText>
            </View>
          )}
          {alerta.escalada && (
            <View style={styles.detalleItem}>
              <ThemedText style={[styles.detalleLabel, { color: Color.gray500 }]}>Escalada</ThemedText>
              <ThemedText style={[styles.detalleValor, { color: Color.red500 }]}>Nivel {alerta.nivelEscaladoActual}</ThemedText>
            </View>
          )}
        </View>
      </Card>

      {/* Acción principal */}
      {alerta.accion && (
        <Card style={styles.section}>
          <SectionHeader titulo="Acción" />
          <View style={styles.accionCard}>
            <ThemedText style={[styles.accionTipo, { color: theme.textSecondary }]}>
              {obtenerIconoAccion(alerta.accion.tipo)} {obtenerTextoAccion(alerta.accion)}
            </ThemedText>
            <ThemedText style={[styles.accionValor, { color: theme.text, fontFamily: 'monospace' }]}>{alerta.accion.valor}</ThemedText>
            <Button
              style={styles.accionBoton}
              onPress={handleAccion}
              disabled={cargando}
              variante="primary"
              titulo={obtenerTextoBotonAccion(alerta.accion)}
            />
          </View>
        </Card>
      )}

      {/* Botones de acción inferior */}
      <View style={styles.accionesInferiores}>
        {!alerta.leida && (
          <Button
            style={[styles.botonSecundario, { flex: 1 }]}
            onPress={handleMarcarLeida}
            disabled={cargando}
            variante="ghost"
            titulo="✅ Marcar como leída"
          />
        )}
        <Button
          style={[styles.botonPeligro, { flex: 1 }]}
          onPress={handleDescartar}
          disabled={eliminando}
          variante="danger"
          titulo="🗑️ Descartar"
        />
      </View>

      {/* Debug info */}
      {__DEV__ && (
        <View style={styles.debug}>
          <ThemedText style={[styles.debugLabel, { color: Color.gray500 }]}>DEBUG</ThemedText>
          <ThemedText style={[styles.debugValor, { color: Color.gray500, fontFamily: 'monospace', fontSize: 10 }]}>ID: {alerta.id}</ThemedText>
          <ThemedText style={[styles.debugValor, { color: Color.gray500, fontFamily: 'monospace', fontSize: 10 }]}>Regla: {alerta.reglaId || 'N/A'}</ThemedText>
          <ThemedText style={[styles.debugValor, { color: Color.gray500, fontFamily: 'monospace', fontSize: 10 }]}>Escalada: {alerta.escalada ? 'Sí (Nivel ' + alerta.nivelEscaladoActual + ')' : 'No'}</ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

function obtenerIconoAccion(tipo: AccionAlerta['tipo']): string {
  switch (tipo) {
    case 'abrir_tarea': return '📋';
    case 'abrir_incidencia': return '⚠️';
    case 'llamar': return '📞';
    case 'url': return '🔗';
    case 'registrar_valor': return '📝';
    default: return '⚡';
  }
}

function obtenerTextoAccion(accion: AccionAlerta): string {
  switch (accion.tipo) {
    case 'abrir_tarea': return 'Ver tarea';
    case 'abrir_incidencia': return 'Ver incidencia';
    case 'llamar': return 'Llamar';
    case 'url': return 'Abrir enlace';
    case 'registrar_valor': return `Registrar ${accion.valor}`;
    default: return 'Actuar';
  }
}

function obtenerTextoBotonAccion(accion: AccionAlerta): string {
  switch (accion.tipo) {
    case 'abrir_tarea': return 'Ir a la tarea';
    case 'abrir_incidencia': return 'Ver incidencia';
    case 'llamar': return 'Llamar ahora';
    case 'url': return 'Abrir enlace';
    case 'registrar_valor': return `Registrar ${accion.valor}`;
    default: return 'Realizar acción';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.gray50,
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  header: {
    borderBottomWidth: 3,
    paddingBottom: Spacing.three,
  },
  headerTop: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  prioridadIndicador: {
    width: 4,
    height: 48,
    borderRadius: Radius.sm,
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  tituloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titulo: {
    fontFamily: fam(700),
    fontSize: FontSize.xl,
    lineHeight: 28,
    flex: 1,
  },
  prioridadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  prioridadTexto: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    color: '#fff',
  },
  tipo: {
    fontFamily: fam(500),
    fontSize: FontSize.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  metaItem: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontFamily: fam(600),
    fontSize: FontSize.md,
    marginBottom: Spacing.one,
  },
  mensaje: {
    fontFamily: fam(400),
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  detallesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  detalleItem: {
    flex: 1,
    minWidth: 120,
    gap: Spacing.half,
  },
  detalleLabel: {
    fontFamily: fam(500),
    fontSize: FontSize.xs,
  },
  detalleValor: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
  },
  accionCard: {
    gap: Spacing.two,
  },
  accionTipo: {
    fontFamily: fam(500),
    fontSize: FontSize.sm,
  },
  accionValor: {
    fontFamily: 'monospace',
    fontSize: FontSize.xs,
  },
  accionBoton: {
    marginTop: Spacing.one,
  },
  accionesInferiores: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Color.gray200,
  },
  botonSecundario: {
    minHeight: 48,
  },
  botonPeligro: {
    minHeight: 48,
  },
  debug: {
    marginTop: Spacing.four,
    padding: Spacing.three,
    backgroundColor: Color.gray100,
    borderRadius: Radius.md,
    gap: Spacing.half,
  },
  debugLabel: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
  },
  debugValor: {
    fontFamily: 'monospace',
    fontSize: FontSize.xs,
  },
});