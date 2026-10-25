/**
 * Módulo Notificaciones - FASE 1
 * Exportaciones públicas del sistema de notificaciones.
 */

// Permisos
export {
  obtenerEstadoPermisos,
  solicitarPermisos,
  asegurarPermisos,
  abrirConfiguracionSistema,
  mostrarDialogoPermisos,
  configurarCanalAndroid,
} from './permisos';

// Push Token
export {
  obtenerPushTokenGuardado,
  guardarPushToken,
  borrarPushToken,
  registrarPushToken,
  verificarYActualizarToken,
  type PushTokenData,
} from './push-token';

// Programación
export {
  programarNotificacionLocal,
  programarAlertasBatch,
  cancelarNotificacion,
  cancelarNotificacionesDeAlerta,
  cancelarTodasLasNotificaciones,
  obtenerNotificacionesProgramadas,
  programarRecordatorioPrueba,
  type NotificacionProgramada,
} from './programar';

// Handlers
export {
  configurarHandlersNotificaciones,
  limpiarHandlersNotificaciones,
  configurarCategoriasAcciones,
  actualizarBadge,
  limpiarBadge,
} from './handlers';

// Sonidos
export {
  SONIDOS_POR_PRIORIDAD,
  obtenerCanalPorPrioridad,
  validarSonidos,
} from './sonidos';

// Coach Marks / Onboarding
export {
  inicializarNotificaciones,
  programarAlertasDelDia,
  ModalPermisosNotificaciones,
  useNotificaciones,
  notificacionesOnboardingCompleto,
} from './coach-marks';

// Programación de alertas (re-export from utils/alertas)
export {
  programarTodasLasAlertasDeHoy,
  programarAlertasDeHoy,
  reprogramarAlertasPerfil,
  programarAlertaIndividual,
  cancelarNotificacionesPerfil,
} from '@/utils/alertas/programar-alertas';