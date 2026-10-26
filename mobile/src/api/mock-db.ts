import { useDataStore } from '@/store/data-store';
import { calcularAdherencia, periodoSemana } from '@/utils/adherencia';
import { fechaHoy } from '@/utils/format';
import * as mocks from './mocks';
import type {
  Familia as FamiliaType,
  PerfilCuidado,
  PerfilNuevo,
  Cuidador as CuidadorType,
  CandidatoComparado,
  ConfigCuidador as ConfigCuidadorType,
  Tarea as TareaType,
  RegistroTarea as RegistroTareaType,
  Incidencia as IncidenciaType,
  ServicioComplementario,
  Informe,
  AlertaMedica,
  ReglaAlerta,
  ConfigNotificaciones,
  TipoAlerta,
  PrioridadAlerta,
  AccionAlerta,
} from '@/types';

const demora = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const modoDemo = async <T>(valor: T): Promise<T> => {
  await demora();
  return valor;
};

// --- Estado local para alertas, reglas y config notificaciones (demo) ---
let alertasDemo: AlertaMedica[] = [];
let reglasDemo: ReglaAlerta[] = [];
let configNotificacionesDemo: ConfigNotificaciones = {
  pushHabilitado: true,
  sonidoHabilitado: true,
  vibracionHabilitada: true,
  sonidoPorPrioridad: {
    baja: 'notification_low.wav',
    media: 'notification_medium.wav',
    alta: 'notification_high.wav',
    critica: 'notification_critical.wav',
  },
  noMolestar: {
    activado: false,
    inicio: '22:00',
    fin: '08:00',
    permitirCriticas: true,
  },
  porPerfil: {},
};

