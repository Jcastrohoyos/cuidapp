/**
 * Módulo Alertas - FASE 1
 * Exportaciones públicas del motor de reglas y utilidades.
 */

// Tipos internos
export type {
  ContextoEvaluacion,
  ResultadoEvaluacion,
  AlertaGenerada,
  ReglaResuelta,
  EstadoEscalado,
  OpcionesProgramacion,
} from './tipos';

// Motor principal
export {
  evaluarTodasLasReglas,
  persistirAlertas,
  actualizarProximaEjecucionRegla,
  procesarReglasPerfil,
  procesarTodasLasReglas,
  cancelarAlertasDeRegla,
  obtenerAlertasPendientes,
  obtenerReglasActivas,
} from './motor-reglas';

// Evaluador de condiciones (lógica pura)
export { evaluarCondicion, obtenerProximaEvaluacion } from './evaluar-condicion';

// Escalado
export {
  iniciarEscalado,
  enviarNivelEscalado,
  cancelarEscalado,
  jobProcesarEscaladosPendientes,
  type EstadoEscaladoInterno,
  type EnvioEscalado,
} from './escalado';

// Programación de alertas para notificaciones
export {
  programarAlertasDeHoy,
  programarTodasLasAlertasDeHoy,
  reprogramarAlertasPerfil,
  programarAlertaIndividual,
  cancelarNotificacionesPerfil,
} from './programar-alertas';

// Helpers y validadores
export {
  validarCondicion,
  validarAccion,
  validarEscalado,
  prioridadANumero,
  formatearFechaAlerta,
  generarId,
  estaEnNoMolestar,
} from './helpers';