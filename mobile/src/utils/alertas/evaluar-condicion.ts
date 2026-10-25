/**
 * Evaluador puro de condiciones de alertas.
 * Sin dependencias externas, 100% testeable.
 * 
 * Soporta v1:
 * - medicacion: hora fija diaria / cada N horas / días de semana específicos
 * - signos_vitales: umbral sobre último registro histórico
 * - cita: recordatorios en offsets previos a fecha
 * - recordatorio: cron básico / recurrencia flexible
 */

import { eachDayOfInterval, endOfWeek, format, parseISO, startOfWeek, addMinutes, isBefore, isAfter, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import type { ReglaCondicion, ResultadoEvaluacion, ContextoEvaluacion } from './tipos';
import type { RegistroHistorial, ISODate, Tarea } from '@/types';

/** Mapea tipo de valor a categoría de historial. */
const TIPO_VALOR_A_CATEGORIA: Record<string, 'mediciones' | 'habitos' | 'alimentacion' | 'movilidad'> = {
  tension_sistolica: 'mediciones',
  tension_diastolica: 'mediciones',
  glucosa: 'mediciones',
  temperatura: 'mediciones',
  peso: 'mediciones',
  saturacion: 'mediciones',
};

/** Obtiene el último registro histórico de un tipo para un perfil. */
function obtenerUltimoSignoVital(
  historial: RegistroHistorial[],
  tipoValor: string
): RegistroHistorial | null {
  const categoria = TIPO_VALOR_A_CATEGORIA[tipoValor];
  if (!categoria) return null;
  
  const relevantes = historial
    .filter((h) => h.categoria === categoria && h.valor !== undefined)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  
  return relevantes[0] || null;
}

/** Evalúa operador numérico. */
function evaluarOperador(valor: number, operador: string, umbral: number): boolean {
  switch (operador) {
    case '>': return valor > umbral;
    case '>=': return valor >= umbral;
    case '<': return valor < umbral;
    case '<=': return valor <= umbral;
    case '==': return valor === umbral;
    default: return false;
  }
}

/** Convierte "HH:MM" a Date de hoy a esa hora en UTC. */
function horaStringADate(hora: string, base: Date = new Date()): Date {
  const [h, m] = hora.split(':').map(Number);
  const d = new Date(base);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

/** Verifica si hoy coincide con días de semana permitidos (1=Lunes...7=Domingo). */
function hoyCoincideDiasSemana(diasSemana: number[], fecha: Date = new Date()): boolean {
  if (!diasSemana || diasSemana.length === 0) return true;
  const diaJS = fecha.getDay(); // 0=Domingo...6=Sábado
  const diaApp = diaJS === 0 ? 7 : diaJS; // 1=Lunes...7=Domingo
  return diasSemana.includes(diaApp);
}

/** Calcula próxima ocurrencia de una regla de medicación/recordatorio. */
function calcularProximaOcurrenciaMedicacion(
  condicion: ReglaCondicion,
  desde: Date
): Date | undefined {
  const ahora = new Date(desde);
  
  // Caso 1: Hora fija diaria
  if (condicion.hora && !condicion.horasEntreTomas) {
    let proxima = horaStringADate(condicion.hora, ahora);
    if (proxima <= ahora) {
      proxima = new Date(proxima);
      proxima.setDate(proxima.getDate() + 1);
    }
    // Avanzar hasta día permitido
    while (!hoyCoincideDiasSemana(condicion.diasSemana ?? [], proxima)) {
      proxima.setDate(proxima.getDate() + 1);
    }
    return proxima;
  }
  
  // Caso 2: Cada N horas desde medianoche UTC
  if (condicion.horasEntreTomas && condicion.horasEntreTomas > 0) {
    // Usar UTC para evitar problemas de timezone
    const baseHoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 0, 0, 0, 0));
    
    const intervaloMs = condicion.horasEntreTomas * 60 * 60 * 1000;
    const msDesdeMedianoche = ahora.getTime() - baseHoy.getTime();
    const intervalosPasados = Math.floor(msDesdeMedianoche / intervaloMs);
    const proximaMs = baseHoy.getTime() + (intervalosPasados + 1) * intervaloMs;
    
    return new Date(proximaMs);
  }
  
  // Caso 3: Semanal en días específicos + hora
  if (condicion.diasSemana && condicion.diasSemana.length > 0 && condicion.hora) {
    let proxima = horaStringADate(condicion.hora, ahora);
    if (proxima <= ahora || !hoyCoincideDiasSemana(condicion.diasSemana, proxima)) {
      for (let i = 0; i < 7; i++) {
        proxima.setDate(proxima.getDate() + 1);
        proxima.setHours(0, 0, 0, 0);
        if (hoyCoincideDiasSemana(condicion.diasSemana, proxima)) {
          proxima = horaStringADate(condicion.hora, proxima);
          break;
        }
      }
    }
    return proxima;
  }
  
  return undefined;
}