function idUnico(prefijo: string): string {
  return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

const ahoraISO = (): string => new Date().toISOString();

/**
 * Helpers que leen/escriben directamente en el store de Zustand (useDataStore).
 * Esto mantiene compatibilidad con tests y modo demo mientras WatermelonDB
 * se inicializa en segundo plano.
 */

// --- Familia ---
export async function getFamilia() {
  return useDataStore.getState().familia;
}

// --- Perfiles ---
export async function getPerfiles() {
  return useDataStore.getState().perfiles;
}

export async function perfilPorId(id: string) {
  const perfiles = useDataStore.getState().perfiles;
  return perfiles.find((p: any) => p.id === id);
}

// --- Cuidadores ---
export async function getCuidadores() {
  return mocks.cuidadoresDemo;
}

// --- Candidaturas ---
export async function getCandidatos() {
  return useDataStore.getState().candidatos;
}

// --- Config Cuidador ---
export async function getConfigsCuidador() {
  return useDataStore.getState().configsCuidador;
}

export async function obtenerConfigCuidador(perfilId: string) {
  return useDataStore.getState().configsCuidador[perfilId];
}

// --- Tareas ---
export async function getTareas() {
  return useDataStore.getState().tareas;
}

export async function listarTareas(perfilId: string) {
  const tareas = useDataStore.getState().tareas;
  return tareas.filter((t: any) => t.perfilId === perfilId);
}

export async function agregarTarea(tarea: any) {
  return useDataStore.getState().agregarTarea(tarea);
}

export async function eliminarTarea(id: string) {
  useDataStore.getState().eliminarTarea(id);
}

// --- Registros ---
export async function getRegistros() {
  return useDataStore.getState().registros;
}

export async function listarRegistros(perfilId: string, fecha: string) {
  const { tareas, registros } = useDataStore.getState();
  const tareaIds = tareas
    .filter((t: any) => t.perfilId === perfilId)
    .map((t: any) => t.id);
  return registros.filter((r: any) => tareaIds.includes(r.tareaId) && r.fecha === fecha);
}

export async function agregarRegistro(registro: any) {
  return useDataStore.getState().agregarRegistro(registro);
}

// --- Incidencias ---
export async function getIncidencias() {
  return useDataStore.getState().incidencias;
}

export async function listarIncidencias(perfilId: string) {
  const incidencias = useDataStore.getState().incidencias;
  return incidencias.filter((i: any) => i.perfilId === perfilId);
}

export async function resolverIncidencia(incidenciaId: string, resolucion: string) {
  useDataStore.getState().resolverIncidencia(incidenciaId, resolucion);
}

// --- Servicios ---
export async function getServicios() {
  return useDataStore.getState().servicios;
}

export async function contratarServicio(id: string) {
  useDataStore.getState().contratarServicio(id);
}

// --- Historial ---
export async function getHistorial() {
  return useDataStore.getState().historial;
}

// --- Ajustes ---
export async function getPerfilActivoId() {
  return useDataStore.getState().perfilActivoId;
}

export async function setPerfilActivoId(id: string) {
  useDataStore.getState().establecerPerfilActivo(id);
}

// --- Mutaciones Perfiles ---
export async function setFamilia(familia: any) {
  useDataStore.getState().actualizarFamilia(familia);
}

export async function agregarPerfil(perfil: any) {
  return useDataStore.getState().agregarPerfil(perfil);
}

export async function actualizarPerfil(id: string, cambios: any) {
  useDataStore.getState().actualizarPerfil(id, cambios);
}

export async function eliminarPerfil(id: string) {
  useDataStore.getState().eliminarPerfil(id);
}

export async function recibirCandidaturas(perfilId: string, candidaturas: any[]) {
  useDataStore.getState().recibirCandidaturas(perfilId, candidaturas);
}

export async function seleccionarCandidatoEnPerfil(candidaturaId: string) {
  useDataStore.getState().seleccionarCandidatoEnPerfil(candidaturaId);
}

export async function setConfigCuidador(config: any) {
  useDataStore.getState().setConfigCuidador(config);
}

export async function obtenerInforme(perfilId: string): Promise<Informe> {
  const { incidencias, registros, tareas, candidatos } = useDataStore.getState();
  const perfilIncidencias = incidencias.filter((i: any) => i.perfilId === perfilId);
  const perfilTareas = tareas.filter((t: any) => t.perfilId === perfilId);
  const tareaIds = perfilTareas.map((t: any) => t.id);
  const perfilRegistros = registros.filter((r: any) => tareaIds.includes(r.tareaId));

  // Find selected cuidador for this perfil to get their valoracion
  const seleccionada = candidatos.find(
    (c: any) => c.candidatura.perfilId === perfilId && c.candidatura.estado === 'seleccionada'
  );
  const valoracion = seleccionada?.cuidador?.valoracion;

  const semanaActual = periodoSemana();
  const adherenciaActual = calcularAdherencia(
    perfilTareas,
    perfilRegistros,
    semanaActual.desde,
    semanaActual.hasta,
  );

  return {
    perfilId,
    periodo: semanaActual,
    tareasRealizadas: adherenciaActual.realizadas,
    tareasTotales: adherenciaActual.programadas,
    incidencias: perfilIncidencias,
    valoracion,
    adherencia: adherenciaActual.porTarea.map((t: any) => ({
      tareaId: t.tareaId,
      nombre: t.nombre,
      realizadas: t.realizadas,
      programadas: t.programadas,
    })),
  };
}

// --- Alertas médicas ---
export async function getAlertas(perfilId?: string) {
  let resultado = alertasDemo;
  if (perfilId) {
    resultado = resultado.filter((a) => a.perfilId === perfilId);
  }
  return [...resultado].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
}

export async function getAlertaPorId(id: string) {
  return alertasDemo.find((a) => a.id === id);
}

export async function crearAlerta(alerta: Omit<AlertaMedica, 'id' | 'creadaEn'>) {
  const nueva: AlertaMedica = {
    ...alerta,
    id: idUnico('alt'),
    creadaEn: ahoraISO(),
  };
  alertasDemo.unshift(nueva);
  return nueva;
}

export async function actualizarAlerta(id: string, cambios: Partial<AlertaMedica>) {
  const idx = alertasDemo.findIndex((a) => a.id === id);
  if (idx >= 0) {
    alertasDemo[idx] = { ...alertasDemo[idx], ...cambios };
    return alertasDemo[idx];
  }
  return null;
}

export async function marcarAlertaLeida(id: string) {
  return actualizarAlerta(id, { leida: true, leidaEn: ahoraISO() });
}

export async function descartarAlerta(id: string) {
  return actualizarAlerta(id, { descartada: true });
}

export async function eliminarAlertasDeRegla(reglaId: string) {
  alertasDemo = alertasDemo.filter((a) => a.reglaId !== reglaId);
}

// --- Reglas de alerta ---
export async function getReglas(perfilId: string) {
  return reglasDemo.filter((r) => r.perfilId === perfilId);
}

export async function getReglaPorId(id: string) {
  return reglasDemo.find((r) => r.id === id);
}

export async function crearRegla(regla: Omit<ReglaAlerta, 'id' | 'creadaEn' | 'actualizadaEn' | 'vecesEjecutada'>) {
  const nueva: ReglaAlerta = {
    ...regla,
    id: idUnico('rgl'),
    creadaEn: ahoraISO(),
    actualizadaEn: ahoraISO(),
    vecesEjecutada: 0,
  };
  reglasDemo.unshift(nueva);
  return nueva;
}

export async function actualizarRegla(id: string, cambios: Partial<ReglaAlerta>) {
  const idx = reglasDemo.findIndex((r) => r.id === id);
  if (idx >= 0) {
    reglasDemo[idx] = { ...reglasDemo[idx], ...cambios, actualizadaEn: ahoraISO() };
    return reglasDemo[idx];
  }
  return null;
}

export async function eliminarRegla(id: string) {
  const idx = reglasDemo.findIndex((r) => r.id === id);
  if (idx >= 0) {
    reglasDemo.splice(idx, 1);
    await eliminarAlertasDeRegla(id);
    return true;
  }
  return false;
}

export async function activarRegla(id: string, activa: boolean) {
  return actualizarRegla(id, { activa });
}

// --- Configuración notificaciones ---
export async function getConfigNotificaciones() {
  return configNotificacionesDemo;
}

export async function setConfigNotificaciones(config: Partial<ConfigNotificaciones>) {
  configNotificacionesDemo = { ...configNotificacionesDemo, ...config };
  return configNotificacionesDemo;
}

export async function getConfigNotificacionesPerfil(perfilId: string) {
  return configNotificacionesDemo.porPerfil[perfilId] || {};
}

export async function setConfigNotificacionesPerfil(perfilId: string, config: Partial<ConfigNotificaciones['porPerfil'][string]>) {
  configNotificacionesDemo.porPerfil[perfilId] = {
    ...configNotificacionesDemo.porPerfil[perfilId],
    ...config,
  };
  return configNotificacionesDemo.porPerfil[perfilId];
}

// Helper functions
export async function getMockStore() {
  const state = useDataStore.getState();
  return {
    // Estado
    familia: state.familia,
    perfiles: state.perfiles,
    candidatos: state.candidatos,
    configsCuidador: state.configsCuidador,
    tareas: state.tareas,
    registros: state.registros,
    incidencias: state.incidencias,
    servicios: state.servicios,
    historial: state.historial,
    perfilActivoId: state.perfilActivoId,
    alertas: alertasDemo,
    reglas: reglasDemo,
    configNotificaciones: configNotificacionesDemo,
    // Métodos
    obtenerConfigCuidador,
    setConfigCuidador,
    listarTareas,
    agregarTarea,
    eliminarTarea,
    listarRegistros,
    agregarRegistro,
    listarIncidencias,
    resolverIncidencia,
    contratarServicio,
    obtenerInforme,
    setPerfilActivoId,
    actualizarFamilia: state.actualizarFamilia,
    agregarPerfil: state.agregarPerfil,
    actualizarPerfil: state.actualizarPerfil,
    eliminarPerfil: state.eliminarPerfil,
    recibirCandidaturas: state.recibirCandidaturas,
    seleccionarCandidatoEnPerfil: state.seleccionarCandidatoEnPerfil,
    publicarPerfil: state.publicarPerfil,
    setTareas: state.setTareas,
    setRegistros: state.setRegistros,
    setIncidencias: state.setIncidencias,
    setServicios: state.setServicios,
    setHistorial: state.setHistorial,
    establecerPerfilActivo: state.establecerPerfilActivo,
    reiniciarDemo: state.reiniciarDemo,
    // Nuevos métodos Fase 1
    getAlertas,
    getAlertaPorId,
    crearAlerta,
    actualizarAlerta,
    marcarAlertaLeida,
    descartarAlerta,
    getReglas,
    getReglaPorId,
    crearRegla,
    actualizarRegla,
    eliminarRegla,
    activarRegla,
    getConfigNotificaciones,
    setConfigNotificaciones,
    getConfigNotificacionesPerfil,
    setConfigNotificacionesPerfil,
  };
}

export async function obtenerStore() {
  return getMockStore();
}

export { demora, modoDemo };