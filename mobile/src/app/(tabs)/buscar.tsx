import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Lucide from '@react-native-vector-icons/lucide';

import { Text, useTextoGrande, FACTOR_TEXTO_GRANDE } from '@/components/text';
import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useCuidadores } from '@/hooks/use-cuidadores';
import { usePerfilActivo } from '@/hooks/use-perfiles';
import { useTheme } from '@/hooks/use-theme';
import { useDataStore } from '@/store/data-store';
import { calcularAfinidad } from '@/utils/afinidad';
import { filtrarCuidadores } from '@/utils/buscar-cuidadores';
import { formatearDecimal, formatearEuro } from '@/utils/format';
import { fam, FontSize, Radius, Spacing } from '@/constants/theme';
import { tonoPorAfinidad } from '@/constants/textos';
import type { Cuidador, TipoVerificacion } from '@/types';

interface FilaCuidadorProps {
  cuidador: Cuidador;
  competenciasRequeridas: string[];
  verificacionesMinimas: TipoVerificacion[];
}

/**
 * Fila de resultado: mismos datos que la fila de la demo (nombre con marca de
 * verificado, experiencia, valoración, distancia, tarifa y % de afinidad).
 * El % sale de las competencias declaradas —nada inventado— igual que en
 * Selección.
 */
