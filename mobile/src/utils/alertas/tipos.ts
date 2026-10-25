/**
 * Tipos internos del motor de alertas (FASE 1).
 * Separados de los tipos de dominio para no acoplar la lógica pura a la BD/API.
 */

import type { ReglaCondicion, ReglaAccion, ConfigEscalado, PrioridadAlerta, AccionAlerta } from '@/types';
import type { Tarea, RegistroTarea, RegistroHistorial, ISODate, ISODateTime } from '@/types';

// Re-exportar tipos de dominio que se usan en el motor
export type { ReglaCondicion, ReglaAccion, ConfigEscalado, PrioridadAlerta, AccionAlerta } from '@/types';
export type { Tarea, RegistroTarea, RegistroHistorial, ISODate, ISODateTime } from '@/types';

/** Contexto necesario para evaluar una regla en un momento dado. */
export interface ContextoEvaluacion {
  ahora: Date;
  perfilId: string;
  // Datos para evaluar condiciones
  tareas: Tarea[];                    // Para tipo 'medicacion' y 'recordatorio'
  registrosTarea: RegistroTarea[];    // Para saber si ya se tomó la medicación hoy
  historialSignos: RegistroHistorial[]; // Para tipo 'signos_vitales'
  // Futuro: citas médicas, etc.
}

/** Resultado de evaluar una condición. */
export interface ResultadoEvaluacion {
  cumple: boolean;                    // Si la condición se cumple AHORA
  proximaFecha?: Date;                // Cuándo volver a evaluar (para programar siguiente alerta)
  datosExtra?: Record<string, any>;   // Datos para plantillas (ej. valor del signo vital)
}

/** Alerta generada por el motor (antes de persistir). */
export interface AlertaGenerada {
  perfilId: string;
  tipo: 'medicacion' | 'signos_vitales' | 'cita' | 'recordatorio' | 'urgencia';
  prioridad: PrioridadAlerta;
  titulo: string;
  mensaje: string;
  fechaHora: Date;                    // Cuándo debe dispararse la notificación
  accion?: AccionAlerta;
  reglaId: string;
  datosExtra?: Record<string, any>;
}

/** Configuración resuelta de una regla para ejecución. */
export interface ReglaResuelta {
  id: string;
  perfilId: string;
  nombre: string;
  tipo: string;
  condicion: ReglaCondicion;
  accion: ReglaAccion;
  escalado?: ConfigEscalado;
  activa: boolean;
}

/** Estado de escalado de una alerta. */
export interface EstadoEscalado {
  alertaId: string;
  nivelActual: number;                // 0 = sin escalar, 1 = primer nivel, etc.
  proximoNivelEn?: Date;              // Cuándo disparar siguiente nivel
  cancelado: boolean;                 // Si usuario leyó/actuó
}

/** Opciones para el programador. */
export interface OpcionesProgramacion {
  soloHoy?: boolean;                  // Solo alertas de hoy (para job diario)
  ventanaHoras?: number;              // Ventana hacia futuro (default 24h)
}