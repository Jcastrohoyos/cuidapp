import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { TarjetaPerfil } from '@/components/ui/profile-card';
import { ErrorState } from '@/components/ui/error-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useTextoGrande } from '@/components/text';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/use-auth';
import { usePerfiles } from '@/hooks/use-perfiles';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding, ONBOARDING_KEYS } from '@/hooks/use-onboarding';
import { Tooltip } from '@/components/ui/tooltip';
import { useDataStore } from '@/store/data-store';
import { USAR_MOCKS } from '@/api/client';
import { confirmar } from '@/utils/confirmar';
import { Spacing } from '@/constants/theme';
import { FRANJAS_TEXTO } from '@/constants/textos';
import { useRef } from 'react';

export default function PerfilScreen() {
  const toast = useToast();
  const { yaVisto, marcarVisto } = useOnboarding();
  const { cerrarSesion } = useAuth();
  const { data: perfiles, isLoading, isError, refetch } = usePerfiles();
  // Copia local persistida (AsyncStorage): se edita en /cuenta y sobrevive a reinicios.
  // Al iniciar sesión se sincroniza con la cuenta con la que se entra.
  const familia = useDataStore((estado) => estado.familia);
  const theme = useTheme();
  const { textoGrande, setTextoGrande } = useTextoGrande();

  // Ref para tooltip de ayuda
  const refAyuda = useRef<React.ElementRef<typeof Pressable>>(null);

  const confirmarSalir = () => {
    confirmar(
      {
        titulo: 'Cerrar sesión',
        mensaje: '¿Seguro que quieres salir de tu cuenta familiar?',
        accion: 'Salir',
        destructiva: true,
      },
      () => {
        // Si el cierre falla (almacén del token inaccesible) la familia debe
        // saberlo: sin aviso, el botón parecería no hacer nada.
        void cerrarSesion()
          .then(() => router.replace('/(auth)/login'))
          .catch(() =>
            toast.error('No hemos podido cerrar la sesión. Inténtalo de nuevo en un momento.'),
          );
      },
    );
  };

  // El plan marca cuántos perfiles de cuidado se pueden gestionar: si se llega
  // al máximo, se explica en lugar de dejar crear uno más sin avisar.
  const maxPerfiles = familia?.perfilesMaximos ?? 1;
  const alLimite = (perfiles?.length ?? 0) >= maxPerfiles;
  const nuevoPerfil = () => {
    if (alLimite) {
      toast.info(
        `Tu plan incluye ${maxPerfiles} ${maxPerfiles === 1 ? 'perfil de cuidado' : 'perfiles de cuidado'}. ` +
          'Amplía tu plan para gestionar más personas desde la misma cuenta.',
      );
      return;
    }
    router.push('/cuidado/nuevo');
  };

  return (
    <Screen alRefrescar={() => void refetch()}>
      <ScreenHeader variante="atras" titulo="Perfil" />

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
        accion={{ texto: '+ Nuevo', onPress: nuevoPerfil }}
      />
      <View style={styles.lista}>
        {isError ? (
          <ErrorState
            titulo="No hemos podido cargar tus perfiles"
            accion={{ texto: 'Reintentar', onPress: () => void refetch() }}
          />
        ) : isLoading ? (
          // Mientras se cargan no se anuncia "sin perfiles": la familia vería
          // un vacío que no es real.
          <Loading mensaje="Cargando perfiles…" />
        ) : (
          (perfiles ?? []).map((perfil) => (
            <TarjetaPerfil
              key={perfil.id}
              perfil={perfil}
              accessibilityHint={`Abre el perfil de cuidado de ${perfil.persona.nombre}`}
              onPress={() =>
                router.push({ pathname: '/cuidado/[id]', params: { id: perfil.id } })
              }
            />
          ))
        )}
        {!isError && !isLoading && (perfiles ?? []).length === 0 ? (
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

      <Button
        ref={refAyuda}
        titulo="Cómo funciona Cuidapp"
        variante="secondary"
        onPress={() => router.push('/ayuda')}
      />

      {!yaVisto(ONBOARDING_KEYS.PERFIL_AYUDA) && (
        <Tooltip
          clave={ONBOARDING_KEYS.PERFIL_AYUDA}
          targetRef={refAyuda}
          texto="Aquí tienes el tutorial paso a paso de 7 pasos con consejos útiles."
          posicion="arriba"
          onDescartar={() => marcarVisto(ONBOARDING_KEYS.PERFIL_AYUDA)}
          mostrarContinuar
        />
      )}

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
