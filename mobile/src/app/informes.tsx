import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Stat } from '@/components/ui/stat';
import { ThemedText } from '@/components/themed-text';
import { useHistorial, useInforme } from '@/hooks/use-informes';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useRutina } from '@/hooks/use-rutina';
import { fechaHoy, formatearFechaHora, porcentaje } from '@/utils/format';
import { Radius, Spacing } from '@/constants/theme';

export default function InformesScreen() {
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const hoy = fechaHoy();
  const informe = useInforme(perfil?.id ?? '');
  const historial = useHistorial(perfil?.id ?? '', { limite: 20 });
  const rutina = useRutina(perfil?.id ?? '', hoy);

  const cabecera = (
    <ScreenHeader
      variante="atras"
      titulo="Informes"
      subtitulo={perfil ? `${perfil.persona.nombre} · semana en curso` : undefined}
    />
  );

  if (isLoading || informe.isLoading) {
    // Skeleton con la forma del informe: stats + tarjetas.
    return (
      <Screen>
        {cabecera}
        <View style={styles.stats}>
          <Skeleton alto={76} radio={Radius.md} style={styles.statSkel} />
          <Skeleton alto={76} radio={Radius.md} style={styles.statSkel} />
          <Skeleton alto={76} radio={Radius.md} style={styles.statSkel} />
        </View>
        <Skeleton alto={20} ancho="50%" />
        <Skeleton alto={130} />
        <Skeleton alto={20} ancho="45%" />
        <Skeleton alto={64} />
        <Skeleton alto={64} />
      </Screen>
    );
  }

  const hayError = esError || informe.isError || historial.isError;
  if (hayError) {
    return (
      <Screen>
        {cabecera}
        <ErrorState
          accion={{
            texto: 'Reintentar',
            onPress: () => {
              void refetch();
              void informe.refetch();
              void historial.refetch();
            },
          }}
        />
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen>
        {cabecera}
        <EmptyState
          titulo="Sin informes todavía"
          descripcion="Los informes se generan a partir del perfil de cuidado y los registros diarios del cuidador."
          accion={{ texto: 'Crear perfil de cuidado', onPress: () => router.push('/cuidado/nuevo') }}
        />
      </Screen>
    );
  }

  const datos = informe.data;
  const registros = historial.data ?? [];

  const adherencia = rutina.tareas.map((t) => ({
    nombre: t.nombre,
    valor: rutina.estadoTarea(t.id) === 'realizada' ? 100 : 0,
    detalle: rutina.estadoTarea(t.id) === 'realizada' ? '1/1' : '0/1',
  }));

  return (
    <Screen
      alRefrescar={() => {
        void informe.refetch();
        void historial.refetch();
        rutina.refetch();
      }}>
      {cabecera}

      <View style={styles.stats}>
        <Stat
          valor={datos ? `${porcentaje(datos.tareasRealizadas, datos.tareasTotales)}%` : '—'}
          etiqueta="tareas cumplidas"
        />
        <Stat valor={datos ? String(datos.incidencias.length) : '—'} etiqueta="incidencias" />
        <Stat
          valor={datos?.valoracion ? datos.valoracion.toFixed(1).replace('.', ',') : '—'}
          etiqueta="valoración del servicio"
        />
      </View>

      <SectionHeader titulo="Adherencia por rutina" />
      <Card>
        <View style={styles.adherencia}>
          {adherencia.length > 0 ? (
            adherencia.map((ruta) => (
              <View key={ruta.nombre} style={styles.filaAdherencia}>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.nombreRutina}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {ruta.nombre}
                </ThemedText>
                <View style={styles.barra}>
                  <ProgressBar valor={ruta.valor} />
                </View>
                <ThemedText type="smallBold" style={styles.detalle}>
                  {ruta.detalle}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Sin tareas con registros hoy.
            </ThemedText>
          )}
        </View>
      </Card>

      <SectionHeader titulo="Historial reciente" />
      <View style={styles.registros}>
        {registros.slice(0, 5).map((registro) => (
          <Card key={registro.id} row>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{registro.categoria}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {registro.resumen}
                {registro.valor != null ? ` · ${registro.valor}${registro.unidad ?? ''}` : ''}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {formatearFechaHora(registro.fecha)}
            </ThemedText>
          </Card>
        ))}
        {registros.length === 0 ? (
          <EmptyState
            titulo="Sin registros todavía"
            descripcion="El historial se irá generando con los registros diarios del cuidador."
          />
        ) : null}
      </View>

      <SectionHeader titulo="Incidencias registradas" />
      <View style={styles.registros}>
        {(datos?.incidencias ?? []).map((incidencia) => (
          <Card key={incidencia.id} row>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{incidencia.titulo}</ThemedText>
              {incidencia.resolucion ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {incidencia.resolucion}
                </ThemedText>
              ) : null}
            </View>
            <Badge
              texto={incidencia.estado === 'resuelta' ? 'Resuelta' : 'Abierta'}
              tono={incidencia.estado === 'resuelta' ? 'success' : 'warning'}
            />
          </Card>
        ))}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
        Historial organizado por fecha, responsable y estado ({hoy}). Información útil para decidir
        con continuidad.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    // En pantallas muy estrechas las cajas se envuelven en vez de desbordar.
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statSkel: {
    flex: 1,
    minWidth: 84,
  },
  adherencia: {
    gap: Spacing.three,
  },
  filaAdherencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nombreRutina: {
    // Se encoge con puntos suspensios en vez de empujar la barra fuera.
    flexShrink: 1,
    minWidth: 56,
  },
  barra: {
    flex: 1,
    minWidth: 40,
  },
  detalle: {
    width: 40,
    textAlign: 'right',
  },
  registros: {
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  nota: {
    lineHeight: 18,
  },
});
