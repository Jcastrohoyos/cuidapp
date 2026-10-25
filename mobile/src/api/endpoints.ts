/**
 * Endpoints de Cuidapp organizados por dominio.
 * Si no hay API configurada (EXPO_PUBLIC_API_URL vacío) se sirven datos de
 * demostración desde el data-store local (persistido en AsyncStorage), así
 * los cambios de la familia sobreviven al recargo de la app.
 */

import { api, ApiError, USAR_MOCKS } from './client';
import * as mocks from './mocks';
import { getMockStore, demora, modoDemo, perfilPorId } from './mock-db';
import { calcularAdherencia, periodoSemana } from '@/utils/adherencia';
import { fechaHoy } from '@/utils/format';
import type {
  CandidatoComparado,
  ConfigCuidador,
  Cuidador,
  Familia,
  Incidencia,
  Informe,
  PerfilCuidado,
  PerfilNuevo,
  RegistroHistorial,
  RegistroTarea,
  ServicioComplementario,
  Sesion,
  Tarea,
  AlertaMedica,
  ReglaAlerta,
  ConfigNotificaciones,
  ConfigEscalado,
  NivelEscalado,
  PrioridadAlerta,
} from '@/types';

const perfilPorIdHelper = async (id: string): Promise<PerfilCuidado | undefined> => {
  return perfilPorId(id);
};

