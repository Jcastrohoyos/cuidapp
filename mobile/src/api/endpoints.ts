/**
 * Endpoints de Cuidapp organizados por dominio.
 * Si no hay API configurada (EXPO_PUBLIC_API_URL vacío) se sirven datos de
 * demostración desde el data-store local (persistido en AsyncStorage), así
 * los cambios de la familia sobreviven al recargo de la app.
 */

import { api, ApiError, USAR_MOCKS } from './client';
import * as mocks from './mocks';
import { useDataStore } from '@/store/data-store';
import { fechaHoy } from '@/utils/format';
import type {
  CandidatoComparado,
  ConfigCuidador,
  Cuidador,
  Familia,
  Incidencia,
  Informe,
  PerfilCuidado,
  RegistroHistorial,
  RegistroTarea,
  ServicioComplementario,
  Sesion,
  Tarea,
} from '@/types';

const demora = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

const modoDemo = async <T>(valor: T): Promise<T> => {
  await demora();
  return valor;
};

/* ---------- Helpers de demo sobre el data-store ---------- */

const obtenerStore = () => useDataStore.getState();

const perfilPorId = (id: string): PerfilCuidado | undefined => {
  return obtenerStore().perfiles.find((p) => p.id === id);
};

export const endpoints = {
  /* ---- Sesión ---- */
  iniciarSesion: async (email: string, _contrasena: string): Promise<Sesion> => {
    if (USAR_MOCKS) return modoDemo({ ...mocks.sesionDemo, familia: { ...mocks.familiaDemo, email } });
    return api.post<Sesion>('/auth/login', { email, contrasena: _contrasena }, false);
  },

  registrar: async (datos: { nombre: string; email: string; contrasena: string }): Promise<Sesion> => {
    if (USAR_MOCKS)
      return modoDemo({
        ...mocks.sesionDemo,
        // La contraseña no se persiste en el store de demo: solo viaja al API.
        familia: {
          ...mocks.familiaDemo,
          nombre: datos.nombre,
          email: datos.email,
          plan: 'gratuito',
        },
      });
    return api.post<Sesion>('/auth/registro', datos, false);
  },

  obtenerFamilia: async (): Promise<Familia> => {
    if (USAR_MOCKS) return modoDemo(mocks.familiaDemo);
    return api.get<Familia>('/familia');
  },

  /* ---- Perfiles de cuidado ---- */
  listarPerfiles: async (): Promise<PerfilCuidado[]> => {
    if (USAR_MOCKS) return modoDemo(obtenerStore().perfiles);
    return api.get<PerfilCuidado[]>('/perfiles');
  },

  obtenerPerfil: async (id: string): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      const p = perfilPorId(id);
      if (!p) throw new ApiError(404, `Perfil ${id} no encontrado`);
      return modoDemo(p);
    }
    return api.get<PerfilCuidado>(`/perfiles/${id}`);
  },

  crearPerfil: async (perfil: Omit<PerfilCuidado, 'id' | 'actualizadoEn'>): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      const nuevo: PerfilCuidado = {
        ...perfil,
        id: `per_${Date.now()}`,
        estado: 'borrador',
        actualizadoEn: new Date().toISOString(),
      };
      // El id de la respuesta y el del almacén deben coincidir (evita un 404
      // si el milisegundo cambia entre una llamada y otra).
      obtenerStore().agregarPerfil({ ...perfil, id: nuevo.id });
      return modoDemo(nuevo);
    }
    return api.post<PerfilCuidado>('/perfiles', perfil);
  },

  actualizarPerfil: async (id: string, cambios: Partial<PerfilCuidado>): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      obtenerStore().actualizarPerfil(id, cambios);
      const p = perfilPorId(id);
      if (!p) throw new ApiError(404, `Perfil ${id} no encontrado`);
      return modoDemo(p);
    }
    return api.patch<PerfilCuidado>(`/perfiles/${id}`, cambios);
  },

  eliminarPerfil: async (id: string): Promise<void> => {
    if (USAR_MOCKS) {
      // En demo, el almacén local es la fuente de verdad (y su acción ya
      // depura tareas, registros, incidencias, candidaturas e historial).
      obtenerStore().eliminarPerfil(id);
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
      obtenerStore().publicarPerfil(id);
      // Demo: la oferta publicada recibe al instante intereses de la zona y el
      // perfil pasa a "en selección" (con backend, las candidaturas llegan solas).
      obtenerStore().recibirCandidaturas(id, mocks.candidaturasDeEjemplo(id));
      const p = perfilPorId(id);
      if (!p) throw new ApiError(404, `Perfil ${id} no encontrado`);
      return modoDemo(p);
    }
    return api.post<PerfilCuidado>(`/perfiles/${id}/publicar`);
  },

  listarCandidatos: async (perfilId: string): Promise<CandidatoComparado[]> => {
    if (USAR_MOCKS)
      return modoDemo(
        obtenerStore().candidatos.filter(
          (c) => c.candidatura.perfilId === perfilId || perfilId === mocks.perfilDemo.id,
        ),
      );
    return api.get<CandidatoComparado[]>(`/perfiles/${perfilId}/candidatos`);
  },

  seleccionarCandidato: async (candidaturaId: string): Promise<PerfilCuidado> => {
    if (USAR_MOCKS) {
      obtenerStore().seleccionarCandidatoEnPerfil(candidaturaId);
      const perfil = obtenerStore().perfiles.find((p) =>
        obtenerStore().candidatos.some((c) => c.candidatura.id === candidaturaId && c.candidatura.perfilId === p.id),
      );
      if (!perfil) throw new ApiError(404, `Candidatura ${candidaturaId} no encontrada`);
      return modoDemo(perfil);
    }
    return api.post<PerfilCuidado>(`/candidatos/${candidaturaId}/seleccionar`);
  },

  /* ---- Mi cuidador: acuerdos y permisos ---- */
  obtenerConfigCuidador: async (perfilId: string): Promise<ConfigCuidador> => {
    if (USAR_MOCKS) {
      const guardada = obtenerStore().configsCuidador[perfilId];
      return modoDemo(
        guardada ?? { perfilId, permisos: { ...mocks.permisosCuidadorPorDefecto } },
      );
    }
    return api.get<ConfigCuidador>(`/perfiles/${perfilId}/cuidador/configuracion`);
  },

  guardarConfigCuidador: async (
    perfilId: string,
    cambios: Partial<Omit<ConfigCuidador, 'perfilId'>>,
  ): Promise<ConfigCuidador> => {
    if (USAR_MOCKS) {
      const actual =
        obtenerStore().configsCuidador[perfilId] ??
        ({ perfilId, permisos: { ...mocks.permisosCuidadorPorDefecto } } as ConfigCuidador);
      const config: ConfigCuidador = {
        ...actual,
        ...cambios,
        perfilId,
        permisos: { ...actual.permisos, ...(cambios.permisos ?? {}) },
      };
      obtenerStore().setConfigCuidador(config);
      return modoDemo(config);
    }
    return api.patch<ConfigCuidador>(`/perfiles/${perfilId}/cuidador/configuracion`, cambios);
  },

  /* ---- Servicios complementarios ---- */
  listarServicios: async (): Promise<ServicioComplementario[]> => {
    if (USAR_MOCKS) return modoDemo(obtenerStore().servicios);
    return api.get<ServicioComplementario[]>('/servicios');
  },

  contratarServicio: async (id: string): Promise<ServicioComplementario> => {
    if (USAR_MOCKS) {
      obtenerStore().contratarServicio(id);
      const servicio = obtenerStore().servicios.find((s) => s.id === id);
      if (!servicio) throw new ApiError(404, `Servicio ${id} no encontrado`);
      return modoDemo(servicio);
    }
    return api.post<ServicioComplementario>(`/servicios/${id}/contratar`);
  },

  /* ---- Rutinas y seguimiento ---- */
  listarTareas: async (perfilId: string): Promise<Tarea[]> => {
    if (USAR_MOCKS)
      return modoDemo(
        obtenerStore().tareas.filter((t) => t.perfilId === perfilId || perfilId === mocks.perfilDemo.id),
      );
    return api.get<Tarea[]>(`/perfiles/${perfilId}/tareas`);
  },

  listarRegistros: async (perfilId: string, fecha: string): Promise<RegistroTarea[]> => {
    if (USAR_MOCKS)
      return modoDemo(
        obtenerStore().registros.filter((r) => r.tareaId === perfilId || r.fecha === fecha),
      );
    return api.get<RegistroTarea[]>(`/perfiles/${perfilId}/registros?fecha=${fecha}`);
  },

  registrarTarea: async (
    tareaId: string,
    estado: RegistroTarea['estado'],
    responsableId?: string,
    nota?: string,
  ): Promise<RegistroTarea> => {
    if (USAR_MOCKS) {
      obtenerStore().agregarRegistro({ tareaId, estado, responsableId, nota, fecha: fechaHoy() });
      const nuevo: RegistroTarea = {
        id: `reg_${Date.now()}`,
        tareaId,
        fecha: fechaHoy(),
        estado,
        responsableId,
        nota,
      };
      return modoDemo(nuevo);
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
        obtenerStore().agregarTarea({
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
      obtenerStore().eliminarTarea(tareaId);
      await modoDemo(null);
      return;
    }
    return api.delete<void>(`/tareas/${tareaId}`);
  },

  listarIncidencias: async (perfilId: string): Promise<Incidencia[]> => {
    if (USAR_MOCKS)
      return modoDemo(obtenerStore().incidencias.filter((i) => i.perfilId === perfilId));
    return api.get<Incidencia[]>(`/perfiles/${perfilId}/incidencias`);
  },

  /* ---- Informes e historial ---- */
  obtenerInforme: async (perfilId: string): Promise<Informe> => {
    if (USAR_MOCKS) {
      const tareas = obtenerStore().tareas.filter((t) => t.perfilId === perfilId);
      const registros = obtenerStore().registros.filter((r) => tareas.some((t) => t.id === r.tareaId));
      const realizadas = registros.filter((r) => r.estado === 'realizada').length;
      const incidencias = obtenerStore().incidencias.filter((i) => i.perfilId === perfilId);
      return modoDemo({
        perfilId,
        periodo: {
          desde: new Date(Date.now() - 86400000 * 6).toISOString(),
          hasta: new Date().toISOString(),
        },
        tareasRealizadas: realizadas,
        tareasTotales: tareas.length,
        incidencias,
        valoracion: 4.8,
      });
    }
    return api.get<Informe>(`/perfiles/${perfilId}/informe`);
  },

  listarHistorial: async (
    perfilId: string,
    opts: { desde?: string; hasta?: string; limite?: number } = {},
  ): Promise<RegistroHistorial[]> => {
    if (USAR_MOCKS) {
      let datos = obtenerStore().historial.filter((h) => h.perfilId === perfilId);
      if (opts.desde) datos = datos.filter((h) => h.fecha >= opts.desde!);
      if (opts.hasta) datos = datos.filter((h) => h.fecha <= opts.hasta!);
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
};

/* Importamos mocks al final para no crear dependencia circular con el data-store */