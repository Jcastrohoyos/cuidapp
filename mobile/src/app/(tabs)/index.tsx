import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';
import { Text } from '@/components/text';

import { USAR_MOCKS } from '@/api/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { TarjetaPerfil } from '@/components/ui/profile-card';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Recorrido } from '@/components/recorrido';
import { ThemedText } from '@/components/themed-text';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useRecorrido } from '@/hooks/use-recorrido';
import { useRutina } from '@/hooks/use-rutina';
import { useSesion } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useOnboarding, ONBOARDING_KEYS } from '@/hooks/use-onboarding';
import { fechaHoy, porcentaje } from '@/utils/format';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';
import { Tooltip } from '@/components/ui/tooltip';
import { useRef } from 'react';

export default function InicioScreen() {
  const sesion = useSesion();
  const theme = useTheme();
  const { perfil, isLoading, esError, refetch } = usePerfilActivo();
  const hoy = fechaHoy();
  const rutina = useRutina(perfil?.id ?? '', hoy);
  const recorrido = useRecorrido();
  const { yaVisto, marcarVisto } = useOnboarding();

  // Refs para los tooltips de onboarding
  const refBuscar = useRef<React.ElementRef<typeof Pressable>>(null);
  const refPerfil = useRef<React.ElementRef<typeof Pressable>>(null);

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
        <Cabecera nombre={sesion?.familia.nombre ?? ''} />
        <ErrorState accion={{ texto: 'Reintentar', onPress: () => void refetch() }} />
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen>
        <Cabecera nombre={sesion?.familia.nombre ?? ''} />
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
      <Cabecera nombre={sesion?.familia.nombre ?? ''} refPerfil={refPerfil} />

      {/* Atajo al buscador (mismo encaje que en la demo; abre la pestaña Buscar) */}
      <Pressable
        ref={refBuscar}
        onPress={() => router.push('/buscar')}
        accessibilityRole="button"
        accessibilityLabel="Buscar cuidadores"
        accessibilityHint="Abre la pestaña Buscar"
        style={({ pressed }) => [
          styles.buscador,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          pressed && styles.pulsado,
        ]}>
        <Lucide
          name="search"
          size={18}
          color={theme.textSecondary}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Text style={[styles.buscadorTexto, { color: theme.textSecondary }]}>
          Buscar cuidador o competencia
        </Text>
      </Pressable>

      {/* Perfil de cuidado activo */}
      <Link href={`/cuidado/${perfil.id}`} asChild>
        <TarjetaPerfil
          perfil={perfil}
          mostrarHorario
          accessibilityHint={`Abre el perfil de cuidado de ${perfil.persona.nombre}`}
        />
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

      {/* Acceso a los informes (dejó de ser pestaña: se abre desde Inicio) */}
      <Card
        row
        onPress={() => router.push('/informes')}
        accessibilityHint="Abre los informes de adherencia, incidencias e historial">
        <Lucide
          name="chart-line"
          size={22}
          color={theme.primary}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <View style={styles.flex}>
          <ThemedText type="smallBold">Informes</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Adherencia, incidencias e historial
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="primary">
          Ver
        </ThemedText>
      </Card>

      {/* Recorrido de los 7 pasos: progreso + solo lo que queda por hacer */}
      <Recorrido
        pasos={recorrido.pasos}
        completados={recorrido.completados}
        total={recorrido.total}
        rutaPerfil={recorrido.rutaPerfil}
        onIr={(ruta) => router.push(ruta)}
      />

      {/* Tooltips de onboarding (solo si no se han visto) */}
      {!yaVisto(ONBOARDING_KEYS.INICIO_BUSCAR) && (
        <Tooltip
          clave={ONBOARDING_KEYS.INICIO_BUSCAR}
          targetRef={refBuscar}
          texto="Pulsa aquí para buscar cuidadores por zona, competencia o disponibilidad."
          posicion="abajo"
          onDescartar={() => marcarVisto(ONBOARDING_KEYS.INICIO_BUSCAR)}
          mostrarContinuar
        />
      )}
      {!yaVisto(ONBOARDING_KEYS.INICIO_PERFIL) && (
        <Tooltip
          clave={ONBOARDING_KEYS.INICIO_PERFIL}
          targetRef={refPerfil}
          texto="Tu perfil: cuenta, ajustes, ayuda y cerrar sesión."
          posicion="izquierda"
          onDescartar={() => marcarVisto(ONBOARDING_KEYS.INICIO_PERFIL)}
          mostrarContinuar
        />
      )}
    </Screen>
  );
}

/** Cabecera de Inicio: saludo + avatar que abre el perfil de cuenta
 * (el avatar de la demo de la landing; Perfil ya no es pestaña). */
function Cabecera({
  nombre,
  refPerfil,
}: {
  nombre: string;
  refPerfil?: React.RefObject<React.ElementRef<typeof Pressable> | null>;
}) {
  return (
    <View style={styles.cabecera}>
      <Saludo nombre={nombre} />
      <Pressable
        ref={refPerfil}
        onPress={() => router.push('/perfil')}
        accessibilityRole="button"
        accessibilityLabel="Abrir mi perfil"
        accessibilityHint="Abre tu cuenta, ajustes y ayuda"
        hitSlop={8}
        style={({ pressed }) => [styles.avatarBoton, pressed && styles.pulsado]}>
        <Avatar nombre={nombre || 'familia'} />
      </Pressable>
    </View>
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
  cabecera: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  avatarBoton: {
    borderRadius: Radius.full,
  },
  pulsado: {
    opacity: 0.7,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
  },
  buscadorTexto: {
    fontFamily: fam(400),
    fontSize: FontSize.base,
  },
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
