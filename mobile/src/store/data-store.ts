/**
 * Almacén local de datos de demostración (Pilar 1 · La familia).
 *
 * Gestiona con Zustand + AsyncStorage toda la información que la familia
 * genera y modifica en la app: perfiles de cuidado, tareas, registros,
 * servicios contratados, incidencias e historial. Todo se persiste en el
 * dispositivo, así que la app es completamente funcional sin backend.
 *
 * Los datos iniciales se siembran desde src/api/mocks.ts. Cuando se
 * configura EXPO_PUBLIC_API_URL, los endpoints reales toman el control.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as mocks from '@/api/mocks';
import type {
  CandidatoComparado,
  ConfigCuidador,
  Familia,
  Incidencia,
  PerfilCuidado,
  RegistroHistorial,
  RegistroTarea,
  ServicioComplementario,
  Tarea,
} from '@/types';
import { fechaHoy } from '@/utils/format';
import { depurarDatosDePerfil } from '@/utils/perfiles';

// v2: las semillas cambiaron para replicar la demo de la landing (2ª versión
// de los datos de ejemplo); la clave nueva evita que la app cargue datos viejos.
// v3: se añaden tareas "solo hoy" (repeticion) y la configuración del cuidador.
const STORAGE_KEY = 'cuidapp.demo_data.v3';

const semillas = {
  familia: mocks.familiaDemo,
  perfiles: [mocks.perfilDemo],
  tareas: mocks.tareasDemo,
  registros: mocks.registrosHoyDemo,
  incidencias: mocks.incidenciasDemo,
  servicios: mocks.serviciosDemo,
  historial: mocks.historialDemo,
  candidatos: mocks.candidatosDemo,
  configsCuidador: mocks.configCuidadorDemo,
};

/** Perfil a crear: el id es opcional (si no llega, lo genera el almacén). */
type NuevoPerfil = Omit<PerfilCuidado, 'id' | 'actualizadoEn'> & { id?: string };

interface DataEstado {
  /* ---------- Cuenta familiar ---------- */
  /** Datos de la cuenta familiar (contacto, miembros, preferencias de búsqueda). */
  familia: Familia;
  actualizarFamilia: (cambios: Partial<Familia>) => void;

  /* ---------- Catálogos ---------- */
  perfiles: PerfilCuidado[];
  tareas: Tarea[];
  registros: RegistroTarea[];
  incidencias: Incidencia[];
  servicios: ServicioComplementario[];
  historial: RegistroHistorial[];
  candidatos: CandidatoComparado[];
  /** Configuración de "Mi cuidador" por perfil (acuerdos y permisos). */
  configsCuidador: Record<string, ConfigCuidador>;

  /* ---------- Navegación ---------- */
  perfilActivoId: string | null;

  /* ---------- Perfiles ---------- */
  setPerfiles: (perfiles: PerfilCuidado[]) => void;
  agregarPerfil: (perfil: NuevoPerfil) => void;
  actualizarPerfil: (id: string, cambios: Partial<PerfilCuidado>) => void;
  publicarPerfil: (id: string) => void;
  /** Quita a la persona a cargo y depura todo lo que cuelga de su perfil. */
  eliminarPerfil: (id: string) => void;
  recibirCandidaturas: (perfilId: string, candidaturas: CandidatoComparado[]) => void;
  seleccionarCandidatoEnPerfil: (candidaturaId: string) => void;

  /* ---------- Tareas ---------- */
  setTareas: (tareas: Tarea[]) => void;
  /** Crea la tarea y devuelve el registro final (con su id asignado). */
  agregarTarea: (tarea: Omit<Tarea, 'id'>) => Tarea;
  eliminarTarea: (id: string) => void;

  /* ---------- Configuración del cuidador ---------- */
  setConfigCuidador: (config: ConfigCuidador) => void;

  /* ---------- Registros ---------- */
  setRegistros: (registros: RegistroTarea[]) => void;
  agregarRegistro: (registro: Omit<RegistroTarea, 'id'>) => void;

  /* ---------- Incidencias ---------- */
  setIncidencias: (incidencias: Incidencia[]) => void;
  agregarIncidencia: (incidencia: Omit<Incidencia, 'id'>) => void;
  resolverIncidencia: (id: string, resolucion: string) => void;

  /* ---------- Servicios ---------- */
  setServicios: (servicios: ServicioComplementario[]) => void;
  contratarServicio: (id: string) => void;

  /* ---------- Historial ---------- */
  setHistorial: (historial: RegistroHistorial[]) => void;
  agregarHistorial: (registro: Omit<RegistroHistorial, 'id'>) => void;

  /* ---------- Perfil activo ---------- */
  establecerPerfilActivo: (id: string | null) => void;

  /* ---------- Utilidades ---------- */
  reiniciarDemo: () => void;
  /** Perfil activo resuelto (el fijado, o el primero si no hay fijado). */
  perfilActivo: PerfilCuidado | null;
}

