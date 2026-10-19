import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/components/text';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CampoTexto } from '@/components/ui/field';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemedText } from '@/components/themed-text';
import { useConfigCuidador, useGuardarConfigCuidador, useMiCuidador } from '@/hooks/use-cuidador';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { formatearDecimal } from '@/utils/format';
import { fam, FontSize, Spacing } from '@/constants/theme';
import type { PermisosCuidador, TipoVerificacion } from '@/types';

const TEXTOS_VERIFICACION: Record<TipoVerificacion, string> = {
  identidad: 'Identidad',
  formacion: 'Formación',
  penales: 'Antecedentes penales',
  referencias: 'Referencias',
};

const FILAS_PERMISO: {
  clave: keyof PermisosCuidador;
  titulo: string;
  descripcion: string;
}[] = [
  {
    clave: 'verDatosClinicos',
    titulo: 'Ver datos clínicos',
    descripcion: 'Patologías, alergias y medicación del perfil. Por defecto están ocultos.',
  },
  {
    clave: 'editarRutina',
    titulo: 'Editar la rutina',
    descripcion: 'Puede añadir o ajustar tareas del día.',
  },
  {
    clave: 'verInformes',
    titulo: 'Ver informes',
    descripcion: 'Adherencia, incidencias y valoración del servicio.',
  },
  {
    clave: 'registrarIncidencias',
    titulo: 'Registrar incidencias',
    descripcion: 'Puede apuntar lo que ocurra durante el turno y cerrar incidencias.',
  },
  {
    clave: 'avisarCompletadas',
    titulo: 'Avisarme al completar tareas',
    descripcion: 'Recibirás un aviso cuando el cuidador marque tareas como hechas.',
  },
];

