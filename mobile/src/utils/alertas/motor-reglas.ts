/**
 * Motor de Reglas de Alertas (FASE 1).
 * Orquesta: evaluar reglas → crear alertas → programar notificaciones.
 * 
 * Diseñado para ser llamado:
 * - Job periódico (cada 5-15 min) para reglas temporales
 * - Tras cada registro de signos vitales (para reglas de umbral)
 * - Al crear/actualizar una regla (programar siguiente)
 */

import { getDatabase } from '@/db';
import { evaluarCondicion, type ContextoEvaluacion, type AlertaGenerada, type ReglaResuelta } from './index';
import type { AlertaMedica, ReglaAlerta, ConfigEscalado, ReglaCondicion, PrioridadAlerta } from '@/types';
import { fechaHoy } from '@/utils/format';

/** Convierte regla de BD a estructura interna. */
function reglaToResuelta(r: any): ReglaResuelta {
  return {
    id: r.id,
    perfilId: r.perfilId,
    nombre: r.nombre,
    tipo: r.tipo,
    condicion: r.condicion,
    accion: r.accion,
    escalado: r.escalado,
    activa: r.activa,
  };
}

/** Construye contexto de evaluación para un perfil. */
async function construirContexto(perfilId: string): Promise<ContextoEvaluacion> {
  const db = getDatabase();
  
  const [tareas, registrosTarea, historial] = await Promise.all([
    db.get('tareas').query().fetch(),
    db.get('registros_tarea').query().fetch(),
    db.get('historial').query().fetch(),
  ]);
  
  return {
    ahora: new Date(),
    perfilId,
    tareas: tareas.map((t: any) => ({
      id: t.id,
      perfilId: t.perfilId,
      nombre: t.nombre,
      momento: t.momento,
      hora: t.hora,
      responsableId: t.responsableId,
      personalizada: t.personalizada,
      repeticion: t.repeticion,
      fechaAplicacion: t.fechaAplicacion,
    })),
    registrosTarea: registrosTarea.map((r: any) => ({
      id: r.id,
      tareaId: r.tareaId,
      fecha: r.fecha,
      estado: r.estado,
      responsableId: r.responsableId,
      nota: r.nota,
    })),
    historialSignos: historial
      .filter((h: any) => h.perfilId === perfilId)
      .map((h: any) => ({
        id: h.id,
        perfilId: h.perfilId,
        categoria: h.categoria,
        fecha: h.fecha,
        resumen: h.resumen,
        valor: h.valor,
        unidad: h.unidad,
        responsableId: h.responsableId,
      })),
  };
}

/** Genera alerta a partir de regla y resultado de evaluación. */
function generarAlerta(
  regla: ReglaResuelta,
  resultado: { cumple: boolean; proximaFecha?: Date; datosExtra?: Record<string, any> },
  ahora: Date
): AlertaGenerada | null {
  if (!resultado.cumple) return null;
  
  const { accion } = regla;
  const titulo = interpolarPlantilla(accion.tituloPlantilla, resultado.datosExtra, regla);
  const mensaje = interpolarPlantilla(accion.mensajePlantilla, resultado.datosExtra, regla);
  
  // Prioridad de la regla, o 'media' por defecto
  const prioridad: PrioridadAlerta = accion.prioridadAlerta || 'media';
  
  return {
    perfilId: regla.perfilId,
    tipo: regla.tipo as AlertaGenerada['tipo'],
    prioridad,
    titulo,
    mensaje,
    fechaHora: ahora, // Disparar ya (el programador ajustará si es futuro)
    accion: accion.accion,
    reglaId: regla.id,
    datosExtra: resultado.datosExtra,
  };
}

