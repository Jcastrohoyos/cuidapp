import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { USAR_MOCKS } from '@/api/client';
import { Avatar } from '@/components/ui/avatar';
import { Badge, badgeEstadoPerfil } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Recorrido } from '@/components/recorrido';
import { ThemedText } from '@/components/themed-text';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useRecorrido } from '@/hooks/use-recorrido';
import { useRutina } from '@/hooks/use-rutina';
import { useSesion } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { calcularEdad, fechaHoy, formatearHorario, porcentaje } from '@/utils/format';
import { fam, FontSize, Radius } from '@/constants/theme';

export default function InicioScreen() {
  const sesion = useSesion();
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const hoy = fechaHoy();
  const rutina = useRutina(perfil?.id ?? '', hoy);
  const recorrido = useRecorrido();

  // Carga inicial con la forma del contenido en lugar de un spinner: menos
  // flash entre pantallas (la data real llega en cuestión de milisegundos).
  if (isLoading) {
    return (
      <Screen>
        <Skeleton alto={34} ancho="55%" radio={Radius.full} />
        <Skeleton alto={16} ancho="35%" />
        <Skeleton alto={88} />
        <Skeleton alto={130} />
        <Skeleton alto={20} ancho="50%" />
        <Skeleton alto={64} />
        <Skeleton alto={64} />
      </Screen>
    );
  }

  // Fallo de red ≠ "no hay perfiles": aquí se reintenta, no se miente.
  if (esError) {
    return (
      <Screen>
        <Saludo nombre={sesion?.familia.nombre ?? ''} />
        <ErrorState accion={{ texto: 'Reintentar', onPress: () => void refetch() }} />
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen>
        <Saludo nombre={sesion?.familia.nombre ?? ''} />
        <EmptyState
          titulo="Aún no hay perfiles de cuidado"
          descripcion="El perfil de cuidado es el eje de Cuidapp: describe a la persona y sus necesidades para organizar todo lo demás."
          accion={{ texto: 'Crear perfil de cuidado', onPress: () => router.push('/cuidado/nuevo') }}
        />
      </Screen>
    );
  }

  const realizadas = rutina.tareas.filter((t) => rutina.estadoTarea(t.id) === 'realizada').length;
  const totales = rutina.tareas.length;

  return (
    <Screen alRefrescar={() => {
      void refetch();
      rutina.refetch();
    }}>
      <Saludo nombre={sesion?.familia.nombre ?? ''} />

      {/* Perfil de cuidado activo */}
      <Link href={`/cuidado/${perfil.id}`} asChild>
        <Card row accessibilityHint={`Abre el perfil de cuidado de ${perfil.persona.nombre}`}>
          <Avatar nombre={perfil.persona.nombre} tamano="lg" />
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
            <ThemedText type="small" themeColor="textSecondary">
              {formatearHorario(perfil.horario.dias, perfil.horario.desde, perfil.horario.hasta)}
            </ThemedText>
          </View>
          <Badge {...badgeEstadoPerfil(perfil.estado)} />
        </Card>
      </Link>

      {/* Resumen del día */}
      <Card>
        <SectionHeader titulo="Rutina de hoy" />
        {totales > 0 ? (
          <>
            <ProgressBar
              valor={porcentaje(realizadas, totales)}
              etiqueta="Tareas completadas"
              detalle={`${realizadas} / ${totales}`}
            />
            <Button
              titulo="Ver rutina completa"
              variante="secondary"
              tamano="sm"
              onPress={() => router.push('/rutina')}
            />
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Sin tareas definidas todavía.
          </ThemedText>
        )}
      </Card>

      {/* Recorrido de los 7 pasos: progreso + solo lo que queda por hacer */}
      <Recorrido
        pasos={recorrido.pasos}
        completados={recorrido.completados}
        total={recorrido.total}
        rutaPerfil={recorrido.rutaPerfil}
        onIr={(ruta) => router.push(ruta)}
      />
    </Screen>
  );
}

function Saludo({ nombre }: { nombre: string }) {
  const theme = useTheme();
  return (
    <View style={styles.saludo}>
      <Text
        accessibilityRole="header"
        style={[styles.hola, { color: theme.text }]}>
        Hola, {nombre || 'familia'}
      </Text>
      <Text style={[styles.fecha, { color: theme.textSecondary }]}>
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      {/* Build sin backend: se avisa en la primera pantalla (junto a los avisos
          de login/recuperar/perfil, todos condicionados a USAR_MOCKS). */}
      {USAR_MOCKS ? (
        <Text style={[styles.fecha, { color: theme.textSecondary }]}>
          Modo demo · datos locales de ejemplo
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  saludo: {
    gap: 2,
  },
  hola: {
    fontFamily: fam(800),
    fontSize: FontSize['2xl'],
    fontWeight: '800',
  },
  fecha: {
    fontFamily: fam(400),
    fontSize: FontSize.sm,
    textTransform: 'capitalize',
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