export const useDataStore = create<DataEstado>()(
  persist(
    (set, get) => ({
      /* ---------- Siembra inicial ---------- */
      familia: semillas.familia,
      perfiles: semillas.perfiles,
      tareas: semillas.tareas,
      registros: semillas.registros,
      incidencias: semillas.incidencias,
      servicios: semillas.servicios,
      historial: semillas.historial,
      candidatos: semillas.candidatos,
      configsCuidador: semillas.configsCuidador,
      perfilActivoId: null,

      /* ---------- Cuenta familiar ---------- */
      actualizarFamilia: (cambios) =>
        set((state) => ({ familia: { ...state.familia, ...cambios } })),

      /* ---------- Perfiles ---------- */
      setPerfiles: (perfiles) => set({ perfiles }),

      agregarPerfil: (perfil) => {
        const nuevo: PerfilCuidado = {
          ...perfil,
          id: perfil.id ?? `per_${Date.now()}`,
          estado: 'borrador',
          actualizadoEn: new Date().toISOString(),
        };
        set((state) => ({
          perfiles: [...state.perfiles, nuevo],
          perfilActivoId: state.perfilActivoId ?? nuevo.id,
        }));
      },

      actualizarPerfil: (id, cambios) =>
        set((state) => ({
          perfiles: state.perfiles.map((p) =>
            p.id === id ? { ...p, ...cambios, actualizadoEn: new Date().toISOString() } : p,
          ),
        })),

      publicarPerfil: (id) =>
        set((state) => ({
          perfiles: state.perfiles.map((p) =>
            p.id === id ? { ...p, estado: 'publicado', actualizadoEn: new Date().toISOString() } : p,
          ),
        })),

      eliminarPerfil: (id) => set((state) => depurarDatosDePerfil(state, id)),

      recibirCandidaturas: (perfilId, candidaturas) =>
        set((state) => ({
          candidatos: [...state.candidatos, ...candidaturas],
          perfiles: state.perfiles.map((p) =>
            p.id === perfilId && (p.estado === 'publicado' || p.estado === 'en_seleccion')
              ? { ...p, estado: 'en_seleccion', actualizadoEn: new Date().toISOString() }
              : p,
          ),
        })),

      seleccionarCandidatoEnPerfil: (candidaturaId) =>
        set((state) => {
          const perfil = state.perfiles.find((p) =>
            state.candidatos.some((c) => c.candidatura.id === candidaturaId && c.candidatura.perfilId === p.id),
          );
          if (!perfil) return state;
          return {
            perfiles: state.perfiles.map((p) =>
              p.id === perfil.id
                ? { ...p, estado: 'con_cuidador', actualizadoEn: new Date().toISOString() }
                : p,
            ),
            candidatos: state.candidatos.map((c) =>
              c.candidatura.id === candidaturaId
                ? { ...c, candidatura: { ...c.candidatura, estado: 'seleccionada' } }
                : c,
            ),
          };
        }),

      /* ---------- Tareas ---------- */
      setTareas: (tareas) => set({ tareas }),
      agregarTarea: (tarea) => {
        const nuevo: Tarea = { ...tarea, id: `tar_${Date.now()}` };
        set((state) => ({ tareas: [...state.tareas, nuevo] }));
        return nuevo;
      },
      eliminarTarea: (id) =>
        set((state) => ({ tareas: state.tareas.filter((t) => t.id !== id) })),

      /* ---------- Configuración del cuidador ---------- */
      setConfigCuidador: (config) =>
        set((state) => ({
          configsCuidador: { ...state.configsCuidador, [config.perfilId]: config },
        })),

      /* ---------- Registros ---------- */
      setRegistros: (registros) => set({ registros }),
      agregarRegistro: (registro) => {
        const nuevo: RegistroTarea = {
          ...registro,
          id: `reg_${Date.now()}`,
          fecha: fechaHoy(),
        };
        set((state) => ({ registros: [...state.registros, nuevo] }));
      },

      /* ---------- Incidencias ---------- */
      setIncidencias: (incidencias) => set({ incidencias }),
      agregarIncidencia: (incidencia) => {
        const nuevo: Incidencia = {
          ...incidencia,
          id: `inc_${Date.now()}`,
          fecha: new Date().toISOString(),
          estado: 'abierta',
        };
        set((state) => ({ incidencias: [...state.incidencias, nuevo] }));
      },
      resolverIncidencia: (id, resolucion) =>
        set((state) => ({
          incidencias: state.incidencias.map((i) =>
            i.id === id ? { ...i, estado: 'resuelta', resolucion } : i,
          ),
        })),

      /* ---------- Servicios ---------- */
      setServicios: (servicios) => set({ servicios }),
      contratarServicio: (id) =>
        set((state) => ({
          servicios: state.servicios.map((s) =>
            s.id === id ? { ...s, contratado: true } : s,
          ),
        })),

      /* ---------- Historial ---------- */
      setHistorial: (historial) => set({ historial }),
      agregarHistorial: (registro) => {
        const nuevo: RegistroHistorial = {
          ...registro,
          id: `his_${Date.now()}`,
          fecha: new Date().toISOString(),
        };
        set((state) => ({ historial: [...state.historial, nuevo] }));
      },

      /* ---------- Perfil activo ---------- */
      establecerPerfilActivo: (id) => set({ perfilActivoId: id }),

      /* ---------- Utilidades ---------- */
      reiniciarDemo: () => set(semillas as Partial<DataEstado>),

      /** Perfil activo resuelto */
      get perfilActivo() {
        const { perfiles, perfilActivoId } = get();
        const id = perfilActivoId ?? perfiles[0]?.id ?? null;
        return perfiles.find((p) => p.id === id) ?? null;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        familia: state.familia,
        perfiles: state.perfiles,
        tareas: state.tareas,
        registros: state.registros,
        incidencias: state.incidencias,
        servicios: state.servicios,
        historial: state.historial,
        candidatos: state.candidatos,
        configsCuidador: state.configsCuidador,
        perfilActivoId: state.perfilActivoId,
      }),
    },
  ),
);
