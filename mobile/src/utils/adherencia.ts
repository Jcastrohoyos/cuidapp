/**
 * Adherencia real a la rutina: cuántas veces se realizó cada tarea frente a
 * cuántas estaba programada en el periodo, y qué porcentaje supone.
 *
 * El modelo de persistencia es "append" (un registro nuevo por cada cambio de
 * estado), así que el estado de una tarea en un día es el del ÚLTIMO registro
 * de ese día: contar registros daría más de una realización por día.
 *
 * Todo se deriva de datos registrados (nada de porcentajes inventados).
 */

import { eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

import { fechaHoy } from '@/utils/format';
import type { ISODate, RegistroTarea, Tarea } from '@/types';

/** Periodo del informe: la semana en curso (lunes a domingo). */
export function periodoSemana(referencia: Date = new Date()): {
  desde: ISODate;
  hasta: ISODate;
} {
  const desde = startOfWeek(referencia, { weekStartsOn: 1 });
  const hasta = endOfWeek(referencia, { weekStartsOn: 1 });
  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') };
}

/**
 * Días ya transcurridos del periodo. Los días que aún no han pasado no se
 * cuentan: una tarea de mañana no está "sin hacer" hasta que el día termina.
 */
export function diasTranscurridos(
  desde: ISODate,
  hasta: ISODate,
  hoy: ISODate = fechaHoy(),
): ISODate[] {
  return eachDayOfInterval({ start: parseISO(desde), end: parseISO(hasta) })
    .map((dia) => format(dia, 'yyyy-MM-dd'))
    .filter((dia) => dia <= hoy);
}

/** Días en los que la tarea estaba programada dentro del periodo. */
export function diasProgramados(
  tarea: Tarea,
  desde: ISODate,
  hasta: ISODate,
  hoy: ISODate = fechaHoy(),
): ISODate[] {
  if (tarea.repeticion === 'unica') {
    const fecha = tarea.fechaAplicacion;
    return fecha && fecha >= desde && fecha <= hasta ? [fecha] : [];
  }
  return diasTranscurridos(desde, hasta, hoy);
}

/** Parte numérica del id (los ids crecen con el tiempo: reg_1750000000000_0002). */
function numeroDeId(id: string): number {
  return Number(id.replace(/\D/g, '')) || 0;
}

/**
 * Estado vigente de una tarea en un día concreto: el del último registro de
 * ese día. `null` si ese día nadie registró nada.
 */
export function estadoDelDia(
  registros: RegistroTarea[],
  tareaId: string,
  fecha: ISODate,
): RegistroTarea['estado'] | null {
  const delDia = registros.filter((r) => r.tareaId === tareaId && r.fecha === fecha);
  if (delDia.length === 0) return null;
  const ultimo = delDia.reduce((a, b) => (numeroDeId(b.id) > numeroDeId(a.id) ? b : a));
  return ultimo.estado;
}

export interface AdherenciaTarea {
  tareaId: string;
  nombre: string;
  /** Veces que se realizó dentro del periodo. */
  realizadas: number;
  /** Veces que estaba programada dentro del periodo. */
  programadas: number;
}

export interface ResultadoAdherencia {
  porTarea: AdherenciaTarea[];
  realizadas: number;
  programadas: number;
}

/**
 * Calcula la adherencia de todas las tareas en el periodo indicado.
 * Solo cuenta los días ya transcurridos: lo que aún no ha ocurrido no puede
 * contarse como incumplido.
 */
export function calcularAdherencia(
  tareas: Tarea[],
  registros: RegistroTarea[],
  desde: ISODate,
  hasta: ISODate,
  hoy: ISODate = fechaHoy(),
): ResultadoAdherencia {
  const porTarea: AdherenciaTarea[] = tareas.map((tarea) => {
    const programadas = diasProgramados(tarea, desde, hasta, hoy).length;
    const realizadas = diasProgramados(tarea, desde, hasta, hoy).filter(
      (dia) => estadoDelDia(registros, tarea.id, dia) === 'realizada',
    ).length;
    return { tareaId: tarea.id, nombre: tarea.nombre, realizadas, programadas };
  });

  return {
    porTarea,
    realizadas: porTarea.reduce((suma, t) => suma + t.realizadas, 0),
    programadas: porTarea.reduce((suma, t) => suma + t.programadas, 0),
  };
}

/** Etiqueta del periodo: "Semana del 19–25 de octubre". */
export function etiquetaSemana(desde: ISODate, hasta: ISODate): string {
  const inicio = parseISO(desde);
  const fin = parseISO(hasta);
  const mismoMes = inicio.getMonth() === fin.getMonth();
  const etiqueta = mismoMes
    ? `${format(inicio, 'd')}–${format(fin, 'd')} de ${format(fin, 'MMMM', { locale: es })}`
    : `${format(inicio, 'd')} de ${format(inicio, 'MMM', { locale: es })}–${format(fin, 'd')} de ${format(fin, 'MMM', { locale: es })}`;
  return `Semana del ${etiqueta}`;
}

/** Formato es-ES de un decimal: 4.9 → "4,9". */
export function decimalEs(valor: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(valor);
}

/** Etiqueta corta de un mes en español ("octubre"). */
export function mesEs(fecha: string): string {
  return format(parseISO(fecha), 'MMMM', { locale: es });
}
