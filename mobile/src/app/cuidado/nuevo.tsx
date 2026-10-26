import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { CampoTexto } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useCrearPerfil } from '@/hooks/use-perfiles';
import { useSesion } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useDataStore } from '@/store/data-store';
import { fam, FontSize, Spacing } from '@/constants/theme';
import type { DiaSemana, GeneroPersona, TipoAtencion } from '@/types';

/**
 * Inscripción de la persona atendida (fase 2 del Pilar 1 · "Creación del
 * perfil de cuidado" del manual operativo). Registro profesional estructurado:
 * identidad, disponibilidad, movilidad/autonomía, salud y convivencia,
 * alimentación/descanso, competencias y notas. Los datos clínicos van a
 * `datosSensibles` (nunca a la oferta pública).
 */

const TIPOS_ATENCION: { valor: TipoAtencion; texto: string }[] = [
  { valor: 'domiciliaria', texto: 'Domiciliaria' },
  { valor: 'acompanamiento', texto: 'Acompañamiento' },
  { valor: 'temporal', texto: 'Temporal' },
  { valor: 'residencia', texto: 'Residencia' },
];

const DIAS: { valor: DiaSemana; texto: string }[] = [
  { valor: 'lunes', texto: 'Lunes' },
  { valor: 'martes', texto: 'Martes' },
  { valor: 'miercoles', texto: 'Miércoles' },
  { valor: 'jueves', texto: 'Jueves' },
  { valor: 'viernes', texto: 'Viernes' },
  { valor: 'sabado', texto: 'Sábado' },
  { valor: 'domingo', texto: 'Domingo' },
];

const GENEROS: { valor: GeneroPersona; texto: string }[] = [
  { valor: 'mujer', texto: 'Mujer' },
  { valor: 'hombre', texto: 'Hombre' },
  { valor: 'otro', texto: 'Otro' },
  { valor: 'no_especificar', texto: 'No especificar' },
];

const OPCIONES_MOVILIDAD = [
  'Autónomo/a',
  'Bastón o andador',
  'Muletas',
  'Silla de ruedas',
  'Necesita ayuda de otra persona',
];

const OPCIONES_AUTONOMIA = [
  'Totalmente autónomo/a',
  'Necesita ayuda en algunas tareas',
  'Dependiente en la mayoría de tareas',
  'Con cuidados en cama',
];

const OPCIONES_COGNICION = [
  'Sin dificultades cognitivas',
  'Problemas de memoria leves',
  'Demencia o Alzheimer',
  'Otras alteraciones',
];

const OPCIONES_VISION = ['Correcta', 'Usa gafas', 'Visión reducida'];

const OPCIONES_OIDO = ['Correcto', 'Usa audífono', 'Audición reducida'];

const OPCIONES_MEDICACION = [
  'Autónomo/a con su medicación',
  'Necesita recordatorio',
  'Ayuda de un familiar',
  'Apoyo profesional',
];

const OPCIONES_CONVIVENCIA = ['Vive solo/a', 'Convive con la familia', 'Convive con otra persona'];

const OPCIONES_VIVIENDA = ['Piso sin ascensor', 'Piso con ascensor', 'Casa', 'Residencia'];

const OPCIONES_ALIMENTACION = [
  'Dieta normal',
  'Comida triturada',
  'Diabética',
  'Baja en sal',
  'Sin gluten',
  'Vegetariana',
];

const OPCIONES_SUENO = ['Duerme bien', 'Insomnio', 'Se despierta de noche', 'Siesta habitual'];

const OPCIONES_COMPETENCIAS = [
  'Movilidad reducida',
  'Memoria',
  'Administración de medicación',
  'Higiene personal',
  'Primeros auxilios',
  'Cocina y alimentación',
  'Fisioterapia',
  'Diabetes',
];

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA_RE = /^\d{2}\/\d{2}\/\d{4}$/;

/** Valida que dd/mm/aaaa sea un día real y un rango plausible (1900–hoy). */
function esFechaValida(texto: string): boolean {
  if (!FECHA_RE.test(texto)) return false;
  const [dia, mes, anio] = texto.split('/');
  const d = Number(dia);
  const m = Number(mes);
  const a = Number(anio);
  const fecha = new Date(a, m - 1, d);
  if (fecha.getFullYear() !== a || fecha.getMonth() !== m - 1 || fecha.getDate() !== d) return false;
  return a >= 1900 && a <= new Date().getFullYear();
}

