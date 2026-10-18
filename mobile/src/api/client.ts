/**
 * Cliente HTTP tipado para la API de Cuidapp.
 * Autenticación por Bearer token persistido de forma segura (SecureStore en
 * nativo, memoria en web).
 */

import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

/**
 * Modo demo publicable: build de distribución sin backend, con datos locales
 * de ejemplo. Se activa con `EXPO_PUBLIC_MODO_DEMO=1` en el perfil de eas.json
 * y fuerza los mocks aunque haya una URL configurada (así un build demo nunca
 * intenta llamar a un servidor inexistente).
 */
export const esModoDemo = process.env.EXPO_PUBLIC_MODO_DEMO === '1';

export const USAR_MOCKS = esModoDemo || API_URL.length === 0;

/** Canal de OTA del build actual (null en web / Expo Go / sin EAS). */
export const canalUpdates = (() => {
  try {
    return Updates.channel ?? undefined;
  } catch {
    return undefined;
  }
})();

/** True en builds de desarrollo (dev client o canal development). */
export const esModoDesarrollo = __DEV__ || canalUpdates === 'development';

/**
 * Falla rápido en builds de distribución: sin `EXPO_PUBLIC_API_URL` la app
 * arranca en modo demo (login sin contraseña, token estático). Un binario de
 * store o preview sin esa variable es irrecuperable, así que lo bloqueamos.
 * Excepción: `EXPO_PUBLIC_MODO_DEMO=1` autoriza explícitamente un build demo
 * de distribución (APK de pruebas) — los avisos "Modo demo" de la UI salen
 * solos porque todo el flujo usa mocks.
 */
export function assertApiConfigurado(): void {
  if (USAR_MOCKS && !esModoDesarrollo && !esModoDemo) {
    throw new Error(
      'Cuidapp está en modo demo: EXPO_PUBLIC_API_URL está vacío. Define esa variable ' +
        'para el perfil de build correspondiente en eas.json (development/preview/production) ' +
        'antes de construir un binario de distribución.',
    );
  }
}

const TOKEN_KEY = 'cuidapp.token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detalles?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Almacén de token: SecureStore en nativo, memoria en web. */
const memoriaWeb = new Map<string, string>();
const almacenNativo = {
  obtener: (clave: string) => SecureStore.getItemAsync(clave),
  guardar: (clave: string, valor: string) =>
    SecureStore.setItemAsync(clave, valor, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    }),
  borrar: (clave: string) => SecureStore.deleteItemAsync(clave),
};

export const tokenStorage = Platform.select({
  native: almacenNativo,
  default: {
    obtener: async (clave: string) => memoriaWeb.get(clave) ?? null,
    guardar: async (clave: string, valor: string) => {
      memoriaWeb.set(clave, valor);
    },
    borrar: async (clave: string) => {
      memoriaWeb.delete(clave);
    },
  },
})!;

async function peticion<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await tokenStorage.obtener(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!respuesta.ok) {
    let detalles: unknown;
    try {
      detalles = await respuesta.json();
    } catch {
      detalles = undefined;
    }
    const mensaje =
      (detalles as { message?: string } | undefined)?.message ??
      `Error ${respuesta.status} en la petición`;
    throw new ApiError(respuesta.status, mensaje, detalles);
  }

  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

export const api = {
  get: <T>(path: string, auth?: boolean) => peticion<T>(path, { method: 'GET' }, auth),
  post: <T>(path: string, body?: unknown, auth?: boolean) =>
    peticion<T>(
      path,
      { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) },
      auth,
    ),
  patch: <T>(path: string, body?: unknown, auth?: boolean) =>
    peticion<T>(
      path,
      { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) },
      auth,
    ),
  delete: <T>(path: string, auth?: boolean) => peticion<T>(path, { method: 'DELETE' }, auth),
};
