import { Model } from '@nozbe/watermelondb';
import { field, text, json, date, readonly } from '@nozbe/watermelondb/decorators';

/**
 * Modelo base con campos comunes
 */
export abstract class BaseModel extends Model {
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

/**
 * Sanitizer por defecto para JSON
 */
const jsonSanitizer = (value: any) => value;

/**
 * Familia (cuenta familiar) - tabla 'familias'
 */
export class Familia extends BaseModel {
  static table = 'familias';

  @field('nombre') nombre!: string;
  @field('email') email!: string;
  @field('telefono') telefono: string;
  @field('plan') plan!: 'gratuito' | 'esencial' | 'familiar';
  @field('perfiles_maximos') perfilesMaximos!: number;

  @json('ubicacion', jsonSanitizer) ubicacion: { ciudad: string; zona: string } | null;
  @json('miembros', jsonSanitizer) miembros!: Array<{
    id: string;
    nombre: string;
    relacion: string;
    telefono?: string;
    email?: string;
  }>;
  @json('contacto_emergencia', jsonSanitizer) contactoEmergencia: {
    nombre: string;
    telefono: string;
    relacion: string;
  } | null;
  @json('preferencias', jsonSanitizer) preferencias!: {
    distanciaMaxKm?: number;
    tarifaMaxHora?: number;
    franjas: ('manana' | 'tarde' | 'noche')[];
    verificacionesMinimas: ('identidad' | 'formacion' | 'penales' | 'referencias')[];
  };
}

/**
 * Perfil de cuidado - tabla 'perfiles'
 */
export class Perfil extends BaseModel {
  static table = 'perfiles';

  @field('familia_id') familiaId!: string;
  @json('persona', jsonSanitizer) persona!: {
    id: string;
    nombre: string;
    fechaNacimiento?: string;
    fotoUrl?: string;
    relacion?: string;
    genero?: 'mujer' | 'hombre' | 'otro' | 'no_especificar';
  };
  @field('tipo_atencion') tipoAtencion!: 'domiciliaria' | 'acompanamiento' | 'residencia' | 'temporal';
  @field('estado') estado!: 'borrador' | 'publicado' | 'en_seleccion' | 'con_cuidador';
  @json('ubicacion', jsonSanitizer) ubicacion!: { ciudad: string; zona: string };
  @json('horario', jsonSanitizer) horario!: { dias: string[]; desde: string; hasta: string };
  @field('movilidad') movilidad: string;
  @json('habitos', jsonSanitizer) habitos!: string[];
  @json('competencias_requeridas', jsonSanitizer) competenciasRequeridas!: string[];
  @json('datos_sensibles', jsonSanitizer) datosSensibles!: {
    descripcion?: string;
    autonomia?: string;
    cognicion?: string;
    vision?: string;
    oido?: string;
    medicacion?: string;
    convivencia?: string;
    vivienda?: string;
    patologias?: string;
    alergias?: string;
    visibleEnOferta: false;
  };
  @field('notas') notas: string;
  @date('actualizado_en') actualizadoEn!: Date;
}

/**
 * Cuidador (profesional) - tabla 'cuidadores'
 */
export class Cuidador extends BaseModel {
  static table = 'cuidadores';

  @field('nombre') nombre!: string;
  @field('foto_url') fotoUrl: string;
  @field('anos_experiencia') anosExperiencia!: number;
  @field('distancia_km') distanciaKm: number;
  @field('tarifa_hora') tarifaHora: number;
  @field('valoracion') valoracion: number;
  @field('valoraciones') valoraciones: number;
  @field('disponibilidad') disponibilidad!: string;
  @json('verificaciones', jsonSanitizer) verificaciones!: Array<{
    tipo: 'identidad' | 'formacion' | 'penales' | 'referencias';
    estado: 'verificada' | 'pendiente' | 'no_aplica';
    detalle?: string;
  }>;
  @field('biografia') biografia: string;
  @json('competencias', jsonSanitizer) competencias!: string[];
}

/**
 * Candidatura - tabla 'candidaturas'
 */
export class Candidatura extends BaseModel {
  static table = 'candidaturas';

  @field('perfil_id') perfilId!: string;
  @field('cuidador_id') cuidadorId!: string;
  @field('estado') estado!: 'nueva' | 'vista' | 'preseleccionada' | 'seleccionada' | 'rechazada';
  @json('motivos_afinidad', jsonSanitizer) motivosAfinidad!: string[];
  @field('mensaje') mensaje: string;
  @date('creada_en') creadaEn!: Date;
}

/**
 * Configuración del cuidador - tabla 'configs_cuidador'
 */
export class ConfigCuidador extends BaseModel {
  static table = 'configs_cuidador';

  @field('perfil_id') perfilId!: string;
  @field('horario_acordado') horarioAcordado: string;
  @field('tarifa_acordada') tarifaAcordada: number;
  @field('nota') nota: string;
  @json('permisos', jsonSanitizer) permisos!: {
    verDatosClinicos: boolean;
    editarRutina: boolean;
    verInformes: boolean;
    registrarIncidencias: boolean;
    avisarCompletadas: boolean;
  };
}

/**
 * Tarea de rutina - tabla 'tareas'
 */
export class Tarea extends BaseModel {
  static table = 'tareas';