export default function CuidadorScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { perfil, isLoading: cargandoPerfil, esError: errorPerfil, refetch: refetchPerfil } = usePerfilActivo();
  const perfilId = perfil?.id ?? '';

  const { cuidador, isLoading: cargandoCandidatos, esError: errorCandidatos, refetch: refetchCandidatos } =
    useMiCuidador(perfilId);
  const configQuery = useConfigCuidador(perfilId);
  const guardar = useGuardarConfigCuidador(perfilId);

  const config = configQuery.data;
  // Cada campo guarda la edición de la familia (`null` = sin tocar aún).
  // El valor visible deriva del override o, si no lo hay, del servidor: así
  // no hacen falta efectos de sincronización (patrón "state derivado").
  const [horarioEdit, setHorarioEdit] = useState<string | null>(null);
  const [tarifaEdit, setTarifaEdit] = useState<string | null>(null);
  const [notaEdit, setNotaEdit] = useState<string | null>(null);
  const [permisosEdit, setPermisosEdit] = useState<PermisosCuidador | null>(null);

  const horario = horarioEdit ?? config?.horarioAcordado ?? '';
  const tarifa = tarifaEdit ?? (config?.tarifaAcordada != null ? String(config.tarifaAcordada) : '');
  const nota = notaEdit ?? config?.nota ?? '';
  const permisos = permisosEdit ?? config?.permisos ?? null;

  const cargando = cargandoPerfil || cargandoCandidatos || configQuery.isLoading;
  const error = errorPerfil || errorCandidatos || configQuery.isError;

  if (cargando) {
    return (
      <Screen>
        <ScreenHeader variante="ninguno" titulo="Mi cuidador" />
        <Skeleton alto={120} />
        <Skeleton alto={20} ancho="45%" />
        <Skeleton alto={140} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ScreenHeader variante="ninguno" titulo="Mi cuidador" />
        <ErrorState
          accion={{
            texto: 'Reintentar',
            onPress: () => {
              void refetchPerfil();
              void refetchCandidatos();
              void configQuery.refetch();
            },
          }}
        />
      </Screen>
    );
  }

  if (!perfil) {
    return (
      <Screen>
        <ScreenHeader variante="ninguno" titulo="Mi cuidador" />
        <EmptyState
          titulo="Todavía no hay perfil de cuidado"
          descripcion="El cuidador se asigna a un perfil de cuidado concreto."
          accion={{ texto: 'Crear perfil de cuidado', onPress: () => router.push('/cuidado/nuevo') }}
        />
      </Screen>
    );
  }

  if (!cuidador) {
    return (
      <Screen>
        <ScreenHeader variante="ninguno" titulo="Mi cuidador" />
        <EmptyState
          titulo="Sin cuidador asignado todavía"
          descripcion="Cuando selecciones a un cuidador entre las candidaturas, podrás ver su perfil y configurar acuerdos y permisos aquí."
          accion={{ texto: 'Ver candidaturas', onPress: () => router.push('/seleccion') }}
        />
      </Screen>
    );
  }

  const todasVerificadas =
    cuidador.verificaciones.length > 0 &&
    cuidador.verificaciones.every((v) => v.estado === 'verificada');

  const guardarConfig = () => {
    const tarifaNumero = tarifa.trim() ? Number(tarifa.trim().replace(',', '.')) : undefined;
    guardar.mutate(
      {
        horarioAcordado: horario.trim() || undefined,
        tarifaAcordada: tarifaNumero != null && Number.isFinite(tarifaNumero) ? tarifaNumero : undefined,
        nota: nota.trim() || undefined,
        permisos: permisos ?? undefined,
      },
      { onSuccess: () => toast.exito('Configuración del cuidador guardada.') },
    );
  };

  return (
    <Screen alRefrescar={configQuery.refetch}>
      <ScreenHeader
        variante="ninguno"
        titulo="Mi cuidador"
        subtitulo={`${cuidador.nombre} · ${perfil.persona.nombre}`}
      />

      {/* ---- Perfil (solo lectura) ---- */}
      <Card>
        <View style={styles.cabecera}>
          <Avatar nombre={cuidador.nombre} />
          <View style={styles.flex}>
            <View style={styles.nombreFila}>
              <ThemedText type="smallBold">{cuidador.nombre}</ThemedText>
              {todasVerificadas ? (
                <Badge texto="✓ Verificado" tono="success" />
              ) : (
                <Badge texto="Verificación pendiente" tono="warning" />
              )}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {cuidador.anosExperiencia} años de experiencia
              {cuidador.valoracion
                ? ` · ★ ${formatearDecimal(cuidador.valoracion)} (${cuidador.valoraciones ?? 0} reseñas)`
                : ''}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Disponibilidad: {cuidador.disponibilidad}
            </ThemedText>
          </View>
        </View>

        {cuidador.biografia ? (
          <ThemedText type="small" themeColor="textSecondary">
            {cuidador.biografia}
          </ThemedText>
        ) : null}

        {cuidador.competencias?.length ? (
          <View style={styles.chips}>
            {cuidador.competencias.map((c) => (
              <Chip key={c} texto={c} />
            ))}
          </View>
        ) : null}

        <View style={styles.chips}>
          {cuidador.verificaciones.map((v) => (
            <Chip
              key={v.tipo}
              texto={`${TEXTOS_VERIFICACION[v.tipo]}: ${
                v.estado === 'verificada' ? 'verificada' : v.estado === 'pendiente' ? 'pendiente' : 'no aplica'
              }`}
            />
          ))}
        </View>
      </Card>

      {/* ---- Acuerdos ---- */}
      <SectionHeader titulo="Vuestros acuerdos" />
      <Card>
        <CampoTexto
          label="Horario acordado"
          valor={horario}
          onChangeTexto={setHorarioEdit}
          placeholder="Lunes a viernes · 09:00–13:00"
        />
        <CampoTexto
          label="Tarifa acordada (€/h)"
          valor={tarifa}
          onChangeTexto={setTarifaEdit}
          placeholder="14"
          teclado="decimal-pad"
        />
        <CampoTexto
          label="Nota para el cuidador"
          valor={nota}
          onChangeTexto={setNotaEdit}
          placeholder="Indicaciones útiles para sus turnos"
          multilinea
        />
      </Card>

      {/* ---- Permisos ---- */}
      <SectionHeader titulo="Qué puede ver y hacer" />
      <Card>
        {FILAS_PERMISO.map((fila, indice) => (
          <View
            key={fila.clave}
            style={[styles.filaAjuste, indice > 0 && styles.filaConBorde, { borderTopColor: theme.border }]}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{fila.titulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {fila.descripcion}
              </ThemedText>
            </View>
            <Switch
              value={permisos?.[fila.clave] ?? false}
              disabled={!permisos}
              onValueChange={(valor) => {
                if (!permisos) return;
                setPermisosEdit({ ...permisos, [fila.clave]: valor });
              }}
              trackColor={{ false: theme.backgroundSelected, true: theme.primary }}
              accessibilityLabel={fila.titulo}
            />
          </View>
        ))}
      </Card>

      <Button
        titulo="Guardar configuración"
        fullWidth
        cargando={guardar.isPending}
        onPress={guardarConfig}
      />

      <Text style={[styles.nota, { color: theme.textSecondary }]}>
        Los cambios se aplican al instante en la app del cuidador (demo: solo en este dispositivo).
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  nombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  filaAjuste: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  filaConBorde: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  nota: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
});
