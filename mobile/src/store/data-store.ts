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
  PerfilNuevo,
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
// v4: los registros cubren la semana en curso (informe de adherencia real).
const STORAGE_KEY = 'cuidapp.demo_data.v4';

const semillas = {
  familia: mocks.familiaDemo,
  perfiles: [mocks.perfilDemo],
  tareas: mocks.tareasDemo,
  // La semana en curso, para que el informe de adherencia mida días reales.
  registros: [...mocks.registrosSemanaDemo, ...mocks.registrosHoyDemo],
  incidencias: mocks.incidenciasDemo,
  servicios: mocks.serviciosDemo,
  historial: mocks.historialDemo,
  candidatos: mocks.candidatosDemo,
  configsCuidador: mocks.configCuidadorDemo,
};

/** Perfil a crear: los ids los asigna el almacén (si no llegan). */
type NuevoPerfil = PerfilNuevo & { id?: string };

/**
 * Id único para lo que crea la familia.
 *
 * `Date.now()` a secas se repite cuando dos elementos se crean en el mismo
 * milisegundo (la app registra varias tareas seguidas): dos registros con el
 * mismo id hacen que el estado más reciente se pierda. El contador garantiza
 * que dentro del mismo milisegundo los ids sigan siendo distintos y ordenables.
 */
let contadorIds = 0;
function idUnico(prefijo: string): string {
  contadorIds += 1;
  return `${prefijo}_${Date.now()}_${String(contadorIds).padStart(4, '0')}`;
}

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
  /** Crea el perfil, lo deja activo y lo devuelve (con su id asignado). */
  agregarPerfil: (perfil: NuevoPerfil) => PerfilCuidado;
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
  /** Crea el registro y devuelve el ya persistido (con su id asignado). */
  agregarRegistro: (registro: Omit<RegistroTarea, 'id'>) => RegistroTarea;

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
        const id = perfil.id ?? idUnico('per');
        const nuevo: PerfilCuidado = {
          ...perfil,
          id,
          // La persona y su perfil comparten identificador: una misma persona
          // no puede quedar registrada con dos ids distintos.
          persona: { ...perfil.persona, id },
          estado: 'borrador',
          actualizadoEn: new Date().toISOString(),
        };
        set((state) => ({
          perfiles: [...state.perfiles, nuevo],
          // El perfil recién creado pasa a ser el activo: la familia acaba de
          // crearlo y va a trabajar sobre él.
          perfilActivoId: nuevo.id,
        }));
        return nuevo;
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
          const ahora = new Date().toISOString();
          return {
            perfiles: state.perfiles.map((p) =>
              p.id === perfil.id
                ? { ...p, estado: 'con_cuidador', actualizadoEn: ahora }
                : p,
            ),
            candidatos: state.candidatos.map((c) => {
              if (c.candidatura.id === candidaturaId) {
                return { ...c, candidatura: { ...c.candidatura, estado: 'seleccionada' } };
              }
              // Un perfil solo puede tener una candidatura 'seleccionada': si la
              // familia cambia de cuidador, la anterior pasa a 'rechazada'. Sin
              // esto, "Mi cuidador" seguiría mostrando al cuidador anterior.
              if (c.candidatura.perfilId === perfil.id && c.candidatura.estado === 'seleccionada') {
                return { ...c, candidatura: { ...c.candidatura, estado: 'rechazada' } };
              }
              return c;
            }),
          };
        }),

      /* ---------- Tareas ---------- */
      setTareas: (tareas) => set({ tareas }),
      agregarTarea: (tarea) => {
        const nuevo: Tarea = { ...tarea, id: idUnico('tar') };
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
          id: idUnico('reg'),
          fecha: fechaHoy(),
        };
        set((state) => ({ registros: [...state.registros, nuevo] }));
        return nuevo;
      },

      /* ---------- Incidencias ---------- */
      setIncidencias: (incidencias) => set({ incidencias }),
      agregarIncidencia: (incidencia) => {
        const nuevo: Incidencia = {
          ...incidencia,
          id: idUnico('inc'),
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
          id: idUnico('his'),
          fecha: new Date().toISOString(),
        };
        set((state) => ({ historial: [...state.historial, nuevo] }));
      },

      /* ---------- Perfil activo ---------- */
      establecerPerfilActivo: (id) => set({ perfilActivoId: id }),

      /* ---------- Utilidades ---------- */
      reiniciarDemo: () => set({ ...semillas, perfilActivoId: null } as Partial<DataEstado>),
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
