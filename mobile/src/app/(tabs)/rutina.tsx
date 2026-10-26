import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TareaItem } from '@/components/ui/task-item';
import { ThemedText } from '@/components/themed-text';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useRutina } from '@/hooks/use-rutina';
import { useTheme } from '@/hooks/use-theme';
import { confirmar } from '@/utils/confirmar';
import { fechaHoy, porcentaje, tiempoRelativo } from '@/utils/format';
import { fam, FontSize, Spacing } from '@/constants/theme';
import { useOnboarding, ONBOARDING_KEYS } from '@/hooks/use-onboarding';
import { Tooltip } from '@/components/ui/tooltip';
import { useRef } from 'react';

export default function RutinaScreen() {
  const theme = useTheme();
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const hoy = fechaHoy();
  const rutina = useRutina(perfil?.id ?? '', hoy);
  const { yaVisto, marcarVisto } = useOnboarding();

  // Refs para tooltips
  const refAnadir = useRef<React.ElementRef<typeof Pressable>>(null);
  const refToggle = useRef<React.ElementRef<typeof Pressable>>(null);

  const cabecera = (
    <ScreenHeader
      variante="ninguno"
      titulo="Rutina"
      subtitulo={
        perfil
          ? `${perfil.persona.nombre} · ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`
          : undefined
      }
    />
  );

  if (isLoading) {
    // Skeleton con la forma de la pantalla: barra de progreso + filas de tareas.
    return (
      <Screen>
        {cabecera}
        <Skeleton alto={96} />
        <Skeleton alto={20} ancho="45%" />
        <Skeleton alto={68} />
        <Skeleton alto={68} />
        <Skeleton alto={68} />
        <Skeleton alto={68} />
      </Screen>
    );
  }

  if (esError) {
    return (
      <Screen>
        {cabecera}
        <ErrorState accion={{ texto: 'Reintentar', onPress: () => void refetch() }} />
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen>
        {cabecera}
        <EmptyState
          titulo="Todavía no hay perfil de cuidado"
          descripcion="La rutina diaria se organiza a partir del perfil de cuidado de tu familiar."
          accion={{ texto: 'Crear perfil de cuidado', onPress: () => router.push('/cuidado/nuevo') }}
        />
      </Screen>
    );
  }

  if (rutina.esError) {
    return (
      <Screen>
        {cabecera}
        <ErrorState
          titulo="No hemos podido cargar la rutina"
          accion={{ texto: 'Reintentar', onPress: rutina.refetch }}
        />
      </Screen>
    );
  }

  const { tareas, estadoTarea, registrar, eliminar } = rutina;
  const realizadas = tareas.filter((t) => estadoTarea(t.id) === 'realizada').length;
  const abiertas = rutina.incidencias.filter((i) => i.estado === 'abierta');

  return (
    <Screen alRefrescar={rutina.refetch}>
      {cabecera}

      <Card>
        <ProgressBar
          valor={porcentaje(realizadas, tareas.length)}
          etiqueta="Progreso del día"
          detalle={`${realizadas} / ${tareas.length}`}
        />
      </Card>

      <View ref={refToggle}>
        <SectionHeader titulo="Tareas de hoy" />
      </View>

      {!yaVisto(ONBOARDING_KEYS.RUTINA_TOGGLE) && (
        <Tooltip
          clave={ONBOARDING_KEYS.RUTINA_TOGGLE}
          targetRef={refToggle}
          texto="Toca cualquier tarea para marcarla como realizada o pendiente."
          posicion="abajo"
          onDescartar={() => marcarVisto(ONBOARDING_KEYS.RUTINA_TOGGLE)}
          mostrarContinuar
        />
      )}
      <View style={styles.lista}>
        {tareas.map((tarea) => (
          <TareaItem
            key={tarea.id}
            tarea={tarea}
            estado={estadoTarea(tarea.id)}
            onToggle={() =>
              registrar.mutate({
                tareaId: tarea.id,
                estado: estadoTarea(tarea.id) === 'realizada' ? 'pendiente' : 'realizada',
                responsableId: tarea.responsableId,
              })
            }
            onEliminar={
              tarea.personalizada
                ? () =>
                    confirmar(
                      {
                        titulo: 'Quitar de la rutina',
                        mensaje: `Se eliminará "${tarea.nombre}" de la rutina${tarea.repeticion === 'unica' ? ' de hoy' : ''}. Las tareas fijas de la demo no se pueden quitar.`,
                        accion: 'Quitar',
                        destructiva: true,
                      },
                      () => eliminar.mutate(tarea.id),
                    )
                : undefined
            }
          />
        ))}
        {tareas.length === 0 ? (
          <EmptyState
            titulo="Sin tareas hoy"
            descripcion="Las tareas se configuran desde el perfil de cuidado y se adaptan a cada persona."
          />
        ) : null}
      </View>

      <Button
        ref={refAnadir}
        titulo="+ Añadir a la rutina"
        variante="secondary"
        fullWidth
        onPress={() => router.push('/rutina/nueva')}
      />

      {!yaVisto(ONBOARDING_KEYS.RUTINA_ANADIR) && (
        <Tooltip
          clave={ONBOARDING_KEYS.RUTINA_ANADIR}
          targetRef={refAnadir}
          texto="Añade tareas nuevas a la rutina: diarias o solo para hoy, con su hora."
          posicion="arriba"
          onDescartar={() => marcarVisto(ONBOARDING_KEYS.RUTINA_ANADIR)}
          mostrarContinuar
        />
      )}

      <SectionHeader titulo="Incidencias" />
      {abiertas.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Sin incidencias abiertas. Todo va según lo previsto.
        </ThemedText>
      ) : (
        <View style={styles.lista}>
          {abiertas.map((incidencia) => (
            <Card key={incidencia.id} row>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{incidencia.titulo}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {tiempoRelativo(incidencia.fecha)}
                  {incidencia.descripcion ? ` · ${incidencia.descripcion}` : ''}
                </ThemedText>
              </View>
              <Badge texto="Abierta" tono="warning" />
            </Card>
          ))}
        </View>
      )}

      <Text style={[styles.nota, { color: theme.textSecondary }]}>
        El cuidador registra cada tarea con fecha y responsable; aquí consultas el seguimiento.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  nota: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
