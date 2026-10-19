/**
 * Datos de demostración del Pilar 1 (La familia).
 * Reproducen la demo interactiva de la landing (sección "familias",
 * paso 1): Carmen, 82 años · Movilidad reducida · Diabetes; coincidencias
 * Laura R. (94%), Marta S. (91%) y Carlos D. (88%); y la rutina de 5 tareas
 * con 2 completadas. Se sustituyen por la API real configurando
 * EXPO_PUBLIC_API_URL.
 */

import type {
  CandidatoComparado,
  ConfigCuidador,
  Familia,
  Incidencia,
  Informe,
  PerfilCuidado,
  PermisosCuidador,
  RegistroHistorial,
  RegistroTarea,
  ServicioComplementario,
  Sesion,
  Tarea,
} from '@/types';
import { fechaHoy } from '@/utils/format';

export const familiaDemo: Familia = {
  id: 'fam_1',
  nombre: 'Ana Martínez',
  email: 'ana.martinez@email.com',
  telefono: '600 123 456',
  plan: 'gratuito',
  perfilesMaximos: 1,
  ubicacion: { ciudad: 'Madrid', zona: 'Chamberí' },
  miembros: [
    {
      id: 'fam_m1',
      nombre: 'Luis Martínez',
      relacion: 'Hijo',
      telefono: '611 234 567',
      email: 'luis.martinez@email.com',
    },
    {
      id: 'fam_m2',
      nombre: 'Elena Martínez',
      relacion: 'Hija',
      telefono: '622 345 678',
      email: 'elena.martinez@email.com',
    },
    {
      id: 'fam_m3',
      nombre: 'Marta Fernández',
      relacion: 'Nuera',
      telefono: '633 456 789',
    },
  ],
  contactoEmergencia: {
    nombre: 'Luis Martínez',
    telefono: '611 234 567',
    relacion: 'Hijo',
  },
  preferencias: {
    distanciaMaxKm: 10,
    tarifaMaxHora: 15,
    franjas: ['manana', 'tarde'],
    verificacionesMinimas: ['identidad', 'penales'],
  },
};

export const perfilDemo: PerfilCuidado = {
  id: 'per_1',
  familiaId: 'fam_1',
  // 1944-03-18 → 82 años, como en la demo de la landing.
  persona: { id: 'per_1', nombre: 'Carmen', fechaNacimiento: '1944-03-18', relacion: 'Madre', genero: 'mujer' },
  tipoAtencion: 'domiciliaria',
  estado: 'con_cuidador',
  ubicacion: { ciudad: 'Madrid', zona: 'Chamberí' },
  horario: {
    dias: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
    desde: '09:00',
    hasta: '13:00',
  },
  movilidad: 'Bastón o andador',
  habitos: [
    'Medicación 09:00',
    'Ejercicios de movilidad 10:30',
    'Siesta 15:30',
    'Paseo de 25 min por la tarde',
    'Higiene y descanso 21:00',
    'Comida triturada',
  ],
  competenciasRequeridas: ['Movilidad reducida', 'Diabetes', 'Memoria', 'Primeros auxilios'],
  datosSensibles: {
    autonomia: 'Necesita ayuda en algunas tareas',
    cognicion: 'Problemas de memoria leves',
    vision: 'Usa gafas',
    oido: 'Correcto',
    medicacion: 'Ayuda de un familiar',
    convivencia: 'Vive solo/a',
    vivienda: 'Piso sin ascensor',
    patologias: 'Diabetes tipo 2, hipertensión',
    alergias: 'Penicilina',
    descripcion: 'Dieta triturada por disfagia.',
    visibleEnOferta: false,
  },
  notas: 'Le gusta escuchar la radio por las mañanas.',
  actualizadoEn: new Date().toISOString(),
};