  @field('perfil_id') perfilId!: string;
  @field('nombre') nombre!: string;
  @field('momento') momento!: 'manana' | 'mediodia' | 'tarde' | 'noche';
  @field('hora') hora!: string;
  @field('responsable_id') responsableId: string;
  @field('personalizada') personalizada!: boolean;
  @field('repeticion') repeticion!: 'diaria' | 'unica';
  @date('fecha_aplicacion') fechaAplicacion?: Date;
}

/**
 * Registro de ejecución de tarea - tabla 'registros_tarea'
 */
export class RegistroTarea extends BaseModel {
  static table = 'registros_tarea';

  @field('tarea_id') tareaId!: string;
  @date('fecha') fecha!: Date;
  @field('estado') estado!: 'realizada' | 'pendiente' | 'incidencia';
  @field('responsable_id') responsableId: string;
  @field('nota') nota: string;
}

/**
 * Incidencia - tabla 'incidencias'
 */
export class Incidencia extends BaseModel {
  static table = 'incidencias';

  @field('perfil_id') perfilId!: string;
  @date('fecha') fecha!: Date;
  @field('titulo') titulo!: string;
  @field('descripcion') descripcion: string;
  @field('responsable_id') responsableId: string;
  @field('estado') estado!: 'abierta' | 'resuelta';
  @field('resolucion') resolucion: string;
}

/**
 * Servicio complementario - tabla 'servicios'
 */
export class Servicio extends BaseModel {
  static table = 'servicios';

  @field('categoria') categoria!: 'gestoria' | 'especialista' | 'sanitario' | 'formacion';
  @field('nombre') nombre!: string;
  @field('descripcion') descripcion!: string;
  @field('condiciones') condiciones: string;
  @field('contratado') contratado!: boolean;
}

/**
 * Registro de historial - tabla 'historial'
 */
export class Historial extends BaseModel {
  static table = 'historial';

  @field('perfil_id') perfilId!: string;
  @field('categoria') categoria!: 'habitos' | 'alimentacion' | 'movilidad' | 'mediciones';
  @date('fecha') fecha!: Date;
  @field('resumen') resumen!: string;
  @field('valor') valor: number;
  @field('unidad') unidad: string;
  @field('responsable_id') responsableId: string;
}

/**
 * Ajustes de la app - tabla 'ajustes'
 */
export class Ajuste extends BaseModel {
  static table = 'ajustes';

  @field('clave') clave!: string;
  @field('valor') valor!: string;
}

/**
 * FASE 1: Alerta médica - tabla 'alertas'
 */
export class Alerta extends BaseModel {
  static table = 'alertas';

  static associations = {
    perfiles: { type: 'belongs_to' as const, key: 'perfil_id' },
    reglas_alerta: { type: 'belongs_to' as const, key: 'regla_id' },
  };

  @field('perfil_id') perfilId!: string;
  @field('tipo') tipo!: 'medicacion' | 'signos_vitales' | 'cita' | 'recordatorio' | 'urgencia';
  @field('prioridad') prioridad!: 'baja' | 'media' | 'alta' | 'critica';
  @field('titulo') titulo!: string;
  @field('mensaje') mensaje!: string;
  @date('fecha_hora') fechaHora!: Date;
  @field('leida') leida!: boolean;
  @field('descartada') descartada!: boolean;
  @json('accion', jsonSanitizer) accion: {
    tipo: 'abrir_tarea' | 'abrir_incidencia' | 'llamar' | 'url' | 'registrar_valor';
    valor: string;
  } | null;
  @field('regla_id') reglaId?: string;
  @field('escalada') escalada!: boolean;
  @field('nivel_escalado_actual') nivelEscaladoActual!: number;
  @date('leida_en') leidaEn?: Date;
}

/**
 * FASE 1: Regla de alerta - tabla 'reglas_alerta'
 */
export class ReglaAlerta extends BaseModel {
  static table = 'reglas_alerta';

  static associations = {
    perfiles: { type: 'belongs_to' as const, key: 'perfil_id' },
  };

  @field('perfil_id') perfilId!: string;
  @field('nombre') nombre!: string;
  @field('tipo') tipo!: 'medicacion' | 'signos_vitales' | 'cita' | 'recordatorio' | 'personalizada';
  @json('condicion', jsonSanitizer) condicion!: Record<string, any>;
  @json('accion', jsonSanitizer) accion!: Record<string, any>;
  @json('escalado', jsonSanitizer) escalado: Record<string, any> | null;
  @field('activa') activa!: boolean;
  @date('ultima_ejecucion') ultimaEjecucion?: Date;
  @date('proxima_ejecucion') proximaEjecucion?: Date;
  @field('veces_ejecutada') vecesEjecutada!: number;
}

/**
 * FASE 1: Configuración de notificaciones - tabla 'config_notificaciones'
 */
export class ConfigNotificaciones extends BaseModel {
  static table = 'config_notificaciones';

  @field('clave') clave!: string; // 'global' | 'perfil_<id>'
  @json('valor', jsonSanitizer) valor!: Record<string, any>;
}