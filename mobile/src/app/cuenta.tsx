import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { z } from 'zod';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CampoTexto } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { useDataStore } from '@/store/data-store';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { confirmar } from '@/utils/confirmar';
import { fam, Spacing } from '@/constants/theme';
import type { FranjaDisponibilidad, MiembroFamilia, TipoVerificacion } from '@/types';

const FRANJAS: { valor: FranjaDisponibilidad; texto: string }[] = [
  { valor: 'manana', texto: 'Mañanas' },
  { valor: 'tarde', texto: 'Tardes' },
  { valor: 'noche', texto: 'Noches' },
];

const VERIFICACIONES: { valor: TipoVerificacion; texto: string }[] = [
  { valor: 'identidad', texto: 'Identidad' },
  { valor: 'formacion', texto: 'Formación' },
  { valor: 'penales', texto: 'Antecedentes' },
  { valor: 'referencias', texto: 'Referencias' },
];

const esquema = z.object({
  nombre: z.string().min(2, { message: 'Indica el nombre de la cuenta.' }),
  email: z.string().email({ message: 'Correo no válido.' }),
  telefono: z.string().optional(),
  ciudad: z.string().min(2, { message: 'Indica la ciudad.' }),
  zona: z.string().min(2, { message: 'Indica la zona o barrio.' }),
  distanciaMaxKm: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,2}([.,]\d{1,2})?$/.test(v), { message: 'Solo números (km).' }),
  tarifaMaxHora: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,3}$/.test(v), { message: 'Solo números (€/h).' }),
  emergenciaNombre: z.string().optional(),
  emergenciaTelefono: z.string().optional(),
  emergenciaRelacion: z.string().optional(),
});

type Formulario = z.infer<typeof esquema>;

const aNumero = (valor?: string) =>
  valor?.trim() ? Number(valor.replace(',', '.')) : undefined;

