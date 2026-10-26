import { create } from 'zustand';

/** Tipos de aviso del banner global (error de mutación, éxito, información). */
export type TipoAviso = 'exito' | 'error' | 'info';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  mensaje: string;
}

interface EstadoAviso {
  aviso: Aviso | null;
  mostrar: (tipo: TipoAviso, mensaje: string) => void;
  ocultar: () => void;
}

const DURACION_MS = 4500;
let contador = 0;
let temporizador: ReturnType<typeof setTimeout> | undefined;

/**
 * Aviso global de una sola pieza. Se muestra desde cualquier contexto
 * (incluido `QueryClient` fuera de React vía `useToastStore.getState()`).
 */
export const useToastStore = create<EstadoAviso>((set, get) => ({
  aviso: null,
  mostrar: (tipo, mensaje) => {
    contador += 1;
    const id = contador;
    set({ aviso: { id, tipo, mensaje } });
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      if (get().aviso?.id === id) set({ aviso: null });
    }, DURACION_MS);
  },
  ocultar: () => {
    if (temporizador) clearTimeout(temporizador);
    set({ aviso: null });
  },
}));
