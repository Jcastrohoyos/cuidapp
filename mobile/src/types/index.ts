/**
 * Modelo de dominio de Cuidapp — Pilar 1 · La familia.
 * Refleja los conceptos del manual operativo: cuenta familiar, perfil de cuidado
 * (eje operativo), cuidador, candidaturas, servicios complementarios, rutinas,
 * informes e historial de datos.
 */

export type ID = string;
/** Fecha/hora en formato ISO 8601. */
export type ISODate = string;

/* ---------- Cuenta familiar (paso 01) ---------- */

export type Plan = 'gratuito' | 'esencial' | 'familiar';

/** Persona de la familia que también puede organizar los cuidados. */
export interface MiembroFamilia {
  id: ID;
  nombre: string;
  relacion: string;
  telefono?: string;
  email?: string;
}

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  relacion: string;
}

/** Franjas del día en las que la familia necesita cobertura. */
export type FranjaDisponibilidad = 'manana' | 'tarde' | 'noche';

/** Criterios con los que la familia busca al profesional adecuado. */
export interface PreferenciasBusqueda {
  /** Radio máximo de distancia (km) desde la zona de la persona cuidada. */
  distanciaMaxKm?: number;
  /** Tarifa máxima por hora que la familia puede asumir. */
  tarifaMaxHora?: number;
  /** Franjas del día en las que necesita cobertura. */
  franjas: FranjaDisponibilidad[];
  /** Verificaciones mínimas exigidas al profesional. */
  verificacionesMinimas: TipoVerificacion[];
}

export interface Familia {
  id: ID;
  nombre: string;
  email: string;
  telefono?: string;
  plan: Plan;
  perfilesMaximos: number;
  /** Zona desde la que se organizan los cuidados. */
  ubicacion?: Ubicacion;
  /** Otros familiares con acceso a la organización del cuidado. */
  miembros: MiembroFamilia[];
  contactoEmergencia?: ContactoEmergencia;
  /** Preferencias de búsqueda del profesional adecuado. */
  preferencias: PreferenciasBusqueda;
}

/* ---------- Perfil de cuidado (paso 02) ---------- */

export type TipoAtencion = 'domiciliaria' | 'acompanamiento' | 'residencia' | 'temporal';

export type EstadoPerfil = 'borrador' | 'publicado' | 'en_seleccion' | 'con_cuidador';

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

/** Opcional y solo para la ficha interna: ayuda a compatibilizar preferencias
 *  de búsqueda; nunca se publica por sí solo. */
export type GeneroPersona = 'mujer' | 'hombre' | 'otro' | 'no_especificar';

export interface PersonaAtendida {
  id: ID;
  nombre: string;
  fechaNacimiento?: ISODate;
  fotoUrl?: string;
  relacion?: string;
  genero?: GeneroPersona;
}

export interface Ubicacion {
  ciudad: string;
  zona: string;
}

export interface Horario {
  dias: DiaSemana[];
  desde: string;
  hasta: string;
}

export interface PerfilCuidado {
  id: ID;
  familiaId: ID;
  persona: PersonaAtendida;
  tipoAtencion: TipoAtencion;
  estado: EstadoPerfil;
  ubicacion: Ubicacion;
  horario: Horario;
  movilidad?: string;
  habitos: string[];
  competenciasRequeridas: string[];
  /** Los datos sensibles nunca se publican en la oferta pública. */
  datosSensibles: DatosSensibles;
  notas?: string;
  actualizadoEn: ISODate;
}

/**
 * Perfil tal y como lo crea la familia: todavía sin identificadores.
 * El servidor (o el almacén en modo demo) los asigna, de modo que la persona
 * y su perfil comparten siempre el mismo id.
 */
export type PerfilNuevo = Omit<PerfilCuidado, 'id' | 'actualizadoEn' | 'persona'> & {
  persona: Omit<PersonaAtendida, 'id'> & { id?: string };
};

export interface DatosSensibles {
  descripcion?: string;
  /** Autonomía en las actividades de la vida diaria. */
  autonomia?: string;
  /** Estado cognitivo observado (memoria, demencia…). */
  cognicion?: string;
  /** Agudeza visual y auditiva. */
  vision?: string;
  oido?: string;
  /** Apoyo necesario con la medicación. */
  medicacion?: string;
  /** Con quién convive la persona atendida. */
  convivencia?: string;
  /** Tipo de vivienda y accesibilidad (ascensor, planta…). */
  vivienda?: string;
  /** Patologías y alergías relevantes para el cuidado. */
  patologias?: string;
  alergias?: string;
  /** Invariante de privacidad: los datos sensibles nunca son públicos. */
  visibleEnOferta: false;
}