export const serviciosDemo: ServicioComplementario[] = [
  {
    id: 'srv_1',
    categoria: 'gestoria',
    nombre: 'Gestoría laboral',
    descripcion: 'Contratos, nóminas y obligaciones del empleo en el hogar',
    condiciones: 'Responsabilidades y forma de contratación definidas en el encargo.',
    contratado: true,
  },
  {
    id: 'srv_2',
    categoria: 'especialista',
    nombre: 'Fisioterapia',
    descripcion: 'Movilidad y rehabilitación',
    contratado: false,
  },
  {
    id: 'srv_3',
    categoria: 'especialista',
    nombre: 'Logopedia',
    descripcion: 'Deglución y comunicación',
    condiciones: 'Sesiones semanales a domicilio.',
    contratado: true,
  },
  {
    id: 'srv_4',
    categoria: 'sanitario',
    nombre: 'Enfermería domiciliaria',
    descripcion: 'Curas, medicación inyectable y controles periódicos',
    contratado: false,
  },
  {
    id: 'srv_5',
    categoria: 'sanitario',
    nombre: 'Profesional sanitario',
    descripcion: 'Cuando corresponda',
    contratado: false,
  },
  {
    id: 'srv_6',
    categoria: 'formacion',
    nombre: 'Formación',
    descripcion: 'Competencias del cuidador',
    contratado: false,
  },
  {
    id: 'srv_7',
    categoria: 'formacion',
    nombre: 'Curso de demencias',
    descripcion: 'Formación básica para la familia y el cuidador',
    contratado: false,
  },
];

