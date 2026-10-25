import {
  appSchema,
  tableSchema,
} from '@nozbe/watermelondb';

/**
 * Esquema de base de datos WatermelonDB para Cuidapp.
 * Mapea 1:1 los tipos de dominio en src/types/index.ts.
 * Las entidades anidadas (PersonaAtendida, Ubicacion, Horario, DatosSensibles,
 * PermisosCuidador) se almacenan como columnas JSON (tipo 'text' con JSON.stringify).
 */

export const schema = appSchema({
  version: 2,
  tables: [
    // Tabla principal: Familia (cuenta familiar)
    tableSchema({
      name: 'familias',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'nombre', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'telefono', type: 'string', isOptional: true },
        { name: 'plan', type: 'string' }, // 'gratuito' | 'esencial' | 'familiar'
        { name: 'perfiles_maximos', type: 'number' },
        { name: 'ubicacion', type: 'string', isOptional: true }, // JSON: Ubicacion
        { name: 'miembros', type: 'string' }, // JSON: MiembroFamilia[]
        { name: 'contacto_emergencia', type: 'string', isOptional: true }, // JSON: ContactoEmergencia
        { name: 'preferencias', type: 'string' }, // JSON: PreferenciasBusqueda
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Perfil de cuidado (eje operativo)
    tableSchema({
      name: 'perfiles',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'familia_id', type: 'string', isIndexed: true },
        { name: 'persona', type: 'string' }, // JSON: PersonaAtendida (incluye id, nombre, fechaNacimiento, fotoUrl, relacion, genero)
        { name: 'tipo_atencion', type: 'string' }, // 'domiciliaria' | 'acompanamiento' | 'residencia' | 'temporal'
        { name: 'estado', type: 'string' }, // 'borrador' | 'publicado' | 'en_seleccion' | 'con_cuidador'
        { name: 'ubicacion', type: 'string' }, // JSON: Ubicacion
        { name: 'horario', type: 'string' }, // JSON: Horario
        { name: 'movilidad', type: 'string', isOptional: true },
        { name: 'habitos', type: 'string' }, // JSON: string[]
        { name: 'competencias_requeridas', type: 'string' }, // JSON: string[]
        { name: 'datos_sensibles', type: 'string' }, // JSON: DatosSensibles
        { name: 'notas', type: 'string', isOptional: true },
        { name: 'actualizado_en', type: 'number' }, // timestamp ISO como number
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Cuidador (profesional)
    tableSchema({
      name: 'cuidadores',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'nombre', type: 'string' },
        { name: 'foto_url', type: 'string', isOptional: true },
        { name: 'anos_experiencia', type: 'number' },
        { name: 'distancia_km', type: 'number', isOptional: true },
        { name: 'tarifa_hora', type: 'number', isOptional: true },
        { name: 'valoracion', type: 'number', isOptional: true },
        { name: 'valoraciones', type: 'number', isOptional: true },
        { name: 'disponibilidad', type: 'string' },
        { name: 'verificaciones', type: 'string' }, // JSON: Verificacion[]
        { name: 'biografia', type: 'string', isOptional: true },
        { name: 'competencias', type: 'string', isOptional: true }, // JSON: string[]
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Candidatura (postulación de cuidador a perfil)
    tableSchema({
      name: 'candidaturas',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'cuidador_id', type: 'string', isIndexed: true },
        { name: 'estado', type: 'string' }, // 'nueva' | 'vista' | 'preseleccionada' | 'seleccionada' | 'rechazada'
        { name: 'motivos_afinidad', type: 'string' }, // JSON: string[]
        { name: 'mensaje', type: 'string', isOptional: true },
        { name: 'creada_en', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Configuración del cuidador asignado (acuerdos y permisos)
    tableSchema({
      name: 'configs_cuidador',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'horario_acordado', type: 'string', isOptional: true },
        { name: 'tarifa_acordada', type: 'number', isOptional: true },
        { name: 'nota', type: 'string', isOptional: true },
        { name: 'permisos', type: 'string' }, // JSON: PermisosCuidador
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Tareas de rutina
    tableSchema({
      name: 'tareas',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'nombre', type: 'string' },
        { name: 'momento', type: 'string' }, // 'manana' | 'mediodia' | 'tarde' | 'noche'
        { name: 'hora', type: 'string' },
        { name: 'responsable_id', type: 'string', isOptional: true },
        { name: 'personalizada', type: 'boolean' },
        { name: 'repeticion', type: 'string' }, // 'diaria' | 'unica'
        { name: 'fecha_aplicacion', type: 'number', isOptional: true }, // timestamp para tareas 'unica'
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Registros de ejecución de tareas (append-only, modelo event sourcing ligero)
    tableSchema({
      name: 'registros_tarea',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'tarea_id', type: 'string', isIndexed: true },
        { name: 'fecha', type: 'number' }, // timestamp ISO date (YYYY-MM-DD como number)
        { name: 'estado', type: 'string' }, // 'realizada' | 'pendiente' | 'incidencia'
        { name: 'responsable_id', type: 'string', isOptional: true },
        { name: 'nota', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Incidencias a nivel de perfil (no ligadas a tarea específica)
    tableSchema({
      name: 'incidencias',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'fecha', type: 'number' },
        { name: 'titulo', type: 'string' },
        { name: 'descripcion', type: 'string', isOptional: true },
        { name: 'responsable_id', type: 'string', isOptional: true },
        { name: 'estado', type: 'string' }, // 'abierta' | 'resuelta'
        { name: 'resolucion', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Servicios complementarios
    tableSchema({
      name: 'servicios',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'categoria', type: 'string' }, // 'gestoria' | 'especialista' | 'sanitario' | 'formacion'
        { name: 'nombre', type: 'string' },
        { name: 'descripcion', type: 'string' },
        { name: 'condiciones', type: 'string', isOptional: true },
        { name: 'contratado', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Historial de datos (pasos 07 y 08)
    tableSchema({
      name: 'historial',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'categoria', type: 'string' }, // 'habitos' | 'alimentacion' | 'movilidad' | 'mediciones'
        { name: 'fecha', type: 'number' },
        { name: 'resumen', type: 'string' },
        { name: 'valor', type: 'number', isOptional: true },
        { name: 'unidad', type: 'string', isOptional: true },
        { name: 'responsable_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // Ajustes de la app (perfil activo, etc.)
    tableSchema({
      name: 'ajustes',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'clave', type: 'string', isIndexed: true }, // 'perfil_activo_id', 'texto_grande', etc.
        { name: 'valor', type: 'string' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // FASE 1: Alertas médicas
    tableSchema({
      name: 'alertas',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'tipo', type: 'string' }, // 'medicacion' | 'signos_vitales' | 'cita' | 'recordatorio' | 'urgencia'
        { name: 'prioridad', type: 'string' }, // 'baja' | 'media' | 'alta' | 'critica'
        { name: 'titulo', type: 'string' },
        { name: 'mensaje', type: 'string' },
        { name: 'fecha_hora', type: 'number' }, // timestamp ISODateTime
        { name: 'leida', type: 'boolean' },
        { name: 'descartada', type: 'boolean' },
        { name: 'accion', type: 'string', isOptional: true }, // JSON: AccionAlerta
        { name: 'regla_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'escalada', type: 'boolean' },
        { name: 'nivel_escalado_actual', type: 'number' },
        { name: 'leida_en', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // FASE 1: Reglas de alerta
    tableSchema({
      name: 'reglas_alerta',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'perfil_id', type: 'string', isIndexed: true },
        { name: 'nombre', type: 'string' },
        { name: 'tipo', type: 'string' }, // 'medicacion' | 'signos_vitales' | 'cita' | 'recordatorio' | 'personalizada'
        { name: 'condicion', type: 'string' }, // JSON: ReglaCondicion
        { name: 'accion', type: 'string' }, // JSON: ReglaAccion
        { name: 'escalado', type: 'string', isOptional: true }, // JSON: ConfigEscalado
        { name: 'activa', type: 'boolean' },
        { name: 'ultima_ejecucion', type: 'number', isOptional: true },
        { name: 'proxima_ejecucion', type: 'number', isOptional: true },
        { name: 'veces_ejecutada', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // FASE 1: Configuración de notificaciones
    tableSchema({
      name: 'config_notificaciones',
      columns: [
        { name: 'id', type: 'string', isIndexed: true },
        { name: 'clave', type: 'string', isIndexed: true }, // 'global' | 'perfil_{id}'
        { name: 'valor', type: 'string' }, // JSON: ConfigNotificaciones
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});