/* ---------- Publicación y candidaturas (pasos 03 y 04) ---------- */

export interface Candidatura {
  id: ID;
  perfilId: ID;
  cuidadorId: ID;
  estado: 'nueva' | 'vista' | 'preseleccionada' | 'seleccionada' | 'rechazada';
  /** Motivos explicables del encaje (nunca porcentajes ficticios). */
  motivosAfinidad: string[];
  mensaje?: string;
  creadaEn: ISODate;
}

export type TipoVerificacion = 'identidad' | 'formacion' | 'penales' | 'referencias';

export interface Verificacion {
  tipo: TipoVerificacion;
  estado: 'verificada' | 'pendiente' | 'no_aplica';
  detalle?: string;
}

export interface Cuidador {
  id: ID;
  nombre: string;
  fotoUrl?: string;
  anosExperiencia: number;
  distanciaKm?: number;
  tarifaHora?: number;
  /** Valoración media de reseñas reales (como en la demo de la landing). */
  valoracion?: number;
  /** Número de reseñas que sostienen la valoración media. */
  valoraciones?: number;
  disponibilidad: string;
  verificaciones: Verificacion[];
  biografia?: string;
  /** Competencias que el cuidador declara en su perfil (base del % de afinidad). */
  competencias?: string[];
}

export interface CandidatoComparado {
  candidatura: Candidatura;
  cuidador: Cuidador;
}

/* ---------- Mi cuidador: acuerdos y permisos (tras la selección) ---------- */

/** Lo que la familia permite que el cuidador vea y haga en la app. */
export interface PermisosCuidador {
  verDatosClinicos: boolean;
  editarRutina: boolean;
  verInformes: boolean;
  registrarIncidencias: boolean;
  avisarCompletadas: boolean;
}

/** Configuración del cuidador asignado a un perfil (pantalla /cuidador). */
export interface ConfigCuidador {
  perfilId: ID;
  horarioAcordado?: string;
  /** Tarifa acordada en €/h (la familia puede dejarla vacía). */
  tarifaAcordada?: number;
  /** Nota privada de la familia para el cuidador. */
  nota?: string;
  permisos: PermisosCuidador;
}

/* ---------- Servicios complementarios (paso 05) ---------- */

export type CategoriaServicio = 'gestoria' | 'especialista' | 'sanitario' | 'formacion';

export interface ServicioComplementario {
  id: ID;
  categoria: CategoriaServicio;
  nombre: string;
  descripcion: string;
  condiciones?: string;
  contratado: boolean;
}

/* ---------- Rutinas y seguimiento (paso 06) ---------- */

export type MomentoDia = 'manana' | 'mediodia' | 'tarde' | 'noche';

/** 'diaria' repite cada día · 'unica' solo aparece en su `fechaAplicacion`. */
export type RepeticionTarea = 'diaria' | 'unica';

export interface Tarea {
  id: ID;
  perfilId: ID;
  nombre: string;
  momento: MomentoDia;
  hora: string;
  responsableId?: ID;
  personalizada: boolean;
  repeticion: RepeticionTarea;
  /** Día concreto (ISO) para tareas 'unica': al pasar la fecha dejan de verse. */
  fechaAplicacion?: ISODate;
}

export type EstadoRegistro = 'realizada' | 'pendiente' | 'incidencia';

export interface RegistroTarea {
  id: ID;
  tareaId: ID;
  fecha: ISODate;
  estado: EstadoRegistro;
  responsableId?: ID;
  nota?: string;
}

export interface Incidencia {
  id: ID;
  perfilId: ID;
  fecha: ISODate;
  titulo: string;
  descripcion?: string;
  responsableId?: ID;
  estado: 'abierta' | 'resuelta';
  resolucion?: string;
}

/* ---------- Informes e historial (pasos 07 y 08) ---------- */

export interface Informe {
  perfilId: ID;
  periodo: { desde: ISODate; hasta: ISODate };
  tareasRealizadas: number;
  tareasTotales: number;
  incidencias: Incidencia[];
  /** Valoración media del cuidador asignado (reviews reales). Sin datos: undefined. */
  valoracion?: number;
  /** Adherencia por rutina dentro del periodo (realizadas / programadas). */
  adherencia: {
    tareaId: ID;
    nombre: string;
    realizadas: number;
    programadas: number;
  }[];
}