export const endpoints = {
  /* ---- Sesión ---- */
  iniciarSesion: async (email: string, _contrasena: string): Promise<Sesion> => {
    if (USAR_MOCKS) {
      // El alta de demo acepta cualquier correo: la cuenta que muestra la app
      // es la con la que se ha entrado, no la de ejemplo.
      const correo = email.trim().toLowerCase();
      return modoDemo({
        ...mocks.sesionDemo,
        familia: {
          ...mocks.familiaDemo,
          id: `fam_${correo}`,
          nombre: nombreDeCuenta(correo),
          email: correo,
        },
      });
    }
    return api.post<Sesion>('/auth/login', { email, contrasena: _contrasena }, false);
  },

  registrar: async (datos: { nombre: string; email: string; contrasena: string }): Promise<Sesion> => {
    if (USAR_MOCKS) {
      const correo = datos.email.trim().toLowerCase();
      return modoDemo({
        ...mocks.sesionDemo,
        // La contraseña no se persiste en el store de demo: solo viaja al API.
        familia: {
          ...mocks.familiaDemo,
          id: `fam_${correo}`,
          nombre: datos.nombre,
          email: correo,
          plan: 'gratuito',
        },
      });
    }
    return api.post<Sesion>('/auth/registro', datos, false);
  },

  obtenerFamilia: async (): Promise<Familia> => {
    // En demo el almacén local es la fuente de verdad: al restaurar la
    // sesión no se pisa la cuenta con la que se entró.
    if (USAR_MOCKS) {
      const familia = (await getStore()).familia;
      return modoDemo(familia);
    }
    return api.get<Familia>('/familia');
  },

  /* ---- Perfiles de cuidado ---- */
  listarPerfiles: async (): Promise<PerfilCuidado[]> => {
    if (USAR_MOCKS) {
      const perfiles = (await getStore()).perfiles;
      return modoDemo(perfiles);
    }
    return api.get<PerfilCuidado[]>('/perfiles');
  },

  obtenerPerfil: async (id: string): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      const p = await perfilPorIdHelper(id);
      if (!p) throw new ApiError(404, `Perfil ${id} no encontrado`);
      return modoDemo(p);
    }
    return api.get<PerfilCuidado>(`/perfiles/${id}`);
  },

  crearPerfil: async (perfil: PerfilNuevo): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      // El plan marca cuántos perfiles se pueden gestionar: el límite se
      // comprueba en la frontera, no solo en la interfaz.
      const familia = (await getStore()).familia;
      const maxPerfiles = familia?.perfilesMaximos ?? 1;
      const perfiles = (await getStore()).perfiles;
      if (perfiles.length >= maxPerfiles) {
        throw new ApiError(
          403,
          `Tu plan incluye ${maxPerfiles} ${maxPerfiles === 1 ? 'perfil de cuidado' : 'perfiles de cuidado'}.`,
        );
      }
      // El almacén asigna el id (compartido por la persona y su perfil) y
      // devuelve el perfil creado: la respuesta y lo persistido son lo mismo.
      const creado = (await getStore()).agregarPerfil({
        ...perfil,
        persona: { ...perfil.persona },
      });
      return modoDemo(creado);
    }
    return api.post<PerfilCuidado>('/perfiles', perfil);
  },

  actualizarPerfil: async (id: string, cambios: Partial<PerfilCuidado>): Promise<PerfilCuidado> => {
    // El cliente no decide el estado del perfil (lo deciden la publicación y
    // la selección del cuidador) ni puede marcar los datos sensibles como
    // públicos: son las dos invariantes del producto en la frontera de la API.
    const { estado: _estado, ...cambiosPermitidos } = cambios;
    if (
      cambiosPermitidos.datosSensibles &&
      cambiosPermitidos.datosSensibles.visibleEnOferta !== false
    ) {
      throw new ApiError(400, 'Los datos sensibles de la persona no pueden hacerse públicos.');
    }
    if (USAR_MOCKS) {
      await (await getStore()).actualizarPerfil(id, cambiosPermitidos);
      const p = await perfilPorIdHelper(id);
      if (!p) throw new ApiError(404, `Perfil ${id} no encontrado`);
      return modoDemo(p);
    }
    return api.patch<PerfilCuidado>(`/perfiles/${id}`, cambiosPermitidos);
  },

  eliminarPerfil: async (id: string): Promise<void> => {
    if (USAR_MOCKS) {
      // En demo, el almacén local es la fuente de verdad (y su acción ya
      // depura tareas, registros, incidencias, candidaturas e historial).
      await (await getStore()).eliminarPerfil(id);
      await modoDemo(null);
      return;
    }
    return api.delete<void>(`/perfiles/${id}`);
  },

  /* ---- Buscar cuidadores (directorio) ---- */
  listarCuidadores: async (): Promise<Cuidador[]> => {
    if (USAR_MOCKS) return modoDemo(mocks.cuidadoresDemo);
    return api.get<Cuidador[]>('/cuidadores');
  },

  /* ---- Publicación y selección ---- */
  publicarPerfil: async (id: string): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      await (await getStore()).publicarPerfil(id);
      // Demo: la oferta publicada recibe al instante intereses de la zona y el
      // perfil pasa a "en selección" (con backend, las candidaturas llegan solas).
      await (await getStore()).recibirCandidaturas(id, mocks.candidaturasDeEjemplo(id));
      const p = await perfilPorIdHelper(id);
      if (!p) throw new ApiError(404, `Perfil ${id} no encontrado`);
      return modoDemo(p);
    }
    return api.post<PerfilCuidado>(`/perfiles/${id}/publicar`);
  },

  listarCandidatos: async (perfilId: string): Promise<CandidatoComparado[]> => {
    if (USAR_MOCKS) {
      const candidatos = (await getStore()).candidatos;
      return modoDemo(candidatos.filter((c: any) => c.candidatura.perfilId === perfilId));
    }
    return api.get<CandidatoComparado[]>(`/perfiles/${perfilId}/candidatos`);
  },

  seleccionarCandidato: async (candidaturaId: string): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      await (await getStore()).seleccionarCandidatoEnPerfil(candidaturaId);
      const perfiles = (await getStore()).perfiles;
      const candidatos = (await getStore()).candidatos;
      const perfil = perfiles.find((p: any) =>
        candidatos.some((c: any) => c.candidatura.id === candidaturaId && c.candidatura.perfilId === p.id),
      );
      if (!perfil) throw new ApiError(404, `Candidatura ${candidaturaId} no encontrada`);
      return modoDemo(perfil);
    }
    return api.post<PerfilCuidado>(`/candidatos/${candidaturaId}/seleccionar`);
  },

  /* ---- Mi cuidador: acuerdos y permisos ---- */
  obtenerConfigCuidador: async (perfilId: string): Promise<ConfigCuidador> => {
    if (USAR_MOCKS) {
      const guardada = await (await getStore()).obtenerConfigCuidador(perfilId);
      return modoDemo(guardada);
    }
    return api.get<ConfigCuidador>(`/perfiles/${perfilId}/cuidador/configuracion`);
  },

  guardarConfigCuidador: async (
    perfilId: string,
    cambios: Partial<Omit<ConfigCuidador, 'perfilId'>>,
  ): Promise<ConfigCuidador> => {
    if (USAR_MOCKS) {
      const actual = await (await getStore()).obtenerConfigCuidador(perfilId);
      // Un valor undefined no borra el acuerdo ya guardado: solo se aplica lo
      // que la familia ha cambiado de verdad.
      const definidos = Object.fromEntries(
        Object.entries(cambios).filter(([, valor]) => valor !== undefined),
      ) as Partial<Omit<ConfigCuidador, 'perfilId'>>;
      const config: ConfigCuidador = {
        ...actual,
        ...definidos,
        perfilId,
        permisos: { ...actual.permisos, ...(definidos.permisos ?? {}) },
      };
      await (await getStore()).setConfigCuidador(config);
      return modoDemo(config);
    }
    return api.patch<ConfigCuidador>(`/perfiles/${perfilId}/cuidador/configuracion`, cambios);
  },

  /* ---- Servicios complementarios ---- */
  listarServicios: async (): Promise<ServicioComplementario[]> => {
    if (USAR_MOCKS) return modoDemo((await getStore()).servicios);
    return api.get<ServicioComplementario[]>('/servicios');
  },

  contratarServicio: async (id: string): Promise<ServicioComplementario> => {
    if (USAR_MOCKS) {
      await (await getStore()).contratarServicio(id);
      const servicio = (await getStore()).servicios.find((s: any) => s.id === id);
      if (!servicio) throw new ApiError(404, `Servicio ${id} no encontrado`);
      return modoDemo(servicio);
    }
    return api.post<ServicioComplementario>(`/servicios/${id}/contratar`);
  },

  /* ---- Rutinas y seguimiento ---- */
  listarTareas: async (perfilId: string): Promise<Tarea[]> => {
    if (USAR_MOCKS) {
      const tareas = await (await getStore()).listarTareas(perfilId);
      return modoDemo(tareas);
    }
    return api.get<Tarea[]>(`/perfiles/${perfilId}/tareas`);
  },

  listarRegistros: async (perfilId: string, fecha: string): Promise<RegistroTarea[]> => {
    if (USAR_MOCKS) {
      // Los registros cuelgan de una tarea: se resuelven primero los ids de las
      // tareas del perfil para no devolver los registros de otra persona a cargo.
      const registros = await (await getStore()).listarRegistros(perfilId, fecha);
      return modoDemo(registros);
    }
    return api.get<RegistroTarea[]>(`/perfiles/${perfilId}/registros?fecha=${fecha}`);
  },

  registrarTarea: async (
    tareaId: string,
    estado: RegistroTarea['estado'],
    responsableId?: string,
    nota?: string,
  ): Promise<RegistroTarea> => {
    if (USAR_MOCKS) {
      // El store asigna id y devuelve el registro ya persistido (mismo objeto
      // que queda en el almacén): evita que la app y el almacén discrepen.
      return modoDemo(
        await (await getStore()).agregarRegistro({ tareaId, estado, responsableId, nota, fecha: fechaHoy() }),
      );
    }
    return api.post<RegistroTarea>(`/tareas/${tareaId}/registros`, { estado, responsableId, nota });
  },

  /** Añade una tarea creada por la familia (siempre personalizada). */
  nuevaTarea: async (
    perfilId: string,
    datos: Omit<Tarea, 'id' | 'perfilId' | 'personalizada' | 'fechaAplicacion'>,
  ): Promise<Tarea> => {
    if (USAR_MOCKS) {
      // El store asigna id y devuelve el registro final (mismo objeto que
      // queda persistido): evita desfases entre el id creado y el devuelto.
      return modoDemo(
        await (await getStore()).agregarTarea({
          ...datos,
          perfilId,
          personalizada: true,
          fechaAplicacion: datos.repeticion === 'unica' ? fechaHoy() : undefined,
        }),
      );
    }
    return api.post<Tarea>(`/perfiles/${perfilId}/tareas`, datos);
  },

  eliminarTarea: async (tareaId: string): Promise<void> => {
    if (USAR_MOCKS) {
      await (await getStore()).eliminarTarea(tareaId);
      await modoDemo(null);
      return;
    }
    return api.delete<void>(`/tareas/${tareaId}`);
  },

  listarIncidencias: async (perfilId: string): Promise<Incidencia[]> => {
    if (USAR_MOCKS) {
      const incidencias = await (await getStore()).listarIncidencias(perfilId);
      return modoDemo(incidencias);
    }
    return api.get<Incidencia[]>(`/perfiles/${perfilId}/incidencias`);
  },

  /** Cierra una incidencia con su resolución: la familia deja de verla "abierta". */
  resolverIncidencia: async (
    perfilId: string,
    incidenciaId: string,
    resolucion: string,
  ): Promise<Incidencia> => {
    if (USAR_MOCKS) {
      await (await getStore()).resolverIncidencia(incidenciaId, resolucion);
      const incidence = ((await getStore()).incidencias).find((i: any) => i.id === incidenciaId);
      if (!incidence) throw new ApiError(404, `Incidencia ${incidenciaId} no encontrada`);
      return modoDemo(incidence);
    }
    return api.post<Incidencia>(`/perfiles/${perfilId}/incidencias/${incidenciaId}/resolver`, {
      resolucion,
    });
  },

  /* ---- Informes e historial ---- */
  obtenerInforme: async (perfilId: string): Promise<Informe> => {
    if (USAR_MOCKS) {
      const informe = await (await getStore()).obtenerInforme(perfilId);
      return modoDemo(informe);
    }
    return api.get<Informe>(`/perfiles/${perfilId}/informe`);
  },

  listarHistorial: async (
    perfilId: string,
    opts: { desde?: string; hasta?: string; limite?: number } = {},
  ): Promise<RegistroHistorial[]> => {
    if (USAR_MOCKS) {
      let datos = ((await getStore()).historial).filter((h: any) => h.perfilId === perfilId);
      if (opts.desde) datos = datos.filter((h: any) => h.fecha >= opts.desde!);
      if (opts.hasta) datos = datos.filter((h: any) => h.fecha <= opts.hasta!);
      if (opts.limite) datos = datos.slice(0, opts.limite);
      return modoDemo(datos);
    }
    const params = new URLSearchParams();
    if (opts.desde) params.set('desde', opts.desde);
    if (opts.hasta) params.set('hasta', opts.hasta);
    if (opts.limite) params.set('limite', String(opts.limite));
    const qs = params.toString();
    return api.get<RegistroHistorial[]>(
      `/perfiles/${perfilId}/historial${qs ? `?${qs}` : ''}`,
    );
  },

  /* ---- FASE 1: Alertas médicas ---- */
  listarAlertas: async (
    perfilId: string,
    opts: { soloPendientes?: boolean; desde?: string; hasta?: string; limite?: number } = {},
  ): Promise<AlertaMedica[]> => {
    if (USAR_MOCKS) {
      let alertas = (await getStore()).alertas.filter((a: any) => a.perfilId === perfilId);
      if (opts.soloPendientes) alertas = alertas.filter((a: any) => !a.leida && !a.descartada);
      if (opts.desde) alertas = alertas.filter((a: any) => a.fechaHora >= opts.desde!);
      if (opts.hasta) alertas = alertas.filter((a: any) => a.fechaHora <= opts.hasta!);
      if (opts.limite) alertas = alertas.slice(0, opts.limite);
      return modoDemo(alertas);
    }
    const params = new URLSearchParams();
    if (opts.soloPendientes) params.set('soloPendientes', 'true');
    if (opts.desde) params.set('desde', opts.desde);
    if (opts.hasta) params.set('hasta', opts.hasta);
    if (opts.limite) params.set('limite', String(opts.limite));
    const qs = params.toString();
    return api.get<AlertaMedica[]>(`/perfiles/${perfilId}/alertas${qs ? `?${qs}` : ''}`);
  },

  marcarAlertaLeida: async (alertaId: string): Promise<AlertaMedica> => {
    if (USAR_MOCKS) {
      const alerta = await (await getStore()).marcarAlertaLeida(alertaId);
      if (!alerta) throw new ApiError(404, `Alerta ${alertaId} no encontrada`);
      return modoDemo(alerta);
    }
    return api.patch<AlertaMedica>(`/alertas/${alertaId}/leer`, {});
  },

  descartarAlerta: async (alertaId: string): Promise<void> => {
    if (USAR_MOCKS) {
      await (await getStore()).descartarAlerta(alertaId);
      await modoDemo(null);
      return;
    }
    return api.patch<void>(`/alertas/${alertaId}/descartar`, {});
  },

  /* ---- FASE 1: Reglas de alerta ---- */
  listarReglas: async (perfilId: string): Promise<ReglaAlerta[]> => {
    if (USAR_MOCKS) {
      const reglas = (await getStore()).reglas.filter((r: any) => r.perfilId === perfilId);
      return modoDemo(reglas);
    }
    return api.get<ReglaAlerta[]>(`/perfiles/${perfilId}/reglas`);
  },

  obtenerRegla: async (reglaId: string): Promise<ReglaAlerta> => {
    if (USAR_MOCKS) {
      const regla = await (await getStore()).getReglaPorId(reglaId);
      if (!regla) throw new ApiError(404, `Regla ${reglaId} no encontrada`);
      return modoDemo(regla);
    }
    return api.get<ReglaAlerta>(`/reglas/${reglaId}`);
  },

  crearRegla: async (regla: Omit<ReglaAlerta, 'id' | 'creadaEn' | 'actualizadaEn' | 'vecesEjecutada'>): Promise<ReglaAlerta> => {
    if (USAR_MOCKS) {
      const creada = await (await getStore()).crearRegla(regla);
      return modoDemo(creada);
    }
    return api.post<ReglaAlerta>('/reglas', regla);
  },

  actualizarRegla: async (id: string, cambios: Partial<ReglaAlerta>): Promise<ReglaAlerta> => {
    if (USAR_MOCKS) {
      const actualizada = await (await getStore()).actualizarRegla(id, cambios);
      if (!actualizada) throw new ApiError(404, `Regla ${id} no encontrada`);
      return modoDemo(actualizada);
    }
    return api.patch<ReglaAlerta>(`/reglas/${id}`, cambios);
  },

  eliminarRegla: async (id: string): Promise<void> => {
    if (USAR_MOCKS) {
      await (await getStore()).eliminarRegla(id);
      await modoDemo(null);
      return;
    }
    return api.delete<void>(`/reglas/${id}`);
  },

  activarRegla: async (id: string, activa: boolean): Promise<ReglaAlerta> => {
    if (USAR_MOCKS) {
      const actualizada = await (await getStore()).activarRegla(id, activa);
      if (!actualizada) throw new ApiError(404, `Regla ${id} no encontrada`);
      return modoDemo(actualizada);
    }
    return api.patch<ReglaAlerta>(`/reglas/${id}/activar`, { activa });
  },

  /* ---- FASE 1: Escalado ---- */
  obtenerConfigEscalado: async (perfilId: string): Promise<ConfigEscalado | null> => {
    if (USAR_MOCKS) {
      const regla = (await getStore()).reglas.find((r: any) => r.perfilId === perfilId && r.escalado);
      return modoDemo(regla?.escalado || null);
    }
    return api.get<ConfigEscalado | null>(`/perfiles/${perfilId}/escalado`);
  },

  guardarConfigEscalado: async (perfilId: string, config: ConfigEscalado): Promise<ConfigEscalado> => {
    if (USAR_MOCKS) {
      // Buscar la primera regla del perfil que tenga escalado o crear una nueva
      const reglas = (await getStore()).reglas.filter((r: any) => r.perfilId === perfilId);
      if (reglas.length > 0) {
        await (await getStore()).actualizarRegla(reglas[0].id, { escalado: config });
      }
      return modoDemo(config);
    }
    return api.put<ConfigEscalado>(`/perfiles/${perfilId}/escalado`, config);
  },

  /* ---- FASE 1: Configuración notificaciones ---- */
  obtenerConfigNotificaciones: async (): Promise<ConfigNotificaciones> => {
    if (USAR_MOCKS) {
      const config = (await getStore()).configNotificaciones;
      return modoDemo(config);
    }
    return api.get<ConfigNotificaciones>('/notificaciones/config');
  },

  guardarConfigNotificaciones: async (config: Partial<ConfigNotificaciones>): Promise<ConfigNotificaciones> => {
    if (USAR_MOCKS) {
      const guardada = await (await getStore()).setConfigNotificaciones(config);
      return modoDemo(guardada);
    }
    return api.patch<ConfigNotificaciones>('/notificaciones/config', config);
  },

  obtenerConfigNotificacionesPerfil: async (perfilId: string): Promise<ConfigNotificaciones['porPerfil'][string]> => {
    if (USAR_MOCKS) {
      const config = await (await getStore()).getConfigNotificacionesPerfil(perfilId);
      return modoDemo(config);
    }
    return api.get<ConfigNotificaciones['porPerfil'][string]>(`/perfiles/${perfilId}/notificaciones/config`);
  },

  guardarConfigNotificacionesPerfil: async (perfilId: string, config: ConfigNotificaciones['porPerfil'][string]): Promise<void> => {
    if (USAR_MOCKS) {
      await (await getStore()).setConfigNotificacionesPerfil(perfilId, config);
      await modoDemo(null);
      return;
    }
    return api.patch<void>(`/perfiles/${perfilId}/notificaciones/config`, config);
  },
};

/**
 * Nombre visible de la cuenta de demo: el del correo con el que se entra
 * ("mi.familia@correo.com" → "Mi Familia"). Con el correo de ejemplo se
 * conserva el nombre de la familia de la demo.
 */
function nombreDeCuenta(correo: string): string {
  if (correo === mocks.familiaDemo.email.toLowerCase()) return mocks.familiaDemo.nombre;
  const palabras = (correo.split('@')[0] ?? '')
    .split(/[._+-]+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1));
  return palabras.length > 0 ? palabras.join(' ') : 'Mi familia';
}

/* ---------- Helpers de demo sobre mock-db ---------- */

async function getStore() {
  return getMockStore();
}