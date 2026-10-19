import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

import { USAR_MOCKS } from '@/api/client';
import { Avatar } from '@/components/ui/avatar';
import { Badge, badgeEstadoPerfil } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { usePerfil, usePublicarPerfil, useEliminarPerfil } from '@/hooks/use-perfiles';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { confirmar } from '@/utils/confirmar';
import { calcularEdad } from '@/utils/format';
import { Spacing } from '@/constants/theme';
import type { DiaSemana } from '@/types';

/** Iniciales de día usadas en la fila "Días" (L · M · X · J · V). */
const DIAS_CORTOS: Record<DiaSemana, string> = {
  lunes: 'L',
  martes: 'M',
  miercoles: 'X',
  jueves: 'J',
  viernes: 'V',
  sabado: 'S',
  domingo: 'D',
};

const TEXTO_GENERO: Record<string, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  otro: 'Otro',
};

export default function PerfilCuidadoScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const establecerPerfilActivo = useAuthStore((estado) => estado.establecerPerfilActivo);
  const perfilActivoId = useAuthStore((estado) => estado.perfilActivoId);
  const { data: perfil, isLoading, isError, refetch } = usePerfil(id ?? '');
  const publicar = usePublicarPerfil(id ?? '');
  const eliminar = useEliminarPerfil();

  useEffect(() => {
    if (id) establecerPerfilActivo(id);
  }, [id, establecerPerfilActivo]);

  const cabecera = <ScreenHeader titulo="Perfil de cuidado" />;

  if (isLoading) return <Loading mensaje="Cargando perfil de cuidado…" />;

  if (isError) {
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
          titulo="Perfil no encontrado"
          descripcion="Puede que este perfil se haya eliminado o que el enlace ya no sea válido."
          accion={{ texto: 'Volver a inicio', onPress: () => router.replace('/(tabs)') }}
        />
      </Screen>
    );
  }

  // Datos privados del registro: solo se listan los que tengan valor.
  const ds = perfil.datosSensibles;
  const filasSensibles: { etiqueta: string; valor: string }[] = [];
  if (ds.autonomia) filasSensibles.push({ etiqueta: 'Autonomía', valor: ds.autonomia });
  if (ds.cognicion) filasSensibles.push({ etiqueta: 'Cognición', valor: ds.cognicion });
  if (ds.vision) filasSensibles.push({ etiqueta: 'Visión', valor: ds.vision });
  if (ds.oido) filasSensibles.push({ etiqueta: 'Oído', valor: ds.oido });
  if (ds.medicacion) filasSensibles.push({ etiqueta: 'Medicación', valor: ds.medicacion });
  if (ds.convivencia) filasSensibles.push({ etiqueta: 'Convivencia', valor: ds.convivencia });
  if (ds.vivienda) filasSensibles.push({ etiqueta: 'Vivienda', valor: ds.vivienda });
  if (ds.patologias) filasSensibles.push({ etiqueta: 'Patologías', valor: ds.patologias });
  if (ds.alergias) filasSensibles.push({ etiqueta: 'Alergias', valor: ds.alergias });

  return (
    <Screen alRefrescar={() => void refetch()}>
      {cabecera}

      <Card row>
        <Avatar nombre={perfil.persona.nombre} tamano="lg" />
        <View style={styles.flex}>
          <ThemedText type="smallBold">
            {perfil.persona.nombre}
            {perfil.persona.fechaNacimiento
              ? `, ${calcularEdad(perfil.persona.fechaNacimiento)} años`
              : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {perfil.persona.relacion ? `${perfil.persona.relacion} · ` : ''}
            {perfil.ubicacion.zona}, {perfil.ubicacion.ciudad}
          </ThemedText>
        </View>
        <Badge {...badgeEstadoPerfil(perfil.estado)} />
      </Card>

      <SectionHeader titulo="Necesidades y atención" />
      <Card>
        <View style={styles.kv}>
          <FilaDato etiqueta="Tipo de atención" valor={perfil.tipoAtencion} />
          {perfil.persona.genero && perfil.persona.genero !== 'no_especificar' ? (
            <FilaDato etiqueta="Género" valor={TEXTO_GENERO[perfil.persona.genero]} />
          ) : null}
          <FilaDato etiqueta="Horario" valor={`${perfil.horario.desde}–${perfil.horario.hasta}`} />
          <FilaDato
            etiqueta="Días"
            valor={perfil.horario.dias.map((dia) => DIAS_CORTOS[dia]).join(' · ')}
          />
          <FilaDato etiqueta="Movilidad" valor={perfil.movilidad ?? 'No indicada'} />
        </View>
      </Card>

      <SectionHeader titulo="Hábitos y rutinas" />
      <View style={styles.chips}>
        {perfil.habitos.map((habito) => (
          <Chip key={habito} texto={habito} />
        ))}
      </View>
      {perfil.habitos.length === 0 ? (
        <EmptyState
          titulo="Sin hábitos registrados"
          descripcion="Al crear o editar el perfil puedes detallar horarios, comidas, descansos y aficiones."
        />
      ) : null}

      <SectionHeader titulo="Competencias necesarias en el cuidador" />
      <View style={styles.chips}>
        {perfil.competenciasRequeridas.map((competencia) => (
          <Chip key={competencia} texto={competencia} />
        ))}
      </View>
      {perfil.competenciasRequeridas.length === 0 ? (
        <EmptyState
          titulo="Sin competencias definidas"
          descripcion="Indica si necesitas experiencia en movilidad, demencia, administración de medicación…"
        />
      ) : null}

      {perfil.notas ? (
        <Card>
          <SectionHeader titulo="Notas" />
          <ThemedText type="small" themeColor="textSecondary">
            {perfil.notas}
          </ThemedText>
        </Card>
      ) : null}

      {filasSensibles.length > 0 ? (
        <>
          <SectionHeader titulo="Salud y autonomía" />
          <Card>
            <View style={styles.sensible}>
              <Lucide
                name="lock"
                size={20}
                color={theme.danger}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
              <View style={styles.flex}>
                <ThemedText type="smallBold">Solo visibles para la familia</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Nunca aparecen en la oferta pública ni en los datos del candidato.
                </ThemedText>
              </View>
            </View>
            <View style={styles.kv}>
              {filasSensibles.map((fila) => (
                <FilaDato key={fila.etiqueta} etiqueta={fila.etiqueta} valor={fila.valor} />
              ))}
            </View>
            {ds.descripcion ? (
              <ThemedText type="small" themeColor="textSecondary">
                {ds.descripcion}
              </ThemedText>
            ) : null}
          </Card>
        </>
      ) : (
        <Card>
          <View style={styles.sensible}>
            <Lucide
              name="lock"
              size={20}
              color={theme.danger}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            <View style={styles.flex}>
              <ThemedText type="smallBold">Datos sensibles</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {perfil.datosSensibles.descripcion ??
                  'La información sensible se guarda separada y no se muestra en la oferta pública.'}
              </ThemedText>
            </View>
          </View>
        </Card>
      )}

      {perfil.estado === 'borrador' ? (
        <Button
          titulo="Publicar oferta de cuidado"
          cargando={publicar.isPending}
          onPress={() =>
            // Publicar es irreversible desde la app: se confirma antes.
            confirmar(
              {
                titulo: 'Publicar oferta',
                mensaje:
                  'La oferta será visible para los cuidadores de tu zona y empezarás a recibir candidaturas. ¿Publicar?',
                accion: 'Publicar',
              },
              () =>
                publicar.mutate(undefined, {
                  onSuccess: () => {
                    toast.exito(
                      USAR_MOCKS
                        ? 'Oferta publicada: 2 cuidadores han enviado candidatura.'
                        : 'Oferta publicada: ya puede recibir candidaturas.',
                    );
                    router.push('/publicar');
                  },
                }),
            )
          }
        />
      ) : perfil.estado === 'en_seleccion' ? (
        <>
          <Button titulo="Ver y comparar candidaturas" onPress={() => router.push('/seleccion')} />
          <Button
            titulo="Ver oferta y candidaturas"
            variante="secondary"
            onPress={() => router.push('/publicar')}
          />
        </>
      ) : (
        <Button titulo="Ver oferta y candidaturas" variante="secondary" onPress={() => router.push('/publicar')} />
      )}

      {perfil.estado === 'con_cuidador' ? (
        <>
          <Button titulo="Mi cuidador" variante="secondary" onPress={() => router.push('/cuidador')} />
          <Button titulo="Ver rutina de hoy" variante="ghost" onPress={() => router.push('/rutina')} />
        </>
      ) : null}

      {/* Quitar a la persona: destructivo y con confirmación explícita. */}
      <SectionHeader titulo="Quitar a la persona" />
      <ThemedText type="small" themeColor="textSecondary" style={styles.aviso}>
        Si ya no necesitáis acompañamiento, elimina el perfil de {perfil.persona.nombre}. Se borran
        también su rutina, incidencias, candidaturas, historial y la configuración del cuidador. No
        se puede deshacer.
      </ThemedText>
      <Button
        titulo={`Eliminar a ${perfil.persona.nombre}`}
        variante="danger"
        cargando={eliminar.isPending}
        onPress={() =>
          confirmar(
            {
              titulo: 'Eliminar perfil',
              mensaje: `Se eliminará el perfil de ${perfil.persona.nombre} con toda su información (rutina, incidencias, candidaturas e historial). Esta acción no se puede deshacer. ¿Continuar?`,
              accion: 'Eliminar',
              destructiva: true,
            },
            () =>
              eliminar.mutate(id ?? '', {
                onSuccess: () => {
                  // Si el activo era este, se despeja para que el resto de
                  // pantallas resuelvan el siguiente perfil (o el vacío).
                  if (perfilActivoId === id) establecerPerfilActivo(null);
                  toast.exito(`El perfil de ${perfil.persona.nombre} se ha eliminado.`);
                  router.replace('/(tabs)');
                },
              }),
          )
        }
      />
    </Screen>
  );
}

function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.filaDato}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.valorDato}>
        {valor}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  kv: {
    gap: Spacing.two,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  valorDato: {
    flex: 1,
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sensible: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  aviso: {
    lineHeight: 18,
  },
});