/** Evalúa condición tipo 'medicacion' o 'recordatorio' (basada en tiempo). */
function evaluarCondicionTemporal(
  condicion: ReglaCondicion,
  contexto: ContextoEvaluacion
): ResultadoEvaluacion {
  const ahora = contexto.ahora;
  
  // Verificar día de semana si aplica
  if (condicion.diasSemana && !hoyCoincideDiasSemana(condicion.diasSemana, ahora)) {
    const proxima = calcularProximaOcurrenciaMedicacion(condicion, ahora);
    return { cumple: false, proximaFecha: proxima };
  }
  
  // Hora fija diaria
  if (condicion.hora && !condicion.horasEntreTomas) {
    const horaObjetivo = horaStringADate(condicion.hora, ahora);
    const diffMin = differenceInMinutes(ahora, horaObjetivo);
    
    // Ventana de 30 min: si pasó la hora pero no más de 30 min, aún cumple (recordatorio tardío)
    if (diffMin >= 0 && diffMin <= 30) {
      const proxima = new Date(horaObjetivo);
      proxima.setDate(proxima.getDate() + 1);
      while (!hoyCoincideDiasSemana(condicion.diasSemana || [], proxima)) {
        proxima.setDate(proxima.getDate() + 1);
      }
      return { cumple: true, proximaFecha: proxima };
    }
    
    // Ya pasó la ventana o aún no es hora
    const proxima = calcularProximaOcurrenciaMedicacion(condicion, ahora);
    return { cumple: false, proximaFecha: proxima };
  }
  
  // Cada N horas
  if (condicion.horasEntreTomas && condicion.horasEntreTomas > 0) {
    // Calcular la ocurrencia actual (la que corresponde a este intervalo)
    const baseHoy = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate(), 0, 0, 0, 0));
    const intervaloMs = condicion.horasEntreTomas * 60 * 60 * 1000;
    const msDesdeMedianoche = ahora.getTime() - baseHoy.getTime();
    const intervalosPasados = Math.floor(msDesdeMedianoche / intervaloMs);
    
    // La ocurrencia actual es la que ya pasó (o es ahora)
    const ocurrenciaActualMs = baseHoy.getTime() + intervalosPasados * intervaloMs;
    const ocurrenciaActual = new Date(ocurrenciaActualMs);
    
    // Verificar si estamos en ventana de 30 min después de la ocurrencia actual
    const diffMin = differenceInMinutes(ahora, ocurrenciaActual);
    if (diffMin >= 0 && diffMin <= 30) {
      // Próxima ocurrencia para programación
      const proximaMs = baseHoy.getTime() + (intervalosPasados + 1) * intervaloMs;
      const proxima = new Date(proximaMs);
      return { cumple: true, proximaFecha: proxima };
    }
    
    // No estamos en ventana: devolver próxima para programación
    const proximaMs = baseHoy.getTime() + (intervalosPasados + 1) * intervaloMs;
    return { cumple: false, proximaFecha: new Date(proximaMs) };
  }
  
  // Días de semana + hora (sin hora fija diaria)
  if (condicion.diasSemana && condicion.diasSemana.length > 0 && condicion.hora) {
    const horaObjetivo = horaStringADate(condicion.hora, ahora);
    if (hoyCoincideDiasSemana(condicion.diasSemana, ahora)) {
      const diffMin = differenceInMinutes(ahora, horaObjetivo);
      if (diffMin >= 0 && diffMin <= 30) {
        const proxima = calcularProximaOcurrenciaMedicacion(condicion, ahora);
        return { cumple: true, proximaFecha: proxima };
      }
    }
    const proxima = calcularProximaOcurrenciaMedicacion(condicion, ahora);
    return { cumple: false, proximaFecha: proxima };
  }
  
  return { cumple: false };
}

