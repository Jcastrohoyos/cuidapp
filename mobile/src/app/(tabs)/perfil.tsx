import { router } from 'expo-router';
import { StyleSheet, Switch, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge, badgeEstadoPerfil } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useTextoGrande } from '@/components/text';
import { ThemedText } from '@/components/themed-text';
import { useAuth, useSesion } from '@/hooks/use-auth';
import { usePerfiles } from '@/hooks/use-perfiles';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { useDataStore } from '@/store/data-store';
import { USAR_MOCKS } from '@/api/client';
import { confirmar } from '@/utils/confirmar';
import { calcularEdad } from '@/utils/format';
import { Spacing } from '@/constants/theme';
import type { FranjaDisponibilidad } from '@/types';

const FRANJAS_TEXTO: Record<FranjaDisponibilidad, string> = {
  manana: 'mañanas',
  tarde: 'tardes',
  noche: 'noches',
};

export default function PerfilScreen() {
  const sesion = useSesion();
  const toast = useToast();
  const { cerrarSesion } = useAuth();
  const { data: perfiles, isError, refetch } = usePerfiles();
  // Copia local persistida (AsyncStorage): se edita en /cuenta y sobrevive a reinicios.
  const familiaLocal = useDataStore((estado) => estado.familia);
  const familia = familiaLocal ?? sesion?.familia;
  const theme = useTheme();
  const { textoGrande, setTextoGrande } = useTextoGrande();

  const confirmarSalir = () => {
    confirmar(
      {
        titulo: 'Cerrar sesión',
        mensaje: '¿Seguro que quieres salir de tu cuenta familiar?',
        accion: 'Salir',
        destructiva: true,
      },
      () => {
        void cerrarSesion().then(() => router.replace('/(auth)/login'));
      },
    );
  };

  return (
    <Screen alRefrescar={() => void refetch()}>
      <ScreenHeader variante="ninguno" titulo="Perfil" />

      <Card row>
        <Avatar nombre={familia?.nombre ?? 'Familia'} tamano="lg" />
        <View style={styles.flex}>
          <ThemedText type="smallBold">{familia?.nombre}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {familia?.email}
          </ThemedText>
          {familia?.telefono || familia?.ubicacion ? (
            <ThemedText type="small" themeColor="textSecondary">
              {familia?.telefono ?? ''}
              {familia?.telefono && familia?.ubicacion ? ' · ' : ''}
              {familia?.ubicacion
                ? `${familia.ubicacion.zona}, ${familia.ubicacion.ciudad}`
                : ''}
            </ThemedText>
          ) : null}
        </View>
        <Badge texto={familia?.plan ?? 'gratuito'} tono="primary" />
      </Card>

      {familia ? (
        <Card>
          <SectionHeader titulo="Datos de la familia" />
          <ThemedText type="small" themeColor="textSecondary">
            {familia.miembros.length} familiar(es) con acceso
            {familia.contactoEmergencia
              ? ` · emergencia: ${familia.contactoEmergencia.nombre} (${familia.contactoEmergencia.telefono})`
              : ''}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Búsqueda:
            {familia.preferencias.distanciaMaxKm
              ? ` hasta ${familia.preferencias.distanciaMaxKm} km`
              : ''}
            {familia.preferencias.tarifaMaxHora
              ? ` · máx. ${familia.preferencias.tarifaMaxHora} €/h`
              : ''}
            {familia.preferencias.franjas.length
              ? ` · ${familia.preferencias.franjas.map((f) => FRANJAS_TEXTO[f]).join(', ')}`
              : ' · todo el día'}
          </ThemedText>
          <Button
            titulo="Editar datos"
            variante="secondary"
            tamano="sm"
            onPress={() => router.push('/cuenta')}
          />
        </Card>
      ) : null}

      <SectionHeader
        titulo="Perfiles de cuidado"
        accion={{ texto: '+ Nuevo', onPress: () => router.push('/cuidado/nuevo') }}
      />
      <View style={styles.lista}>
        {isError ? (
          <ErrorState
            titulo="No hemos podido cargar tus perfiles"
            accion={{ texto: 'Reintentar', onPress: () => void refetch() }}
          />
        ) : (
          (perfiles ?? []).map((perfil) => (
          <Card
            key={perfil.id}
            row
            accessibilityHint={`Abre el perfil de cuidado de ${perfil.persona.nombre}`}
            onPress={() => router.push({ pathname: '/cuidado/[id]', params: { id: perfil.id } })}>
            <Avatar nombre={perfil.persona.nombre} />
            <View style={styles.flex}>
              <ThemedText type="smallBold">
                {perfil.persona.nombre}
                {perfil.persona.fechaNacimiento
                  ? `, ${calcularEdad(perfil.persona.fechaNacimiento)} años`
                  : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {perfil.ubicacion.zona}, {perfil.ubicacion.ciudad}
              </ThemedText>
            </View>
            <Badge {...badgeEstadoPerfil(perfil.estado)} />
          </Card>
        ))
        )}
        {!isError && (perfiles ?? []).length === 0 ? (
          <EmptyState
            titulo="Sin perfiles de cuidado"
            descripcion="Crea un perfil para organizar la rutina, publicar la oferta y seguir el informe diario."
            accion={{ texto: 'Crear perfil de cuidado', onPress: () => router.push('/cuidado/nuevo') }}
          />
        ) : null}
      </View>

      <Card>
        <SectionHeader titulo="Plan" />
        <ThemedText type="small" themeColor="textSecondary">
          Plan {familia?.plan ?? 'gratuito'} · hasta {familia?.perfilesMaximos ?? 1} perfil(es) de
          cuidado. Amplía tu plan para gestionar varios perfiles desde la misma cuenta.
        </ThemedText>
        <Button
          titulo="Ver planes"
          variante="secondary"
          tamano="sm"
          onPress={() => toast.info('Los planes estarán disponibles muy pronto: podrás ampliar tu cuenta desde aquí.')}
        />
      </Card>

        <Card>
        <SectionHeader titulo="Accesibilidad" />
        <View style={styles.filaAjuste}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">Texto grande</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Aumenta el tamaño de todo el texto de la app para leerlo con más comodidad.
            </ThemedText>
          </View>
          <Switch
            value={textoGrande}
            onValueChange={setTextoGrande}
            trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
            accessibilityLabel="Texto grande"
          />
        </View>
      </Card>

      {USAR_MOCKS ? (
        <ThemedText type="small" themeColor="textSecondary">
          Estás en modo demo con datos de ejemplo sin backend.
        </ThemedText>
      ) : null}

      <Button titulo="Cerrar sesión" variante="danger" onPress={confirmarSalir} />
    </Screen>
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
  filaAjuste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
