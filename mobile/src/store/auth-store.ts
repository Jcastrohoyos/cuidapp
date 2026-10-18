/**
 * Estado global de autenticación (Zustand).
 * La sesión se persiste con SecureStore; al abrir la app se restaura el token
 * y se reconcilia el estado antes de renderizar las rutas.
 */

import { create } from 'zustand';

import { tokenStorage } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { endpoints } from '@/api/endpoints';
import type { Familia, Sesion } from '@/types';

interface AuthEstado {
  sesion: Sesion | null;
  estado: 'cargando' | 'autenticado' | 'anonimo';
  perfilActivoId: string | null;
  iniciarSesion: (sesion: Sesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  restaurar: () => Promise<void>;
  establecerPerfilActivo: (id: string | null) => void;
}

export const useAuthStore = create<AuthEstado>()((set) => ({
  sesion: null,
  estado: 'cargando',
  perfilActivoId: null,

  iniciarSesion: async (sesion) => {
    await tokenStorage.guardar('cuidapp.token', sesion.token);
    set({ sesion, estado: 'autenticado', perfilActivoId: null });
  },

  cerrarSesion: async () => {
    await tokenStorage.borrar('cuidapp.token');
    queryClient.clear();
    set({ sesion: null, estado: 'anonimo', perfilActivoId: null });
  },

  establecerPerfilActivo: (id) => set({ perfilActivoId: id }),

  restaurar: async () => {
    const token = await tokenStorage.obtener('cuidapp.token');
    if (!token) {
      set({ estado: 'anonimo', perfilActivoId: null });
      return;
    }
    try {
      const familia: Familia = await endpoints.obtenerFamilia();
      const perfiles = await endpoints.listarPerfiles();
      set({
        sesion: { token, familia, expiraEn: new Date(Date.now() + 86400000).toISOString() },
        estado: 'autenticado',
        perfilActivoId: perfiles[0]?.id ?? null,
      });
    } catch {
      await tokenStorage.borrar('cuidapp.token');
      queryClient.clear();
      set({ sesion: null, estado: 'anonimo', perfilActivoId: null });
    }
  },
}));