export type CategoriaHistorial = 'habitos' | 'alimentacion' | 'movilidad' | 'mediciones';

export interface RegistroHistorial {
  id: ID;
  perfilId: ID;
  categoria: CategoriaHistorial;
  fecha: ISODate;
  resumen: string;
  valor?: number;
  unidad?: string;
  responsableId?: ID;
}

/* ---------- Sesión ---------- */

export interface Sesion {
  token: string;
  familia: Familia;
  expiraEn: ISODate;
}

/* ============================================================================
 * FASE 1: ALERTAS MÉDICAS + ESCALADO
 * ============================================================================ */

export type ISODateTime = string; // ISO 8601 con hora: 2026-10-23T14:30:00.000Z

export type TipoAlerta =
  | 'medicacion'
  | 'signos_vitales'
  | 'cita'
  | 'recordatorio'
  | 'urgencia';

export type PrioridadAlerta = 'baja' | 'media' | 'alta' | 'critica';

export interface AccionAlerta {
  tipo?: 'abrir_tarea' | 'abrir_incidencia' | 'llamar' | 'url' | 'registrar_valor';
  valor: string;
}

export interface AlertaMedica {
  id: ID;
  perfilId: ID;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  titulo: string;
  mensaje: string;
  fechaHora: ISODateTime;
  leida: boolean;
  descartada: boolean;
  accion?: AccionAlerta;
  reglaId?: ID;
  creadaEn: ISODateTime;
  leidaEn?: ISODateTime;
  escalada: boolean;
  nivelEscaladoActual: number;
}

/* ---------- Reglas de alerta ---------- */

export type TipoRegla =
  | 'medicacion'
  | 'signos_vitales'
  | 'cita'
  | 'recordatorio'
  | 'personalizada';

export interface ReglaCondicion {
  frecuencia?: 'diaria' | 'semanal' | 'mensual' | 'personalizada';
  hora?: string;
  horasEntreTomas?: number;
  diasSemana?: number[];
  tipoValor?: 'tension_sistolica' | 'tension_diastolica' | 'glucosa' | 'temperatura' | 'peso' | 'saturacion';
  operador?: '>' | '<' | '>=' | '<=' | '==';
  umbral?: number;
  fechaCita?: ISODate;
  recordatoriosPrevios?: number[];
  cron?: string;
}

export interface ReglaAccion {
  crearAlerta: boolean;
  prioridadAlerta: PrioridadAlerta;
  tituloPlantilla: string;
  mensajePlantilla: string;
  accion?: AccionAlerta;
  crearTarea?: boolean;
  tareaPlantilla?: Partial<Tarea>;
  crearIncidencia?: boolean;
}

export interface NivelEscalado {
  orden: number;
  tipo: 'push_local' | 'push_familia' | 'sms' | 'llamada' | 'contacto_emergencia';
  destinatario: 'familia' | 'cuidador' | 'contacto_emergencia' | 'telefono_personalizado';
  telefono?: string;
  mensajePlantilla: string;
  retrasoMinutos: number;
  requiereConfirmacion: boolean;
}

export interface ConfigEscalado {
  niveles: NivelEscalado[];
  tiempoMaximoSinRespuesta: number;
}

export interface ReglaAlerta {
  id: ID;
  perfilId: ID;
  nombre: string;
  tipo: TipoRegla;
  condicion: ReglaCondicion;
  accion: ReglaAccion;
  escalado?: ConfigEscalado;
  activa: boolean;
  creadaEn: ISODateTime;
  actualizadaEn: ISODateTime;
  ultimaEjecucion?: ISODateTime;
  proximaEjecucion?: ISODateTime;
  vecesEjecutada: number;
}

/* ---------- Configuración notificaciones ---------- */

export interface ConfigNotificaciones {
  pushHabilitado: boolean;
  sonidoHabilitado: boolean;
  vibracionHabilitada: boolean;
  sonidoPorPrioridad: Record<PrioridadAlerta, string>;
  noMolestar: {
    activado: boolean;
    inicio: string;
    fin: string;
    permitirCriticas: boolean;
  };
  porPerfil: Record<ID, {
    pushHabilitado?: boolean;
    sonidoHabilitado?: boolean;
    noMolestar?: { activado: boolean; inicio: string; fin: string; };
  }>;
}