/** "18/03/1944" → "1944-03-18" (ISODate). Solo se llama con fecha válida. */
function aISO(texto: string): string {
  const [dia, mes, anio] = texto.trim().split('/');
  return `${anio}-${mes}-${dia}`;
}

function partirComas(texto?: string): string[] {
  return (texto ?? '')
    .split(',')
    .map((elemento) => elemento.trim())
    .filter(Boolean);
}

const esquema = z
  .object({
    nombrePersona: z.string().min(2, { message: 'Indica el nombre de la persona atendida.' }),
    fechaNacimiento: z
      .string()
      .min(1, { message: 'Indica la fecha de nacimiento (dd/mm/aaaa).' })
      .refine((valor) => FECHA_RE.test(valor.trim()), {
        message: 'Formato dd/mm/aaaa (ej. 18/03/1944).',
      })
      .refine((valor) => esFechaValida(valor.trim()), {
        message: 'Fecha no válida: revisa día, mes y año.',
      }),
    relacion: z.string().optional(),
    genero: z.enum(['mujer', 'hombre', 'otro', 'no_especificar']),
    tipoAtencion: z.enum(['domiciliaria', 'acompanamiento', 'temporal', 'residencia']),
    ciudad: z.string().min(2, { message: 'Indica la ciudad.' }),
    zona: z.string().min(2, { message: 'Indica la zona o barrio.' }),
    dias: z
      .array(z.enum(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']))
      .min(1, { message: 'Selecciona al menos un día.' }),
    desde: z.string().regex(HORA_RE, { message: 'Hora en formato HH:MM (ej. 09:00).' }),
    hasta: z.string().regex(HORA_RE, { message: 'Hora en formato HH:MM (ej. 13:00).' }),
    movilidad: z.string().optional(),
    autonomia: z.string().optional(),
    cognicion: z.string().optional(),
    vision: z.string().optional(),
    oido: z.string().optional(),
    medicacion: z.string().optional(),
    convivencia: z.string().optional(),
    vivienda: z.string().optional(),
    patologias: z.string().optional(),
    alergias: z.string().optional(),
    alimentacion: z.array(z.string()),
    sueno: z.array(z.string()),
    habitosTexto: z.string().optional(),
    competencias: z.array(z.string()),
    competenciasTexto: z.string().optional(),
    notas: z.string().optional(),
  })
  .superRefine((valor, ctx) => {
    if (valor.desde && valor.hasta && valor.hasta <= valor.desde) {
      ctx.addIssue({
        code: 'custom',
        path: ['hasta'],
        message: 'La hora de fin debe ser posterior a la de inicio.',
      });
    }
  });

type Formulario = z.infer<typeof esquema>;

export default function NuevoPerfilScreen() {
  const theme = useTheme();
  const toast = useToast();
  const sesion = useSesion();
  const crear = useCrearPerfil();
  const establecerPerfilActivo = useDataStore((estado) => estado.establecerPerfilActivo);

  const {
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombrePersona: '',
      fechaNacimiento: '',
      relacion: '',
      genero: 'no_especificar',
      tipoAtencion: 'domiciliaria',
      ciudad: '',
      zona: '',
      dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      desde: '09:00',
      hasta: '13:00',
      movilidad: '',
      autonomia: '',
      cognicion: '',
      vision: '',
      oido: '',
      medicacion: '',
      convivencia: '',
      vivienda: '',
      patologias: '',
      alergias: '',
      alimentacion: [],
      sueno: [],
      habitosTexto: '',
      competencias: [],
      competenciasTexto: '',
      notas: '',
    },
    mode: 'onBlur',
  });
  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() no es memoizable por diseño
  const valores = watch();

  /** Campos de opción simple (un solo valor) del formulario. */
  type CampoOpcion =
    | 'movilidad'
    | 'autonomia'
    | 'cognicion'
    | 'vision'
    | 'oido'
    | 'medicacion'
    | 'convivencia'
    | 'vivienda';

  /** Selección simple (chips tipo radio) de un campo de texto del formulario. */
  const seleccionarTexto = (campo: CampoOpcion, valor: string) => {
    setValue(campo, valor, { shouldValidate: true });
  };

  /** Alternar un elemento dentro de un campo de lista (chips multiselección). */
  const alternarLista = (campo: 'alimentacion' | 'sueno' | 'competencias', valor: string) => {
    const actual = valores[campo];
    setValue(
      campo,
      actual.includes(valor) ? actual.filter((elemento) => elemento !== valor) : [...actual, valor],
      { shouldValidate: true },
    );
  };

  const alternarDia = (dia: DiaSemana) => {
    const actual = valores.dias;
    setValue(
      'dias',
      actual.includes(dia) ? actual.filter((elemento) => elemento !== dia) : [...actual, dia],
      { shouldValidate: true },
    );
  };

  const guardar = handleSubmit(async (datos) => {
    if (!sesion) return;

    // Hábitos = chips (alimentación + descanso) + texto libre, sin duplicados.
    const habitos = Array.from(
      new Set([...datos.alimentacion, ...datos.sueno, ...partirComas(datos.habitosTexto)]),
    );
    const competencias = Array.from(
      new Set([...datos.competencias, ...partirComas(datos.competenciasTexto)]),
    );

    // El borrador se mantiene en el formulario si falla el guardado.
    try {
      const creado = await crear.mutateAsync({
        familiaId: sesion.familia.id,
        persona: {
          nombre: datos.nombrePersona,
          fechaNacimiento: aISO(datos.fechaNacimiento),
          relacion: datos.relacion || undefined,
          genero: datos.genero,
        },
        tipoAtencion: datos.tipoAtencion,
        estado: 'borrador',
        ubicacion: { ciudad: datos.ciudad, zona: datos.zona },
        horario: { dias: datos.dias, desde: datos.desde, hasta: datos.hasta },
        movilidad: datos.movilidad || undefined,
        habitos,
        competenciasRequeridas: competencias,
        datosSensibles: {
          autonomia: datos.autonomia || undefined,
          cognicion: datos.cognicion || undefined,
          vision: datos.vision || undefined,
          oido: datos.oido || undefined,
          medicacion: datos.medicacion || undefined,
          convivencia: datos.convivencia || undefined,
          vivienda: datos.vivienda || undefined,
          patologias: datos.patologias?.trim() || undefined,
          alergias: datos.alergias?.trim() || undefined,
          visibleEnOferta: false,
        },
        notas: datos.notas?.trim() || undefined,
      });

      // El perfil recién creado pasa a ser el activo: el resto de la app
      // (rutina, informes, cuidador) debe operar sobre esta persona.
      establecerPerfilActivo(creado.id);
      toast.exito('Perfil de cuidado guardado como borrador.');
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (error) {
      // El motivo real (límite del plan, validación del servidor) se comunica
      // aquí; el banner global queda como respaldo.
      toast.errorDe(error, 'No hemos podido guardar el perfil. Inténtalo de nuevo.');
    }
  });

  return (
    <Screen>
      <ScreenHeader
        variante="cerrar"
        titulo="Inscripción de la persona"
        subtitulo="Registro estructurado de la persona atendida: identidad, disponibilidad, autonomía y cuidados. El perfil es el eje del que depende todo lo demás."
      />

      <Card>
        <SectionHeader titulo="Persona atendida" />
        <CampoTexto
          label="Nombre"
          valor={valores.nombrePersona}
          onChangeTexto={(t) => setValue('nombrePersona', t, { shouldValidate: true })}
          placeholder="Carmen"
          error={errors.nombrePersona?.message}
        />
        <CampoTexto
          label="Fecha de nacimiento"
          valor={valores.fechaNacimiento}
          // Se valida al salir del campo: mientras se escribe "18/0" no debe ponerse en rojo.
          onChangeTexto={(t) => setValue('fechaNacimiento', t)}
          onBlur={() =>
            // getValues lee el estado en vivo: valores del watch() podría ir rezagado.
            setValue('fechaNacimiento', getValues('fechaNacimiento'), { shouldValidate: true })
          }
          placeholder="18/03/1944"
          teclado="numeric"
          error={errors.fechaNacimiento?.message}
        />
        <CampoTexto
          label="Relación contigo"
          valor={valores.relacion ?? ''}
          onChangeTexto={(t) => setValue('relacion', t)}
          placeholder="Madre"
        />
        <View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Género</Text>
          <View style={styles.chips}>
            {GENEROS.map((opcion) => (
              <Chip
                key={opcion.valor}
                texto={opcion.texto}
                seleccionado={valores.genero === opcion.valor}
                onPress={() => setValue('genero', opcion.valor, { shouldValidate: true })}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card>
        <SectionHeader titulo="Tipo de atención" />
        <View style={styles.chips}>
          {TIPOS_ATENCION.map((opcion) => (
            <Chip
              key={opcion.valor}
              texto={opcion.texto}
              seleccionado={valores.tipoAtencion === opcion.valor}
              onPress={() => setValue('tipoAtencion', opcion.valor, { shouldValidate: true })}
            />
          ))}
        </View>
      </Card>

      <Card>
        <SectionHeader titulo="Ubicación y disponibilidad" />
        <CampoTexto
          label="Ciudad"
          valor={valores.ciudad}
          onChangeTexto={(t) => setValue('ciudad', t, { shouldValidate: true })}
          placeholder="Madrid"
          error={errors.ciudad?.message}
        />
        <CampoTexto
          label="Zona o barrio"
          valor={valores.zona}
          onChangeTexto={(t) => setValue('zona', t, { shouldValidate: true })}
          placeholder="Chamberí"
          error={errors.zona?.message}
        />
        <View>
          <Text style={[styles.label, { color: errors.dias ? theme.danger : theme.textSecondary }]}>
            Días necesarios
          </Text>
          <View style={styles.chips}>
            {DIAS.map((dia) => (
              <Chip
                key={dia.valor}
                texto={dia.texto}
                seleccionado={valores.dias.includes(dia.valor)}
                onPress={() => alternarDia(dia.valor)}
              />
            ))}
          </View>
          {errors.dias ? (
            <Text
              style={[styles.error, { color: theme.danger }]}
              accessibilityLiveRegion="polite"
              accessibilityRole="alert">
              {errors.dias.message}
            </Text>
          ) : null}
        </View>
        <View style={styles.fila}>
          <CampoTexto
            label="Desde"
            valor={valores.desde}
            onChangeTexto={(t) => setValue('desde', t)}
            onBlur={() => setValue('desde', getValues('desde'), { shouldValidate: true })}
            placeholder="09:00"
            error={errors.desde?.message}
            estiloContenedor={styles.mitad}
          />
          <CampoTexto
            label="Hasta"
            valor={valores.hasta}
            onChangeTexto={(t) => setValue('hasta', t)}
            onBlur={() => setValue('hasta', getValues('hasta'), { shouldValidate: true })}
            placeholder="13:00"
            error={errors.hasta?.message}
            estiloContenedor={styles.mitad}
          />
        </View>
      </Card>

      <Card>
        <SectionHeader titulo="Movilidad, autonomía y convivencia" />
        <Text style={[styles.nota, { color: theme.textSecondary }]}>
          Marca lo que mejor describa el día a día. Estos datos son privados: nunca se publican en
          la oferta.
        </Text>
        <Selector
          titulo="Movilidad"
          opciones={OPCIONES_MOVILIDAD}
          valor={valores.movilidad}
          onSeleccionar={(opcion) => seleccionarTexto('movilidad', opcion)}
        />
        <Selector
          titulo="Autonomía en el día a día"
          opciones={OPCIONES_AUTONOMIA}
          valor={valores.autonomia}
          onSeleccionar={(opcion) => seleccionarTexto('autonomia', opcion)}
        />
        <Selector
          titulo="Convivencia"
          opciones={OPCIONES_CONVIVENCIA}
          valor={valores.convivencia}
          onSeleccionar={(opcion) => seleccionarTexto('convivencia', opcion)}
        />
        <Selector
          titulo="Vivienda"
          opciones={OPCIONES_VIVIENDA}
          valor={valores.vivienda}
          onSeleccionar={(opcion) => seleccionarTexto('vivienda', opcion)}
        />
      </Card>

      <Card>
        <SectionHeader titulo="Salud y cuidados" />
        <Text style={[styles.nota, { color: theme.textSecondary }]}>
          Información sensible: se guarda aparte y con controles de visibilidad. No diagnostica ni
          sustituye el criterio profesional.
        </Text>
        <Selector
          titulo="Estado cognitivo"
          opciones={OPCIONES_COGNICION}
          valor={valores.cognicion}
          onSeleccionar={(opcion) => seleccionarTexto('cognicion', opcion)}
        />
        <Selector
          titulo="Visión"
          opciones={OPCIONES_VISION}
          valor={valores.vision}
          onSeleccionar={(opcion) => seleccionarTexto('vision', opcion)}
        />
        <Selector
          titulo="Oído"
          opciones={OPCIONES_OIDO}
          valor={valores.oido}
          onSeleccionar={(opcion) => seleccionarTexto('oido', opcion)}
        />
        <Selector
          titulo="Apoyo con la medicación"
          opciones={OPCIONES_MEDICACION}
          valor={valores.medicacion}
          onSeleccionar={(opcion) => seleccionarTexto('medicacion', opcion)}
        />
        <CampoTexto
          label="Patologías relevantes"
          valor={valores.patologias ?? ''}
          onChangeTexto={(t) => setValue('patologias', t)}
          placeholder="Diabetes tipo 2, hipertensión…"
          multilinea
        />
        <CampoTexto
          label="Alergias"
          valor={valores.alergias ?? ''}
          onChangeTexto={(t) => setValue('alergias', t)}
          placeholder="Penicilina, frutos secos…"
        />
      </Card>

      <Card>
        <SectionHeader titulo="Alimentación, descanso y hábitos" />
        <SelectorMulti
          titulo="Alimentación"
          opciones={OPCIONES_ALIMENTACION}
          valores={valores.alimentacion}
          onAlternar={(opcion) => alternarLista('alimentacion', opcion)}
        />
        <SelectorMulti
          titulo="Descanso"
          opciones={OPCIONES_SUENO}
          valores={valores.sueno}
          onAlternar={(opcion) => alternarLista('sueno', opcion)}
        />
        <CampoTexto
          label="Otros hábitos y rutinas (separados por comas)"
          valor={valores.habitosTexto ?? ''}
          onChangeTexto={(t) => setValue('habitosTexto', t)}
          placeholder="Paseo diario, Le gusta la radio, Medicación 09:00"
          multilinea
        />
      </Card>

      <Card>
        <SectionHeader titulo="Competencias necesarias en el cuidador" />
        <SelectorMulti
          titulo="Experiencia o formación requerida"
          opciones={OPCIONES_COMPETENCIAS}
          valores={valores.competencias}
          onAlternar={(opcion) => alternarLista('competencias', opcion)}
        />
        <CampoTexto
          label="Otras competencias (separadas por comas)"
          valor={valores.competenciasTexto ?? ''}
          onChangeTexto={(t) => setValue('competenciasTexto', t)}
          placeholder="Habla inglés, Manejo de cama"
        />
      </Card>

      <Card>
        <SectionHeader titulo="Notas para la familia" />
        <CampoTexto
          label="Lo que conviene saber (solo visible para la familia)"
          valor={valores.notas ?? ''}
          onChangeTexto={(t) => setValue('notas', t)}
          placeholder="Le gusta escuchar la radio por las mañanas."
          multilinea
        />
        <Text style={[styles.nota, { color: theme.textSecondary }]}>
          Los datos sensibles se guardan aparte y nunca se muestran en la oferta pública.
        </Text>
      </Card>

      <Button titulo="Guardar perfil" onPress={guardar} cargando={isSubmitting || crear.isPending} fullWidth />
    </Screen>
  );
}

/** Bloque con subtítulo y chips de selección simple (un valor). */
function Selector({
  titulo,
  opciones,
  valor,
  onSeleccionar,
}: {
  titulo: string;
  opciones: string[];
  valor?: string;
  onSeleccionar: (opcion: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.grupo}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{titulo}</Text>
      <View style={styles.chips}>
        {opciones.map((opcion) => (
          <Chip
            key={opcion}
            texto={opcion}
            seleccionado={valor === opcion}
            onPress={() => onSeleccionar(opcion)}
          />
        ))}
      </View>
    </View>
  );
}

/** Bloque con subtítulo y chips de selección múltiple. */
function SelectorMulti({
  titulo,
  opciones,
  valores,
  onAlternar,
}: {
  titulo: string;
  opciones: string[];
  valores: string[];
  onAlternar: (opcion: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.grupo}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{titulo}</Text>
      <View style={styles.chips}>
        {opciones.map((opcion) => (
          <Chip
            key={opcion}
            texto={opcion}
            seleccionado={valores.includes(opcion)}
            onPress={() => onAlternar(opcion)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  fila: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mitad: {
    flex: 1,
  },
  grupo: {
    gap: Spacing.one,
  },
  label: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nota: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  error: {
    fontFamily: fam(400),
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
});