export default function CuentaScreen() {
  const theme = useTheme();
  const toast = useToast();
  const familia = useDataStore((estado) => estado.familia);
  const actualizar = useDataStore((estado) => estado.actualizarFamilia);

  const [miembros, setMiembros] = useState<MiembroFamilia[]>(familia.miembros);
  const [franjas, setFranjas] = useState<FranjaDisponibilidad[]>(familia.preferencias.franjas);
  const [verificaciones, setVerificaciones] = useState<TipoVerificacion[]>(
    familia.preferencias.verificacionesMinimas,
  );

  // Formulario de "añadir miembro" (se gestiona fuera de React Hook Form).
  const [nuevoMiembro, setNuevoMiembro] = useState({ nombre: '', relacion: '', telefono: '' });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: familia.nombre,
      email: familia.email,
      telefono: familia.telefono ?? '',
      ciudad: familia.ubicacion?.ciudad ?? '',
      zona: familia.ubicacion?.zona ?? '',
      distanciaMaxKm: familia.preferencias.distanciaMaxKm?.toString() ?? '',
      tarifaMaxHora: familia.preferencias.tarifaMaxHora?.toString() ?? '',
      emergenciaNombre: familia.contactoEmergencia?.nombre ?? '',
      emergenciaTelefono: familia.contactoEmergencia?.telefono ?? '',
      emergenciaRelacion: familia.contactoEmergencia?.relacion ?? '',
    },
    mode: 'onBlur',
  });
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() no es memoizable por diseño
  const valores = watch();

  const alternar = <T,>(lista: T[], valor: T): T[] =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

  const quitarMiembro = (miembro: MiembroFamilia) => {
    confirmar(
      {
        titulo: 'Quitar de la familia',
        mensaje: `¿Quitar a ${miembro.nombre} de los miembros de la cuenta?`,
        accion: 'Quitar',
        destructiva: true,
      },
      () => setMiembros((lista) => lista.filter((m) => m.id !== miembro.id)),
    );
  };

  const anadirMiembro = () => {
    const nombre = nuevoMiembro.nombre.trim();
    const relacion = nuevoMiembro.relacion.trim();
    if (nombre.length < 2 || relacion.length < 2) {
      toast.error('Indica el nombre y el parentesco del familiar.');
      return;
    }
    setMiembros((lista) => [
      ...lista,
      {
        id: `fam_${Date.now()}`,
        nombre,
        relacion,
        telefono: nuevoMiembro.telefono.trim() || undefined,
      },
    ]);
    setNuevoMiembro({ nombre: '', relacion: '', telefono: '' });
  };

  const guardar = handleSubmit((datos) => {
    const esEmergencia =
      Boolean(datos.emergenciaNombre?.trim()) && Boolean(datos.emergenciaTelefono?.trim());
    actualizar({
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono?.trim() || undefined,
      ubicacion: { ciudad: datos.ciudad, zona: datos.zona },
      miembros,
      contactoEmergencia: esEmergencia
        ? {
            nombre: datos.emergenciaNombre!.trim(),
            telefono: datos.emergenciaTelefono!.trim(),
            relacion: datos.emergenciaRelacion?.trim() || 'Familiar',
          }
        : undefined,
      preferencias: {
        distanciaMaxKm: aNumero(datos.distanciaMaxKm),
        tarifaMaxHora: aNumero(datos.tarifaMaxHora),
        franjas,
        verificacionesMinimas: verificaciones,
      },
    });
    toast.exito('Datos de la familia guardados en este dispositivo.');
    router.back();
  });

  return (
    <Screen>
      <ScreenHeader
        variante="cerrar"
        titulo="Datos de la familia"
        subtitulo="Cuenta, miembros y criterios de búsqueda del profesional."
      />

      <Card>
        <SectionHeader titulo="Cuenta" />
        <CampoTexto
          label="Nombre de la cuenta"
          valor={valores.nombre}
          onChangeTexto={(t) => setValue('nombre', t)}
          error={errors.nombre?.message}
        />
        <CampoTexto
          label="Correo electrónico"
          valor={valores.email}
          onChangeTexto={(t) => setValue('email', t)}

          error={errors.email?.message}
          teclado="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <CampoTexto
          label="Teléfono"
          valor={valores.telefono ?? ''}
          onChangeTexto={(t) => setValue('telefono', t)}

          error={errors.telefono?.message}
          teclado="phone-pad"
          placeholder="600 123 456"
        />
        <View style={styles.fila}>
          <View style={styles.flex}>
            <CampoTexto
              label="Ciudad"
              valor={valores.ciudad}
              onChangeTexto={(t) => setValue('ciudad', t)}
    
              error={errors.ciudad?.message}
            />
          </View>
          <View style={styles.flex}>
            <CampoTexto
              label="Zona / barrio"
              valor={valores.zona}
              onChangeTexto={(t) => setValue('zona', t)}
    
              error={errors.zona?.message}
            />
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader titulo={`Miembros de la familia · ${miembros.length}`} />
        {miembros.map((miembro) => (
          <View key={miembro.id} style={styles.miembro}>
            <Avatar nombre={miembro.nombre} />
            <View style={styles.flex}>
              <ThemedText type="smallBold">{miembro.nombre}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {miembro.relacion}
                {miembro.telefono ? ` · ${miembro.telefono}` : ''}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => quitarMiembro(miembro)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Quitar a ${miembro.nombre} de la familia`}
              style={styles.quitar}>
              <Text style={[styles.quitarTexto, { color: theme.danger }]}>✕</Text>
            </Pressable>
          </View>
        ))}

        <View style={styles.fila}>
          <View style={styles.flex}>
            <CampoTexto
              label="Nombre"
              valor={nuevoMiembro.nombre}
              onChangeTexto={(t) => setNuevoMiembro((m) => ({ ...m, nombre: t }))}
              placeholder="Elena"
            />
          </View>
          <View style={styles.flex}>
            <CampoTexto
              label="Parentesco"
              valor={nuevoMiembro.relacion}
              onChangeTexto={(t) => setNuevoMiembro((m) => ({ ...m, relacion: t }))}
              placeholder="Hija"
            />
          </View>
        </View>
        <CampoTexto
          label="Teléfono (opcional)"
          valor={nuevoMiembro.telefono}
          onChangeTexto={(t) => setNuevoMiembro((m) => ({ ...m, telefono: t }))}
          teclado="phone-pad"
        />
        <Button titulo="Añadir miembro" variante="secondary" tamano="sm" onPress={anadirMiembro} />
      </Card>

      <Card>
        <SectionHeader titulo="Contacto de emergencia" />
        <CampoTexto
          label="Quién acude en caso de urgencia"
          valor={valores.emergenciaNombre ?? ''}
          onChangeTexto={(t) => setValue('emergenciaNombre', t)}

          placeholder="Luis Martínez"
        />
        <View style={styles.fila}>
          <View style={styles.flex}>
            <CampoTexto
              label="Teléfono"
              valor={valores.emergenciaTelefono ?? ''}
              onChangeTexto={(t) => setValue('emergenciaTelefono', t)}
    
              teclado="phone-pad"
              placeholder="611 234 567"
            />
          </View>
          <View style={styles.flex}>
            <CampoTexto
              label="Parentesco"
              valor={valores.emergenciaRelacion ?? ''}
              onChangeTexto={(t) => setValue('emergenciaRelacion', t)}
    
              placeholder="Hijo"
            />
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader titulo="Cómo buscas al profesional" />
        <ThemedText type="small" themeColor="textSecondary">
          Con estos criterios comparamos las candidaturas en Selección.
        </ThemedText>
        <View style={styles.fila}>
          <View style={styles.flex}>
            <CampoTexto
              label="Distancia máx. (km)"
              valor={valores.distanciaMaxKm ?? ''}
              onChangeTexto={(t) => setValue('distanciaMaxKm', t)}
    
              error={errors.distanciaMaxKm?.message}
              teclado="numeric"
              placeholder="10"
            />
          </View>
          <View style={styles.flex}>
            <CampoTexto
              label="Tarifa máx. (€/h)"
              valor={valores.tarifaMaxHora ?? ''}
              onChangeTexto={(t) => setValue('tarifaMaxHora', t)}
    
              error={errors.tarifaMaxHora?.message}
              teclado="numeric"
              placeholder="15"
            />
          </View>
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          Franjas del día
        </ThemedText>
        <View style={styles.chips}>
          {FRANJAS.map((franja) => (
            <Chip
              key={franja.valor}
              texto={franja.texto}
              seleccionado={franjas.includes(franja.valor)}
              onPress={() => setFranjas((lista) => alternar(lista, franja.valor))}
            />
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary">
          Verificaciones mínimas
        </ThemedText>
        <View style={styles.chips}>
          {VERIFICACIONES.map((verificacion) => (
            <Chip
              key={verificacion.valor}
              texto={verificacion.texto}
              seleccionado={verificaciones.includes(verificacion.valor)}
              onPress={() => setVerificaciones((lista) => alternar(lista, verificacion.valor))}
            />
          ))}
        </View>
      </Card>

      <Button titulo="Guardar datos" onPress={guardar} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 2,
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  miembro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  quitar: {
    padding: Spacing.one,
  },
  quitarTexto: {
    fontFamily: fam(700),
    fontSize: 16,
    fontWeight: '700',
  },
});
