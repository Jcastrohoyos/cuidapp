/**
 * Estado global de autenticación (Zustand).
 * La sesión se persiste con SecureStore; al abrir la app se restaura el token
 * y se reconcilia el estado antes de renderizar las rutas.
 */

import { create } from 'zustand';

import { tokenStorage } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { endpoints } from '@/api/endpoints';
import { useDataStore } from '@/store/data-store';
import type { Familia, Sesion } from '@/types';

interface AuthEstado {
  sesion: Sesion | null;
  estado: 'cargando' | 'autenticado' | 'anonimo';
  iniciarSesion: (sesion: Sesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  restaurar: () => Promise<void>;
}

export const useAuthStore = create<AuthEstado>()((set) => ({
  sesion: null,
  estado: 'cargando',

  iniciarSesion: async (sesion) => {
    await tokenStorage.guardar('cuidapp.token', sesion.token);
    // La cuenta con la que se entra es la de la familia: se vuelca al almacén
    // para que perfil y búsqueda muestren sus datos y no los de ejemplo.
    useDataStore.getState().actualizarFamilia(sesion.familia);
    set({ sesion, estado: 'autenticado' });
  },

  cerrarSesion: async () => {
    await tokenStorage.borrar('cuidapp.token');
    queryClient.clear();
    set({ sesion: null, estado: 'anonimo' });
  },

  restaurar: async () => {
    const token = await tokenStorage.obtener('cuidapp.token');
    if (!token) {
      set({ estado: 'anonimo' });
      return;
    }
    try {
      const familia: Familia = await endpoints.obtenerFamilia();
      const perfiles = await endpoints.listarPerfiles();
      useDataStore.getState().actualizarFamilia(familia);
      set({
        sesion: { token, familia, expiraEn: new Date(Date.now() + 86400000).toISOString() },
        estado: 'autenticado',
      });
      // El perfil activo se guarda en el almacén (persistente): si el
      // dispositivo ya tenía un perfil activo, se conserva; si no, se usa el
      // primero de la lista.
      const activo = useDataStore.getState().perfilActivoId;
      if (!activo || !perfiles.some((p) => p.id === activo)) {
        useDataStore.getState().establecerPerfilActivo(perfiles[0]?.id ?? null);
      }
    } catch (error) {
      // Solo un 401/403 invalida el token. Un fallo de red (sin cobertura,
      // servidor caído) no debe dejar a la familia sin sesión ni con sus
      // datos borrados: se conserva el token y la app reintenta.
      if (esErrorDeSesion(error)) {
        await tokenStorage.borrar('cuidapp.token');
        queryClient.clear();
        set({ sesion: null, estado: 'anonimo' });
        return;
      }
      const familia = useDataStore.getState().familia;
      set({
        sesion: { token, familia, expiraEn: new Date(Date.now() + 86400000).toISOString() },
        estado: 'autenticado',
      });
    }
  },
}));

/** ¿El error invalida la sesión (401/403)? */
function esErrorDeSesion(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}