/** Evalúa condición tipo 'signos_vitales' (umbral sobre último registro). */
function evaluarCondicionSignosVitales(
  condicion: ReglaCondicion,
  contexto: ContextoEvaluacion
): ResultadoEvaluacion {
  if (!condicion.tipoValor || !condicion.operador || condicion.umbral === undefined) {
    return { cumple: false };
  }
  
  const ultimo = obtenerUltimoSignoVital(contexto.historialSignos, condicion.tipoValor);
  if (!ultimo || ultimo.valor === undefined) {
    return { cumple: false }; // Sin datos no se puede evaluar
  }
  
  const cumple = evaluarOperador(ultimo.valor, condicion.operador, condicion.umbral);
  
  return {
    cumple,
    datosExtra: {
      valorActual: ultimo.valor,
      umbral: condicion.umbral,
      operador: condicion.operador,
      tipoValor: condicion.tipoValor,
      fechaRegistro: ultimo.fecha,
    },
    // Re-evaluar en 1 hora por defecto
    proximaFecha: new Date(Date.now() + 60 * 60 * 1000),
  };
}

/** Evalúa condición tipo 'cita' (recordatorios previos a fecha). */
function evaluarCondicionCita(
  condicion: ReglaCondicion,
  contexto: ContextoEvaluacion
): ResultadoEvaluacion {
  if (!condicion.fechaCita || !condicion.recordatoriosPrevios || condicion.recordatoriosPrevios.length === 0) {
    return { cumple: false };
  }
  
  const fechaCita = parseISO(condicion.fechaCita);
  const ahora = contexto.ahora;
  
  // Verificar cada offset de recordatorio
  for (const offsetMin of condicion.recordatoriosPrevios) {
    const fechaRecordatorio = addMinutes(fechaCita, -offsetMin);
    const diffMin = differenceInMinutes(ahora, fechaRecordatorio);
    
    // Ventana de 15 min para el recordatorio
    if (diffMin >= 0 && diffMin <= 15) {
      return {
        cumple: true,
        datosExtra: {
          minutosAntes: offsetMin,
          fechaCita: condicion.fechaCita,
        },
        // Próximo recordatorio (si hay más)
        proximaFecha: condicion.recordatoriosPrevios
          .filter((o: number) => o > offsetMin)
          .sort((a: number, b: number) => a - b)[0]
            ? addMinutes(fechaCita, -condicion.recordatoriosPrevios.filter((o: number) => o > offsetMin).sort((a: number, b: number) => a - b)[0])
            : undefined,
      };
    }
  }
  
  // Próximo recordatorio futuro
  const proximos = condicion.recordatoriosPrevios
    .map((o: number) => addMinutes(fechaCita, -o))
    .filter((f: Date) => isAfter(f, ahora))
    .sort((a: Date, b: Date) => a.getTime() - b.getTime());
  
  return {
    cumple: false,
    proximaFecha: proximos[0],
  };
}

/** Export principal: evalúa cualquier condición. */
export function evaluarCondicion(
  condicion: ReglaCondicion,
  contexto: ContextoEvaluacion
): ResultadoEvaluacion {
  // Tipo implícito por campos presentes (v1)
  if (condicion.tipoValor && condicion.operador && condicion.umbral !== undefined) {
    return evaluarCondicionSignosVitales(condicion, contexto);
  }
  
  if (condicion.fechaCita && condicion.recordatoriosPrevios) {
    return evaluarCondicionCita(condicion, contexto);
  }
  
  // Por defecto: temporal (medicacion/recordatorio)
  return evaluarCondicionTemporal(condicion, contexto);
}

/** Helper: genera próxima fecha de evaluación para job periódico. */
export function obtenerProximaEvaluacion(
  condicion: ReglaCondicion,
  desde: Date = new Date()
): Date | undefined {
  const ctx: ContextoEvaluacion = { ahora: desde, perfilId: '', tareas: [], registrosTarea: [], historialSignos: [] };
  const resultado = evaluarCondicion(condicion, ctx);
  return resultado.proximaFecha;
}