/**
 * Utilidades compartidas del motor de alertas.
 */

import type { ReglaCondicion, PrioridadAlerta } from '@/types';

/** Valida que una condición tenga los campos mínimos según su tipo. */
export function validarCondicion(condicion: ReglaCondicion): { valida: boolean; errores: string[] } {
  const errores: string[] = [];
  
  // Signos vitales
  if (condicion.tipoValor && condicion.operador && condicion.umbral !== undefined) {
    if (!['tension_sistolica', 'tension_diastolica', 'glucosa', 'temperatura', 'peso', 'saturacion'].includes(condicion.tipoValor)) {
      errores.push('tipoValor no válido');
    }
    if (!['>', '>=', '<', '<=', '=='].includes(condicion.operador)) {
      errores.push('operador no válido');
    }
    if (typeof condicion.umbral !== 'number') {
      errores.push('umbral debe ser número');
    }
    return { valida: errores.length === 0, errores };
  }
  
  // Cita
  if (condicion.fechaCita && condicion.recordatoriosPrevios) {
    if (!condicion.fechaCita.match(/^\d{4}-\d{2}-\d{2}$/)) {
      errores.push('fechaCita debe ser ISODate (YYYY-MM-DD)');
    }
    if (!Array.isArray(condicion.recordatoriosPrevios) || condicion.recordatoriosPrevios.length === 0) {
      errores.push('recordatoriosPrevios debe ser array no vacío');
    }
    return { valida: errores.length === 0, errores };
  }
  
  // Temporal (medicacion/recordatorio)
  if (condicion.hora) {
    const match = condicion.hora.match(/^(\d{2}):(\d{2})$/);
    if (!match) {
      errores.push('hora debe ser HH:MM (0-23)');
    } else {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      if (h < 0 || h > 23) errores.push('hora debe ser HH:MM (0-23)');
      if (m < 0 || m > 59) errores.push('minutos deben ser 0-59');
    }
  }
  if (condicion.horasEntreTomas !== undefined) {
    if (!Number.isInteger(condicion.horasEntreTomas) || condicion.horasEntreTomas < 1 || condicion.horasEntreTomas > 24) {
      errores.push('horasEntreTomas debe ser entero 1-24');
    }
  }
  if (condicion.diasSemana) {
    if (!Array.isArray(condicion.diasSemana) || condicion.diasSemana.some((d) => d < 1 || d > 7)) {
      errores.push('diasSemana debe ser array de 1-7 (1=Lunes)');
    }
  }
  
  return { valida: errores.length === 0, errores };
}

/** Valida acción de regla. */
export function validarAccion(accion: any): { valida: boolean; errores: string[] } {
  const errores: string[] = [];
  
  if (!accion.tituloPlantilla || typeof accion.tituloPlantilla !== 'string') {
    errores.push('tituloPlantilla requerido');
  }
  if (!accion.mensajePlantilla || typeof accion.mensajePlantilla !== 'string') {
    errores.push('mensajePlantilla requerido');
  }
  if (accion.prioridadAlerta && !['baja', 'media', 'alta', 'critica'].includes(accion.prioridadAlerta)) {
    errores.push('prioridadAlerta no válida');
  }
  if (accion.accion && accion.accion.tipo) {
    if (!['abrir_tarea', 'abrir_incidencia', 'llamar', 'url', 'registrar_valor'].includes(accion.accion.tipo)) {
      errores.push('accion.tipo no válido');
    }
  }
  
  return { valida: errores.length === 0, errores };
}

/** Valida configuración de escalado. */
export function validarEscalado(escalado: any): { valida: boolean; errores: string[] } {
  const errores: string[] = [];
  
  if (!escalado.niveles || !Array.isArray(escalado.niveles) || escalado.niveles.length === 0) {
    errores.push('niveles requerido (array no vacío)');
  } else {
    for (let i = 0; i < escalado.niveles.length; i++) {
      const nivel = escalado.niveles[i];
      if (nivel.orden !== i + 1) {
        errores.push(`nivel ${i + 1}: orden debe ser ${i + 1}`);
      }
      if (!['push_local', 'push_familia', 'sms', 'llamada', 'contacto_emergencia'].includes(nivel.tipo)) {
        errores.push(`nivel ${i + 1}: tipo no válido`);
      }
      if (!['familia', 'cuidador', 'contacto_emergencia', 'telefono_personalizado'].includes(nivel.destinatario)) {
        errores.push(`nivel ${i + 1}: destinatario no válido`);
      }
      if (nivel.destinatario === 'telefono_personalizado' && !nivel.telefono) {
        errores.push(`nivel ${i + 1}: telefono requerido para telefono_personalizado`);
      }
      if (typeof nivel.retrasoMinutos !== 'number' || nivel.retrasoMinutos < 0) {
        errores.push(`nivel ${i + 1}: retrasoMinutos debe ser número >= 0`);
      }
    }
  }
  
  if (typeof escalado.tiempoMaximoSinRespuesta !== 'number' || escalado.tiempoMaximoSinRespuesta < 1) {
    errores.push('tiempoMaximoSinRespuesta debe ser número >= 1');
  }
  
  return { valida: errores.length === 0, errores };
}

/** Convierte prioridad a número para ordenación (critica > alta > media > baja). */
export function prioridadANumero(p: PrioridadAlerta): number {
  switch (p) {
    case 'critica': return 4;
    case 'alta': return 3;
    case 'media': return 2;
    case 'baja': return 1;
  }
}

/** Formatea fecha para mostrar en UI (en UTC). */
export function formatearFechaAlerta(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return d.toLocaleString('es-ES', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Genera ID único para alertas/reglas. */
export function generarId(prefijo: string): string {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Determina si una alerta está en ventana de "no molestar" (horas en UTC). */
export function estaEnNoMolestar(
  fecha: Date,
  noMolestar: { activado: boolean; inicio: string; fin: string; permitirCriticas: boolean },
  prioridad: PrioridadAlerta
): boolean {
  if (!noMolestar.activado) return false;
  if (noMolestar.permitirCriticas && prioridad === 'critica') return false;
  
  const [inicioH, inicioM] = noMolestar.inicio.split(':').map(Number);
  const [finH, finM] = noMolestar.fin.split(':').map(Number);
  
  const inicioMin = inicioH * 60 + inicioM;
  const finMin = finH * 60 + finM;
  const ahoraMin = fecha.getUTCHours() * 60 + fecha.getUTCMinutes();
  
  if (inicioMin <= finMin) {
    // Mismo día (ej. 08:00 - 22:00)
    return ahoraMin >= inicioMin && ahoraMin < finMin;
  } else {
    // Cruza medianoche (ej. 22:00 - 08:00)
    return ahoraMin >= inicioMin || ahoraMin < finMin;
  }
}