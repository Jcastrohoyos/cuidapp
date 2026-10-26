/**
 * Motor de Reglas de Alertas (FASE 1).
 * Orquesta: evaluar reglas → crear alertas → programar notificaciones.
 * 
 * Diseñado para ser llamado:
 * - Job periódico (cada 5-15 min) para reglas temporales
 * - Tras cada registro de signos vitales (para reglas de umbral)
 * - Al crear/actualizar una regla (programar siguiente)
 */

import { queryWithParams, run, insert } from '@/db';
import { evaluarCondicion, type ContextoEvaluacion, type AlertaGenerada, type ReglaResuelta } from './index';
import type { AlertaMedica, ReglaAlerta, ConfigEscalado, ReglaCondicion, PrioridadAlerta } from '@/types';
import { fechaHoy } from '@/utils/format';

/** Convierte regla de BD a estructura interna. */
function reglaToResuelta(r: any): ReglaResuelta {
  return {
    id: r.id,
    perfilId: r.perfil_id,
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
  const [tareas, registrosTarea, historial] = await Promise.all([
    queryWithParams('SELECT * FROM tareas WHERE perfil_id = ?', [perfilId]),
    queryWithParams('SELECT * FROM registros_tarea WHERE perfil_id = ?', [perfilId]),
    queryWithParams('SELECT * FROM historial WHERE perfil_id = ?', [perfilId]),
  ]);

  return {
    ahora: new Date(),
    perfilId,
    tareas: tareas.map((t: any) => ({
      id: t.id,
      perfilId: t.perfil_id,
      nombre: t.nombre,
      momento: t.momento,
      hora: t.hora,
      responsableId: t.responsable_id,
      personalizada: t.personalizada,
      repeticion: t.repeticion,
      fechaAplicacion: t.fecha_aplicacion,
    })),
    registrosTarea: registrosTarea.map((r: any) => ({
      id: r.id,
      tareaId: r.tarea_id,
      fecha: r.fecha,
      estado: r.estado,
      responsableId: r.responsable_id,
      nota: r.nota,
    })),
    historialSignos: historial.map((h: any) => ({
      id: h.id,
      perfilId: h.perfil_id,
      categoria: h.categoria,
      fecha: h.fecha,
      resumen: h.resumen,
      valor: h.valor,
      unidad: h.unidad,
      responsableId: h.responsable_id,
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

  const prioridad: PrioridadAlerta = accion.prioridadAlerta || 'media';

  return {
    perfilId: regla.perfilId,
    tipo: regla.tipo as AlertaGenerada['tipo'],
    prioridad,
    titulo,
    mensaje,
    fechaHora: ahora,
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

  if (datos) {
    for (const [key, value] of Object.entries(datos)) {
      resultado = resultado.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  }

  if (regla?.condicion) {
    const cond = regla.condicion;
    if (cond.hora) resultado = resultado.replace(/\{hora\}/g, cond.hora);
    if (cond.horasEntreTomas) resultado = resultado.replace(/\{horasEntreTomas\}/g, String(cond.horasEntreTomas));
    if (cond.tipoValor) resultado = resultado.replace(/\{tipoValor\}/g, cond.tipoValor);
    if (cond.umbral !== undefined) resultado = resultado.replace(/\{umbral\}/g, String(cond.umbral));
    if (cond.operador) resultado = resultado.replace(/\{operador\}/g, cond.operador);
  }

  if (regla?.nombre) resultado = resultado.replace(/\{nombreRegla\}/g, regla.nombre);

  return resultado;
}

/** Obtiene reglas activas de un perfil. */
export async function obtenerReglasActivas(perfilId: string): Promise<ReglaResuelta[]> {
  const reglas = await queryWithParams(
    'SELECT * FROM reglas_alerta WHERE perfil_id = ? AND activa = 1',
    [perfilId]
  );
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

/** Persiste alertas generadas en SQLite. */
export async function persistirAlertas(alertas: AlertaGenerada[]): Promise<string[]> {
  if (alertas.length === 0) return [];

  const ids: string[] = [];

  for (const alerta of alertas) {
    const existentes = await queryWithParams(
      'SELECT * FROM alertas WHERE regla_id = ?',
      [alerta.reglaId]
    );

    const yaExiste = existentes.some((e: any) => {
      const diff = Math.abs(new Date(e.fecha_hora).getTime() - alerta.fechaHora.getTime());
      return diff < 5 * 60 * 1000;
    });

    if (yaExiste) continue;

    const id = await insert(
      `INSERT INTO alertas (
        id, perfil_id, tipo, prioridad, titulo, mensaje, fecha_hora, 
        leida, descartada, accion, regla_id, escalada, nivel_escalado_actual, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alerta.reglaId + '_' + Date.now(), // ID temporal generado
        alerta.perfilId,
        alerta.tipo,
        alerta.prioridad,
        alerta.titulo,
        alerta.mensaje,
        alerta.fechaHora.getTime(),
        0, // leida
        0, // descartada
        alerta.accion || null,
        alerta.reglaId,
        0, // escalada
        0, // nivel_escalado_actual
        Date.now(),
        Date.now(),
      ]
    );
    ids.push(String(id));
  }

  return ids;
}

/** Actualiza próxima ejecución de una regla. */
export async function actualizarProximaEjecucionRegla(
  reglaId: string,
  proximaFecha: Date | undefined
): Promise<void> {
  const ahora = new Date().getTime();
  await run(
    `UPDATE reglas_alerta 
     SET proxima_ejecucion = ?, ultima_ejecucion = ?, veces_ejecutada = veces_ejecutada + 1 
     WHERE id = ?`,
    [proximaFecha?.getTime() ?? null, ahora, reglaId]
  );
}

/** Pipeline completo: evaluar → persistir → actualizar regla. */
export async function procesarReglasPerfil(perfilId: string): Promise<{ alertasCreadas: number; errores: string[] }> {
  const errores: string[] = [];

  try {
    const alertas = await evaluarTodasLasReglas(perfilId);
    const ids = await persistirAlertas(alertas);

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
  const perfiles = await queryWithParams("SELECT * FROM perfiles WHERE estado IN ('con_cuidador', 'en_seleccion')");
  const errores: string[] = [];
  let totalAlertas = 0;

  for (const perfil of perfiles) {
    const resultado = await procesarReglasPerfil(perfil.id);
    totalAlertas += resultado.alertasCreadas;
    errores.push(...resultado.errores);
  }

  return { totalAlertas, perfilesProcesados: perfiles.length, errores };
}

/** Cancela alertas pendientes de una regla (al desactivar/eliminar). */
export async function cancelarAlertasDeRegla(reglaId: string): Promise<number> {
  const alertas = await queryWithParams(
    `SELECT * FROM alertas 
     WHERE regla_id = ? 
       AND leida = 0 
       AND descartada = 0`,
    [reglaId]
  );

  let canceladas = 0;
  for (const a of alertas) {
    await run('UPDATE alertas SET descartada = 1 WHERE id = ?', [a.id]);
    canceladas++;
  }

  return canceladas;
}

/** Obtiene alertas pendientes de un perfil (para UI). */
export async function obtenerAlertasPendientes(perfilId: string, limite = 50): Promise<AlertaMedica[]> {
  const alertas = await queryWithParams(
    `SELECT * FROM alertas 
     WHERE perfil_id = ? 
       AND leida = 0 
       AND descartada = 0 
     ORDER BY fecha_hora DESC 
     LIMIT ?`,
    [perfilId, limite]
  );

  return alertas.map((a: any) => ({
    id: a.id,
    perfilId: a.perfil_id,
    tipo: a.tipo,
    prioridad: a.prioridad,
    titulo: a.titulo,
    mensaje: a.mensaje,
    fechaHora: new Date(a.fecha_hora).toISOString(),
    leida: a.leida,
    descartada: a.descartada,
    accion: a.accion,
    reglaId: a.regla_id,
    creadaEn: a.created_at ? new Date(a.created_at).toISOString() : undefined,
    leidaEn: a.leida_en ? new Date(a.leida_en).toISOString() : undefined,
    escalada: a.escalada,
    nivelEscaladoActual: a.nivel_escalado_actual,
  }));
}