/** Interpola plantillas tipo "Hora de {medicamento}" con datos. */
function interpolarPlantilla(
  plantilla: string,
  datos?: Record<string, any>,
  regla?: ReglaResuelta
): string {
  if (!plantilla) return '';
  
  let resultado = plantilla;
  
  // Datos de la evaluación
  if (datos) {
    for (const [key, value] of Object.entries(datos)) {
      resultado = resultado.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }
  
  // Datos de la regla (condición)
  if (regla?.condicion) {
    const cond = regla.condicion;
    if (cond.hora) resultado = resultado.replace(/\{hora\}/g, cond.hora);
    if (cond.horasEntreTomas) resultado = resultado.replace(/\{horasEntreTomas\}/g, String(cond.horasEntreTomas));
    if (cond.tipoValor) resultado = resultado.replace(/\{tipoValor\}/g, cond.tipoValor);
    if (cond.umbral !== undefined) resultado = resultado.replace(/\{umbral\}/g, String(cond.umbral));
    if (cond.operador) resultado = resultado.replace(/\{operador\}/g, cond.operador);
  }
  
  // Nombre de la regla
  if (regla?.nombre) resultado = resultado.replace(/\{nombreRegla\}/g, regla.nombre);
  
  return resultado;
}

/** Obtiene reglas activas de un perfil. */
export async function obtenerReglasActivas(perfilId: string): Promise<ReglaResuelta[]> {
  const db = getDatabase();
  const reglas = await db.get('reglas_alerta')
    .query()
    .where('perfil_id', perfilId)
    .where('activa', true)
    .fetch();
  
  return reglas.map(reglaToResuelta);
}

/** Evalúa todas las reglas de un perfil y genera alertas. */
export async function evaluarTodasLasReglas(perfilId: string): Promise<AlertaGenerada[]> {
  const reglas = await obtenerReglasActivas(perfilId);
  if (reglas.length === 0) return [];
  
  const contexto = await construirContexto(perfilId);
  const alertas: AlertaGenerada[] = [];
  
  for (const regla of reglas) {
    const resultado = evaluarCondicion(regla.condicion, contexto);
    const alerta = generarAlerta(regla, resultado, contexto.ahora);
    if (alerta) {
      alertas.push(alerta);
    }
  }
  
  return alertas;
}

/** Persiste alertas generadas en WatermelonDB. */
export async function persistirAlertas(alertas: AlertaGenerada[]): Promise<string[]> {
  if (alertas.length === 0) return [];
  
  const db = getDatabase();
  const ids: string[] = [];
  
  await db.action(async () => {
    for (const alerta of alertas) {
      // Evitar duplicados: misma regla + misma fechaHora (ventana 5 min)
      const existentes = await db.get('alertas')
        .query()
        .where('regla_id', alerta.reglaId)
        .fetch();
      
      const yaExiste = existentes.some((e: any) => {
        const diff = Math.abs(new Date(e.fechaHora).getTime() - alerta.fechaHora.getTime());
        return diff < 5 * 60 * 1000; // 5 min
      });
      
      if (yaExiste) continue;
      
      const creada = await db.get('alertas').create((a: any) => {
        a.perfilId = alerta.perfilId;
        a.tipo = alerta.tipo;
        a.prioridad = alerta.prioridad;
        a.titulo = alerta.titulo;
        a.mensaje = alerta.mensaje;
        a.fechaHora = alerta.fechaHora.getTime();
        a.leida = false;
        a.descartada = false;
        a.accion = alerta.accion || null;
        a.reglaId = alerta.reglaId;
        a.escalada = false;
        a.nivelEscaladoActual = 0;
      });
      ids.push(creada.id);
    }
  });
  
  return ids;
}

/** Actualiza próxima ejecución de una regla. */
export async function actualizarProximaEjecucionRegla(
  reglaId: string,
  proximaFecha: Date | undefined
): Promise<void> {
  const db = getDatabase();
  const regla = await db.get('reglas_alerta').findById(reglaId);
  
  await db.action(async () => {
    await regla.update((r: any) => {
      r.proximaEjecucion = proximaFecha?.getTime() ?? null;
      r.ultimaEjecucion = new Date().getTime();
      r.vecesEjecutada = (r.vecesEjecutada ?? 0) + 1;
    });
  });
}

/** Pipeline completo: evaluar → persistir → actualizar regla. */
export async function procesarReglasPerfil(perfilId: string): Promise<{ alertasCreadas: number; errores: string[] }> {
  const errores: string[] = [];
  
  try {
    const alertas = await evaluarTodasLasReglas(perfilId);
    const ids = await persistirAlertas(alertas);
    
    // Actualizar próxima ejecución de reglas que generaron alerta
    const reglas = await obtenerReglasActivas(perfilId);
    for (const regla of reglas) {
      const contexto = await construirContexto(perfilId);
      const resultado = evaluarCondicion(regla.condicion, contexto);
      await actualizarProximaEjecucionRegla(regla.id, resultado.proximaFecha);
    }
    
    return { alertasCreadas: ids.length, errores };
  } catch (e) {
    errores.push(`Error procesando reglas perfil ${perfilId}: ${e}`);
    return { alertasCreadas: 0, errores };
  }
}

/** Procesa reglas de TODOS los perfiles (job periódico). */
export async function procesarTodasLasReglas(): Promise<{ totalAlertas: number; perfilesProcesados: number; errores: string[] }> {
  const db = getDatabase();
  const perfiles = await db.get('perfiles').query().fetch();
  const errores: string[] = [];
  let totalAlertas = 0;
  
  for (const perfil of perfiles) {
    if (perfil.estado === 'con_cuidador' || perfil.estado === 'en_seleccion') {
      const resultado = await procesarReglasPerfil(perfil.id);
      totalAlertas += resultado.alertasCreadas;
      errores.push(...resultado.errores);
    }
  }
  
  return { totalAlertas, perfilesProcesados: perfiles.length, errores };
}

/** Cancela alertas pendientes de una regla (al desactivar/eliminar). */
export async function cancelarAlertasDeRegla(reglaId: string): Promise<number> {
  const db = getDatabase();
  const alertas = await db.get('alertas')
    .query()
    .where('regla_id', reglaId)
    .where('leida', false)
    .where('descartada', false)
    .fetch();
  
  let canceladas = 0;
  await db.action(async () => {
    for (const a of alertas) {
      await a.update((r: any) => {
        r.descartada = true;
      });
      canceladas++;
    }
  });
  
  return canceladas;
}

/** Obtiene alertas pendientes de un perfil (para UI). */
export async function obtenerAlertasPendientes(perfilId: string, limite = 50): Promise<AlertaMedica[]> {
  const db = getDatabase();
  const alertas = await db.get('alertas')
    .query()
    .where('perfil_id', perfilId)
    .where('leida', false)
    .where('descartada', false)
    .fetch();
  
  return alertas
    .sort((a: any, b: any) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
    .slice(0, limite)
    .map((a: any) => ({
      id: a.id,
      perfilId: a.perfilId,
      tipo: a.tipo,
      prioridad: a.prioridad,
      titulo: a.titulo,
      mensaje: a.mensaje,
      fechaHora: new Date(a.fechaHora).toISOString(),
      leida: a.leida,
      descartada: a.descartada,
      accion: a.accion,
      reglaId: a.reglaId,
      creadaEn: a.createdAt.toISOString(),
      leidaEn: a.leidaEn?.toISOString(),
      escalada: a.escalada,
      nivelEscaladoActual: a.nivelEscaladoActual,
    }));
}