function FilaCuidador({
  cuidador,
  competenciasRequeridas,
  verificacionesMinimas,
}: FilaCuidadorProps) {
  const theme = useTheme();
  const afinidad = calcularAfinidad(competenciasRequeridas, cuidador.competencias ?? []);
  const tono = tonoPorAfinidad(afinidad);
  // `null` = sin preferencias de verificación: no se juzga (nada inventado).
  const verificado =
    verificacionesMinimas.length > 0
      ? verificacionesMinimas.every((tipo) =>
          cuidador.verificaciones.some(
            (verificacion) => verificacion.tipo === tipo && verificacion.estado === 'verificada',
          ),
        )
      : null;

  return (
    <Card row>
      <Avatar nombre={cuidador.nombre} />
      <View style={styles.flex}>
        <View style={styles.nombreFila}>
          <ThemedText type="smallBold">{cuidador.nombre}</ThemedText>
          {verificado !== null ? (
            <Text
              style={[
                styles.verificado,
                { color: verificado ? theme.success : theme.warning },
              ]}>
              {verificado ? '✓ Verificado' : 'Verificación pendiente'}
            </Text>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {cuidador.anosExperiencia} años de experiencia
          {cuidador.valoracion
            ? ` · ★ ${formatearDecimal(cuidador.valoracion)} (${cuidador.valoraciones ?? 0})`
            : ''}
          {cuidador.distanciaKm ? ` · a ${cuidador.distanciaKm} km` : ''}
          {cuidador.tarifaHora ? ` · ${formatearEuro(cuidador.tarifaHora)}/h` : ''}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Disponibilidad: {cuidador.disponibilidad}
        </ThemedText>
        {cuidador.competencias && cuidador.competencias.length > 0 ? (
          <View style={styles.chips}>
            {cuidador.competencias.map((competencia) => (
              <Chip key={competencia} texto={competencia} />
            ))}
          </View>
        ) : null}
      </View>
      {afinidad !== null ? <Badge texto={`Afinidad ${afinidad}%`} tono={tono} /> : null}
    </Card>
  );
}

/**
 * Pestaña «Buscar» (misma que la demo de la landing): texto libre + los
 * cuatro chips de filtros sobre el directorio de cuidadores, con el recuento
 * de coincidencias y la ficha de cada resultado.
 */
export default function BuscarScreen() {
  const theme = useTheme();
  const { textoGrande } = useTextoGrande();
  // La cuenta familiar vive en el almacén (se sincroniza al iniciar sesión):
  // el nombre y el correo con los que se entra son los de la familia.
  const familia = useDataStore((estado) => estado.familia);
  const { perfil } = usePerfilActivo();
  const cuidadores = useCuidadores();

  const [texto, setTexto] = useState('');
  const [cercaDe, setCercaDe] = useState(true);
  const [porDisponibilidad, setPorDisponibilidad] = useState(false);
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [mejorValorados, setMejorValorados] = useState(false);

  const preferencias = familia?.preferencias;
  const distanciaMaxKm = preferencias?.distanciaMaxKm ?? 10;
  const franjas = preferencias?.franjas;
  const verificacionesMinimas = preferencias?.verificacionesMinimas;
  const tarifaMaxHora = preferencias?.tarifaMaxHora;

  const resultados = useMemo(
    () =>
      filtrarCuidadores(cuidadores.data ?? [], {
        texto,
        cercaDe,
        distanciaMaxKm,
        porDisponibilidad,
        franjas: franjas ?? [],
        soloVerificados,
        verificacionesMinimas: verificacionesMinimas ?? [],
        mejorValorados,
        tarifaMaxHora,
      }),
    [
      cuidadores.data,
      texto,
      cercaDe,
      distanciaMaxKm,
      porDisponibilidad,
      franjas,
      soloVerificados,
      verificacionesMinimas,
      mejorValorados,
      tarifaMaxHora,
    ],
  );

  const quitarFiltros = () => {
    setTexto('');
    setCercaDe(false);
    setPorDisponibilidad(false);
    setSoloVerificados(false);
    setMejorValorados(false);
  };

  const cabecera = (
    <ScreenHeader
      variante="ninguno"
      titulo="Buscar"
      subtitulo={`Cuidadores cerca de ${familia?.ubicacion?.ciudad ?? 'tu zona'}`}
    />
  );

  if (cuidadores.isLoading) return <Loading mensaje="Buscando cuidadores…" />;

  if (cuidadores.isError) {
    return (
      <Screen>
        {cabecera}
        <ErrorState accion={{ texto: 'Reintentar', onPress: () => void cuidadores.refetch() }} />
      </Screen>
    );
  }

  return (
    <Screen alRefrescar={cuidadores.refetch}>
      {cabecera}

      {/* Buscador (mismo encaje que en la demo; el texto filtra de verdad) */}
      <View
        style={[
          styles.buscador,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <Lucide
          name="search"
          size={18}
          color={theme.textSecondary}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Buscar por nombre o competencia"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { color: theme.text },
            // El input no pasa por <Text>: la escala "Texto grande" va aquí.
            ...(textoGrande ? [{ fontSize: FontSize.base * FACTOR_TEXTO_GRANDE }] : []),
          ]}
          accessibilityLabel="Buscar cuidadores por nombre o competencia"
          autoCorrect={false}
        />
        {texto ? (
          <Pressable
            onPress={() => setTexto('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            style={({ pressed }) => pressed && styles.pulsado}>
            <Lucide name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Chips de filtros: los mismos de la demo */}
      <View style={styles.chips}>
        <Chip
          texto={`${familia?.ubicacion?.ciudad ?? 'Tu zona'} · ${distanciaMaxKm} km`}
          seleccionado={cercaDe}
          onPress={() => setCercaDe((valor) => !valor)}
        />
        <Chip
          texto="Disponibilidad"
          seleccionado={porDisponibilidad}
          onPress={() => setPorDisponibilidad((valor) => !valor)}
        />
        <Chip
          texto="Verificados"
          seleccionado={soloVerificados}
          onPress={() => setSoloVerificados((valor) => !valor)}
        />
        <Chip
          texto="+4,5"
          seleccionado={mejorValorados}
          onPress={() => setMejorValorados((valor) => !valor)}
        />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        {resultados.length} {resultados.length === 1 ? 'cuidador coincide' : 'cuidadores coinciden'}
      </ThemedText>

      {resultados.length === 0 ? (
        <EmptyState
          titulo="Sin coincidencias"
          descripcion="Prueba con otros términos o quita algún filtro para ampliar la búsqueda."
          accion={{ texto: 'Quitar filtros', onPress: quitarFiltros }}
        />
      ) : (
        resultados.map((cuidador) => (
          <FilaCuidador
            key={cuidador.id}
            cuidador={cuidador}
            competenciasRequeridas={perfil?.competenciasRequeridas ?? []}
            verificacionesMinimas={verificacionesMinimas ?? []}
          />
        ))
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Cuando publiques la oferta de un perfil, los cuidadores que encajan te envían su
        candidatura y las verás en Selección.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: fam(400),
    paddingVertical: Spacing.two,
  },
  pulsado: {
    opacity: 0.7,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  nombreFila: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  verificado: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
