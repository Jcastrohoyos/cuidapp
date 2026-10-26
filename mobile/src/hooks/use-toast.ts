import { useMemo } from 'react';

import { ApiError } from '@/api/client';
import { useToastStore } from '@/store/toast-store';

const MENSAJE_POR_DEFECTO = 'No se ha podido completar la acción. Inténtalo de nuevo.';

/** Convierte un error en mensaje entendible para la familia. */
export function mensajeDeError(error: unknown, porDefecto = MENSAJE_POR_DEFECTO): string {
  return error instanceof ApiError ? error.message : porDefecto;
}

/** Muestra avisos en el banner global. Uso: `const toast = useToast(); toast.exito('…')`. */
export function useToast() {
  const mostrar = useToastStore((estado) => estado.mostrar);

  return useMemo(
    () => ({
      exito: (mensaje: string) => mostrar('exito', mensaje),
      error: (mensaje: string) => mostrar('error', mensaje),
      info: (mensaje: string) => mostrar('info', mensaje),
      /** Error de red/API con mensaje amable (mismo criterio que el QueryClient). */
      errorDe: (error: unknown, porDefecto?: string) =>
        mostrar('error', mensajeDeError(error, porDefecto)),
    }),
    [mostrar],
  );
}
