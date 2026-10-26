import { useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'cuidapp.onboarding.v1';

export interface OnboardingState {
  visto: Record<string, boolean>;
  version: number;
}

const ESTADO_INICIAL: OnboardingState = { visto: {}, version: 1 };

/**
 * Hook para gestionar el estado del onboarding (tooltips vistos).
 * Usa SecureStore para persistencia segura entre reinicios.
 */
export function useOnboarding() {
  const [estado, setEstado] = useState<OnboardingState>(ESTADO_INICIAL);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const guardado = await SecureStore.getItemAsync(STORAGE_KEY);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (parsed.version === ESTADO_INICIAL.version) {
            setEstado(parsed);
          }
        }
      } catch {
        // Si falla la lectura, se usa el estado inicial
      } finally {
        setCargado(true);
      }
    };
    cargar();
  }, []);

  const guardar = useCallback(async (nuevoEstado: OnboardingState) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(nuevoEstado));
      setEstado(nuevoEstado);
    } catch {
      // Silencioso: si no se puede guardar, el tooltip volverá a aparecer
    }
  }, []);

  /**
   * Verifica si un tooltip ya fue visto.
   */
  const yaVisto = useCallback((clave: string): boolean => {
    return cargado && estado.visto[clave] === true;
  }, [cargado, estado.visto]);

  /**
   * Marca un tooltip como visto y lo persiste.
   */
  const marcarVisto = useCallback((clave: string) => {
    if (estado.visto[clave]) return;
    const nuevo = { ...estado, visto: { ...estado.visto, [clave]: true } };
    guardar(nuevo);
  }, [estado, guardar]);

  /**
   * Resetea todo el onboarding (útil para testing o "ver tutorial de nuevo").
   */
  const resetear = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setEstado(ESTADO_INICIAL);
    } catch {
      // Silencioso
    }
  }, []);

  return { yaVisto, marcarVisto, resetear, cargado };
}

/**
 * Claves estandarizadas para los tooltips del producto.
 * Úsalas con `yaVisto('clave')` y `marcarVisto('clave')`.
 */
export const ONBOARDING_KEYS = {
  INICIO_BUSCAR: 'inicio.buscar',
  INICIO_PERFIL: 'inicio.perfil',
  RUTINA_ANADIR: 'rutina.anadir',
  RUTINA_TOGGLE: 'rutina.toggle',
  CUIDADOR_PERMISOS: 'cuidador.permisos',
  PERFIL_AYUDA: 'perfil.ayuda',
} as const;

export type OnboardingKey = typeof ONBOARDING_KEYS[keyof typeof ONBOARDING_KEYS];