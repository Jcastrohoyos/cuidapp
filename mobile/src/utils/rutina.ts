import type { ISODate, Tarea } from '@/types';

/**
 * Tareas visibles de un día concreto: las diarias siempre y las "solo una
 * vez" únicamente si su fecha de aplicación coincide con el día consultado.
 * Al pasar la fecha, las puntuales desaparecen de la rutina sin que la
 * familia tenga que borrarlas a mano.
 */
export function tareasDelDia(tareas: Tarea[], fecha: ISODate): Tarea[] {
  return tareas.filter((t) => t.repeticion !== 'unica' || t.fechaAplicacion === fecha);
}

/** Hora por defecto al crear una tarea sin hora explícita, según el momento. */
export const HORA_POR_MOMENTO = {
  manana: '09:00',
  mediodia: '13:00',
  tarde: '17:00',
  noche: '21:00',
} as const;

/** Valida formato HH:MM de 24 h (acepta H sin cero inicial: "9:05"). */
export function esHoraValida(hora: string): boolean {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(hora.trim());
}
