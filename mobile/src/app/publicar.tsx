import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { USAR_MOCKS } from '@/api/client';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { useCandidatos } from '@/hooks/use-servicios';
import { usePerfilActivo, usePublicarPerfil } from '@/hooks/use-perfiles';
import { useToast } from '@/hooks/use-toast';
import { confirmar } from '@/utils/confirmar';
import { tiempoRelativo } from '@/utils/format';
import { Spacing } from '@/constants/theme';

export default function PublicarScreen() {
  const toast = useToast();
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const publicar = usePublicarPerfil(perfil?.id ?? '');
  const candidatos = useCandidatos(perfil?.id ?? '');

  const cabecera = (
    <ScreenHeader
      variante="cerrar"
      titulo="Publicación"
      subtitulo="Paso 03 · Publicar la necesidad y recibir candidaturas"
    />
  );

  if (isLoading) return <Loading mensaje="Cargando oferta…" />;

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
          titulo="Sin perfil de cuidado"
          descripcion="Para publicar una oferta necesitas un perfil de cuidado con las necesidades de tu familiar."
          accion={{ texto: 'Crear perfil de cuidado', onPress: () => router.push('/cuidado/nuevo') }}
        />
      </Screen>
    );
  }

  const publicada = perfil.estado !== 'borrador';
  const lista = candidatos.data ?? [];

  return (
    <Screen alRefrescar={() => void candidatos.refetch()}>
      {cabecera}

      <Card row>
        <View style={styles.flex}>
          <ThemedText type="smallBold">
            {publicada ? 'Oferta publicada' : 'Oferta en borrador'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {perfil.ubicacion.zona} · {perfil.horario.desde}–{perfil.horario.hasta}
          </ThemedText>
        </View>
        <Badge
          texto={
            publicada ? (perfil.estado === 'en_seleccion' ? 'En selección' : 'Activa') : 'Borrador'
          }
          tono={publicada ? (perfil.estado === 'en_seleccion' ? 'warning' : 'success') : 'neutral'}
        />
      </Card>

      {!publicada ? (
        <Button
          titulo="Publicar oferta"
          cargando={publicar.isPending}
          onPress={() =>
            // Publicar es irreversible desde la app: se confirma antes.
            confirmar(
              {
                titulo: 'Publicar oferta',
                mensaje:
                  'Tu oferta será visible para los cuidadores de tu zona y empezarán a llegar candidaturas. ¿Publicar?',
                accion: 'Publicar',
              },
              () => {
                publicar
                  .mutateAsync()
                  .then(() =>
                    toast.exito(
                      USAR_MOCKS
                        ? 'Oferta publicada: 2 cuidadores han enviado candidatura.'
                        : 'Oferta publicada: empezarán a llegar candidaturas.',
                    ),
                  )
                  .catch(() => {
                    /* El fallo ya lo comunica el banner global (QueryClient). */
                  });
              },
            )
          }
          fullWidth
        />
      ) : null}

      <SectionHeader titulo="Visibilidad de la oferta pública" />
      <Card>
        <FilaVisibilidad etiqueta="Zona y horarios" visible />
        <FilaVisibilidad etiqueta="Necesidades generales" visible />
        <FilaVisibilidad etiqueta="Datos clínicos identificables" visible={false} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.nota}>
          La oferta pública nunca muestra información clínica identificable de la persona cuidada.
        </ThemedText>
      </Card>

      <SectionHeader titulo={`Candidaturas · ${lista.length}`} />
      {candidatos.isError ? (
        <ErrorState
          titulo="No hemos podido cargar las candidaturas"
          descripcion="Revisa tu conexión e inténtalo de nuevo."
          accion={{ texto: 'Reintentar', onPress: () => void candidatos.refetch() }}
        />
      ) : lista.length === 0 ? (
        <EmptyState
          titulo="Sin candidaturas todavía"
          descripcion="Cuando los cuidadores presenten su candidatura, las verás aquí con su estado."
        />
      ) : (
        <View style={styles.lista}>
          {lista.map(({ candidatura, cuidador }) => (
            <Card
              key={candidatura.id}
              row
              onPress={() => router.push({ pathname: '/seleccion', params: { destacar: candidatura.id } })}>
              <Avatar nombre={cuidador.nombre} />
              <View style={styles.flex}>
                <ThemedText type="smallBold">{cuidador.nombre}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {cuidador.anosExperiencia} años de experiencia · {tiempoRelativo(candidatura.creadaEn)}
                </ThemedText>
              </View>
              <Badge
                texto={ESTADOS_CANDIDATURA[candidatura.estado]}
                tono={
                  candidatura.estado === 'seleccionada'
                    ? 'success'
                    : candidatura.estado === 'nueva'
                      ? 'primary'
                      : 'neutral'
                }
              />
            </Card>
          ))}
        </View>
      )}

      <Button
        titulo="Comparar y seleccionar cuidador"
        variante="secondary"
        disabled={lista.length === 0}
        onPress={() => router.push('/seleccion')}
      />
    </Screen>
  );
}

const ESTADOS_CANDIDATURA: Record<string, string> = {
  nueva: 'Nueva',
  vista: 'Vista',
  preseleccionada: 'Preseleccionada',
  seleccionada: 'Seleccionada',
  rechazada: 'Rechazada',
};

function FilaVisibilidad({ etiqueta, visible }: { etiqueta: string; visible: boolean }) {
  return (
    <View style={styles.filaVisibilidad}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
        {etiqueta}
      </ThemedText>
      <Badge texto={visible ? 'Visible' : 'Oculto'} tono={visible ? 'success' : 'neutral'} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  lista: {
    gap: Spacing.two,
  },
  nota: {
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  filaVisibilidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
