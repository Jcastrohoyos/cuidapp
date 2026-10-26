import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CampoTexto } from '@/components/ui/field';
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
import { useResolverIncidencia } from '@/hooks/use-rutina';
import { useToast } from '@/hooks/use-toast';
import { formatearFechaHora, porcentaje } from '@/utils/format';
import { decimalEs, etiquetaSemana } from '@/utils/adherencia';
import { Radius, Spacing } from '@/constants/theme';

export default function InformesScreen() {
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const toast = useToast();
  const informe = useInforme(perfil?.id ?? '');
  const historial = useHistorial(perfil?.id ?? '', { limite: 20 });
  const resolverIncidencia = useResolverIncidencia(perfil?.id ?? '');
  // Incidencia que se está resolviendo ahora (una a la vez).
  const [resolucionAbierta, setResolucionAbierta] = useState<string | null>(null);
  const [textoResolucion, setTextoResolucion] = useState('');

  const guardarResolucion = (incidenciaId: string) => {
    const texto = textoResolucion.trim();
    if (!texto) {
      toast.error('Escribe cómo se resolvió antes de guardar.');
      return;
    }
    resolverIncidencia.mutate(
      { incidenciaId, resolucion: texto },
      {
        onSuccess: () => {
          setResolucionAbierta(null);
          setTextoResolucion('');
          toast.exito('Incidencia resuelta.');
        },
        onError: () =>
          toast.error('No hemos podido resolver la incidencia. Inténtalo de nuevo.'),
      },
    );
  };

  const periodo = informe.data?.periodo;
  const cabecera = (
    <ScreenHeader
      variante="atras"
      titulo="Informes"
      subtitulo={
        perfil
          ? `${perfil.persona.nombre}${periodo ? ` · ${etiquetaSemana(periodo.desde, periodo.hasta)}` : ''}`
          : undefined
      }
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

  // Adherencia por rutina: realizadas / programadas dentro de la semana. El
  // porcentaje y la fracción salen de los mismos datos registrados.
  const adherencia = datos?.adherencia ?? [];

  return (
    <Screen
      alRefrescar={() => {
        void informe.refetch();
        void historial.refetch();
      }}>
      {cabecera}

      <View style={styles.stats}>
        <Stat
          valor={datos ? `${porcentaje(datos.tareasRealizadas, datos.tareasTotales)}%` : '—'}
          etiqueta="tareas cumplidas"
        />
        <Stat valor={datos ? String(datos.incidencias.length) : '—'} etiqueta="incidencias" />
        <Stat
          valor={datos?.valoracion != null ? decimalEs(datos.valoracion) : '—'}
          etiqueta="valoración del cuidador"
        />
      </View>

      <SectionHeader titulo="Adherencia por rutina" />
      <Card>
        <View style={styles.adherencia}>
          {adherencia.length > 0 ? (
            adherencia.map((ruta) => (
              <View key={ruta.tareaId} style={styles.filaAdherencia}>
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                  style={styles.nombreRutina}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {ruta.nombre}
                </ThemedText>
                <View style={styles.barra}>
                  <ProgressBar valor={porcentaje(ruta.realizadas, ruta.programadas)} />
                </View>
                <ThemedText type="smallBold" style={styles.detalle}>
                  {ruta.realizadas}/{ruta.programadas}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              Sin tareas en la rutina de esta persona.
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
              {resolucionAbierta === incidencia.id ? (
                <CampoTexto
                  label="Cómo se resolvió"
                  valor={textoResolucion}
                  onChangeTexto={setTextoResolucion}
                  placeholder="Escribe el resultado (ej. se resolvió con la fisioterapia)"
                />
              ) : null}
            </View>
            <View style={styles.columnaDerecha}>
              <Badge
                texto={incidencia.estado === 'resuelta' ? 'Resuelta' : 'Abierta'}
                tono={incidencia.estado === 'resuelta' ? 'success' : 'warning'}
              />
              {incidencia.estado !== 'resuelta' ? (
                resolucionAbierta === incidencia.id ? (
                  <View style={styles.acciones}>
                    <Button
                      titulo="Guardar"
                      tamano="sm"
                      cargando={resolverIncidencia.isPending}
                      onPress={() => guardarResolucion(incidencia.id)}
                    />
                    <Button
                      titulo="Cancelar"
                      variante="secondary"
                      tamano="sm"
                      onPress={() => setResolucionAbierta(null)}
                    />
                  </View>
                ) : (
                  <Button
                    titulo="Resolver"
                    variante="secondary"
                    tamano="sm"
                    onPress={() => {
                      setResolucionAbierta(incidencia.id);
                      setTextoResolucion('');
                    }}
                  />
                )
              ) : null}
            </View>
          </Card>
        ))}
        {(datos?.incidencias ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Sin incidencias registradas en esta semana.
          </ThemedText>
        ) : null}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
        Historial organizado por fecha, responsable y estado
        {periodo ? ` (${etiquetaSemana(periodo.desde, periodo.hasta).toLowerCase()})` : ''}.
        Información útil para decidir con continuidad.
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
    // Ancho suficiente para la fracción "19/21" sin partirla.
    width: 52,
    textAlign: 'right',
  },
  registros: {
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  columnaDerecha: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  acciones: {
    gap: Spacing.one,
  },
  nota: {
    lineHeight: 18,
  },
});