export const candidatosDemo: CandidatoComparado[] = [
  {
    candidatura: {
      id: 'cand_1',
      perfilId: 'per_1',
      cuidadorId: 'cui_1',
      estado: 'seleccionada',
      motivosAfinidad: [
        'Misma zona (Chamberí)',
        'Horario de mañanas compatible',
        '6 años de experiencia',
        'Documentación verificada',
      ],
      mensaje: 'Tengo experiencia en movilidad reducida y diabetes.',
      creadaEn: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    cuidador: {
      id: 'cui_1',
      nombre: 'Laura R.',
      anosExperiencia: 6,
      distanciaKm: 3.2,
      tarifaHora: 12,
      valoracion: 4.9,
      valoraciones: 27,
      disponibilidad: 'Lun–Vie · mañanas',
      competencias: ['Movilidad reducida', 'Diabetes', 'Memoria', 'Medicación'],
      biografia:
        'Seis años acompañando a personas mayores a domicilio. Titulación en atención ' +
        'geriátrica y experiencia en movilidad reducida y pautas de medicación.',
      verificaciones: [
        { tipo: 'identidad', estado: 'verificada' },
        { tipo: 'formacion', estado: 'verificada' },
        { tipo: 'penales', estado: 'verificada' },
        { tipo: 'referencias', estado: 'verificada', detalle: '3 referencias' },
      ],
    },
  },
  {
    candidatura: {
      id: 'cand_2',
      perfilId: 'per_1',
      cuidadorId: 'cui_2',
      estado: 'preseleccionada',
      motivosAfinidad: ['Tardes libres', 'Experiencia en geriatría', 'Auxiliar de enfermería'],
      creadaEn: new Date(Date.now() - 86400000).toISOString(),
    },
    cuidador: {
      id: 'cui_2',
      nombre: 'Marta S.',
      anosExperiencia: 4,
      distanciaKm: 5.1,
      tarifaHora: 11,
      valoracion: 4.8,
      valoraciones: 19,
      disponibilidad: 'Lun–Sáb · tardes',
      competencias: ['Memoria', 'Diabetes'],
      biografia: 'Auxiliar de enfermería con 4 años de experiencia en hospital y domicilio.',
      verificaciones: [
        { tipo: 'identidad', estado: 'verificada' },
        { tipo: 'formacion', estado: 'verificada' },
        { tipo: 'penales', estado: 'pendiente' },
        { tipo: 'referencias', estado: 'verificada', detalle: '2 referencias' },
      ],
    },
  },
  {
    candidatura: {
      id: 'cand_3',
      perfilId: 'per_1',
      cuidadorId: 'cui_3',
      estado: 'nueva',
      motivosAfinidad: [
        'A 2,4 km (el más cercano)',
        'Disponibilidad de mediodía y noche',
        'Atención domiciliaria · 3 años',
      ],
      mensaje: 'Disponible para comidas y turnos de noche.',
      creadaEn: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    cuidador: {
      id: 'cui_3',
      nombre: 'Carlos D.',
      anosExperiencia: 3,
      distanciaKm: 2.4,
      tarifaHora: 10,
      valoracion: 4.7,
      valoraciones: 12,
      disponibilidad: 'Lun–Dom · mediodía y noche',
      competencias: ['Primeros auxilios'],
      biografia: 'Atención domiciliaria a personas mayores, preparado en higiene y alimentación.',
      verificaciones: [
        { tipo: 'identidad', estado: 'verificada' },
        { tipo: 'formacion', estado: 'pendiente' },
        { tipo: 'penales', estado: 'verificada' },
        { tipo: 'referencias', estado: 'verificada', detalle: '1 referencia' },
      ],
    },
  },
];

/**
 * Candidaturas que llegan en la demo cuando la familia publica su oferta:
 * dos cuidadores del mercado local, con identificadores nuevos y estado
 * 'nueva' (sin ver ni preseleccionar). El perfil pasa a "en selección".
 */
export function candidaturasDeEjemplo(perfilId: string): CandidatoComparado[] {
  const creadaEn = new Date().toISOString();
  return candidatosDemo.slice(0, 2).map((par, indice) => ({
    candidatura: {
      ...par.candidatura,
      id: `cand_${Date.now()}_${indice}`,
      perfilId,
      estado: 'nueva',
      creadaEn,
    },
    // El mismo cuidador de la demo puede presentar candidatura a varios perfiles.
    cuidador: par.cuidador,
  }));
}

export const tareasDemo: Tarea[] = [
  { id: 'tar_1', perfilId: 'per_1', nombre: 'Medicación', momento: 'manana', hora: '09:00', responsableId: 'cui_1', personalizada: false, repeticion: 'diaria' },
  { id: 'tar_2', perfilId: 'per_1', nombre: 'Ejercicios de movilidad', momento: 'manana', hora: '10:30', responsableId: 'cui_1', personalizada: false, repeticion: 'diaria' },
  { id: 'tar_3', perfilId: 'per_1', nombre: 'Comida', momento: 'mediodia', hora: '13:00', responsableId: 'cui_3', personalizada: false, repeticion: 'diaria' },
  { id: 'tar_4', perfilId: 'per_1', nombre: 'Paseo', momento: 'tarde', hora: '17:00', responsableId: 'cui_1', personalizada: false, repeticion: 'diaria' },
  { id: 'tar_5', perfilId: 'per_1', nombre: 'Higiene y descanso', momento: 'noche', hora: '21:00', responsableId: 'cui_3', personalizada: false, repeticion: 'diaria' },
];

/** Permisos por defecto al abrir /cuidador sin configuración guardada. */
export const permisosCuidadorPorDefecto: PermisosCuidador = {
  // Coherente con la oferta: los datos clínicos se publican ocultos.
  verDatosClinicos: false,
  editarRutina: true,
  verInformes: true,
  registrarIncidencias: true,
  avisarCompletadas: true,
};

/** Configuración inicial del cuidador seleccionado de Carmen (Laura R.). */
export const configCuidadorDemo: Record<string, ConfigCuidador> = {
  per_1: {
    perfilId: 'per_1',
    horarioAcordado: 'Lunes a viernes · 09:00–13:00',
    tarifaAcordada: 14,
    nota: 'La medicación queda preparada en la mesilla. Avisa si Carmen no termina la comida.',
    permisos: permisosCuidadorPorDefecto,
  },
};

const hoy = fechaHoy();

export const registrosHoyDemo: RegistroTarea[] = [
  { id: 'reg_1', tareaId: 'tar_1', fecha: hoy, estado: 'realizada', responsableId: 'cui_1' },
  { id: 'reg_2', tareaId: 'tar_2', fecha: hoy, estado: 'realizada', responsableId: 'cui_1' },
  { id: 'reg_3', tareaId: 'tar_3', fecha: hoy, estado: 'pendiente', responsableId: 'cui_3' },
  { id: 'reg_4', tareaId: 'tar_4', fecha: hoy, estado: 'pendiente', responsableId: 'cui_1' },
  { id: 'reg_5', tareaId: 'tar_5', fecha: hoy, estado: 'pendiente', responsableId: 'cui_3' },
];

export const incidenciasDemo: Incidencia[] = [
  {
    id: 'inc_1',
    perfilId: 'per_1',
    fecha: new Date().toISOString(),
    titulo: 'Negativa a comer',
    descripcion: 'Carmen no quiso comer a las 13:00. Familia avisada.',
    responsableId: 'cui_1',
    estado: 'abierta',
  },
  {
    id: 'inc_2',
    perfilId: 'per_1',
    fecha: new Date(Date.now() - 86400000).toISOString(),
    titulo: 'Caída leve sin consecuencias',
    descripcion: 'Resuelta por Laura R. · revisión con fisioterapia',
    responsableId: 'cui_1',
    estado: 'resuelta',
    resolucion: 'Sin lesiones. Se refuerza la supervisión en los paseos.',
  },
];

export const informeDemo: Informe = {
  perfilId: 'per_1',
  periodo: {
    desde: new Date(Date.now() - 86400000 * 6).toISOString(),
    hasta: new Date().toISOString(),
  },
  tareasRealizadas: 33,
  tareasTotales: 35,
  incidencias: incidenciasDemo,
  valoracion: 4.8,
};

export const historialDemo: RegistroHistorial[] = [
  {
    id: 'his_1',
    perfilId: 'per_1',
    categoria: 'alimentacion',
    fecha: new Date().toISOString(),
    resumen: 'Come el 80% de la ración',
    responsableId: 'cui_1',
  },
  {
    id: 'his_2',
    perfilId: 'per_1',
    categoria: 'movilidad',
    fecha: new Date().toISOString(),
    resumen: 'Paseo de 25 min',
    valor: 25,
    unidad: 'min',
    responsableId: 'cui_1',
  },
  {
    id: 'his_3',
    perfilId: 'per_1',
    categoria: 'mediciones',
    fecha: new Date().toISOString(),
    resumen: 'Glucemia capilar',
    valor: 110,
    unidad: 'mg/dl',
    responsableId: 'cui_1',
  },
  {
    id: 'his_4',
    perfilId: 'per_1',
    categoria: 'habitos',
    fecha: new Date().toISOString(),
    resumen: 'Escucha la radio durante el desayuno',
    responsableId: 'cui_1',
  },
  {
    id: 'his_5',
    perfilId: 'per_1',
    categoria: 'alimentacion',
    fecha: new Date(Date.now() - 86400000).toISOString(),
    resumen: 'Desayuno completado',
    responsableId: 'cui_3',
  },
  {
    id: 'his_6',
    perfilId: 'per_1',
    categoria: 'mediciones',
    fecha: new Date(Date.now() - 86400000).toISOString(),
    resumen: 'Peso',
    valor: 64,
    unidad: 'kg',
  },
];

export const suenoSemanaDemo = [62, 70, 55, 78, 66, 82, 74];

/** Sesión de demostración: permite entrar sin backend. */
export const sesionDemo: Sesion = {
  token: 'demo-token',
  familia: familiaDemo,
  expiraEn: new Date(Date.now() + 86400000 * 30).toISOString(),
};
