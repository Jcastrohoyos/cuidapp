import { useAuthStore } from '@/store/auth-store';

/** Sesión y familia activas. */
export function useSesion() {
  return useAuthStore((estado) => estado.sesion);
}

/** Estado de autenticación: 'cargando' | 'autenticado' | 'anonimo'. */
export function useEstadoAuth() {
  return useAuthStore((estado) => estado.estado);
}

/** Acciones de sesión (iniciar, cerrar, restaurar). */
export function useAuth() {
  const iniciarSesion = useAuthStore((estado) => estado.iniciarSesion);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);
  return { iniciarSesion, cerrarSesion };
}
