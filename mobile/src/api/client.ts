/**
 * Cliente HTTP tipado para la API de Cuidapp.
 * Autenticación por Bearer token persistido de forma segura (SecureStore en
 * nativo, AsyncStorage/localStorage en web para que la sesión sobreviva a
 * recargas y reinicios del navegador).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
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
 * Problema de configuración del binario actual (o null si todo está bien).
 *
 * Un build de distribución sin `EXPO_PUBLIC_API_URL` arranca en modo demo
 * (login sin contraseña, token estático), pero eso en un binario de tienda o
 * preview es irrecuperable. Se devuelve el mensaje en lugar de lanzar para
 * que la app pueda mostrarlo al usuario (pantalla en blanco es peor que un
 * error legible).
 * Excepción: `EXPO_PUBLIC_MODO_DEMO=1` autoriza explícitamente un build demo
 * de distribución (APK de pruebas) — los avisos "Modo demo" de la UI salen
 * solos porque todo el flujo usa mocks.
 */
export function problemaDeConfiguracion(): string | null {
  if (!USAR_MOCKS) return null;
  if (esModoDemo) return null;
  // Desarrollo local (`npx expo start`) o build del canal 'development':
  // los datos de ejemplo son lo esperado.
  if (esModoDesarrollo) return null;
  return (
    'Cuidapp está en modo demo: EXPO_PUBLIC_API_URL está vacío. Define esa variable ' +
    'para el perfil de build correspondiente en eas.json (development/preview/production) ' +
    'antes de construir un binario de distribución.'
  );
}

/** Falla rápido si el binario se construyó sin la configuración necesaria. */
export function assertApiConfigurado(): void {
  const problema = problemaDeConfiguracion();
  if (problema) throw new Error(problema);
}

const TOKEN_KEY = 'cuidapp.token';

/** Tiempo máximo de espera de una petición (ms). */
export const TIEMPO_LIMITE_PETICION = 10_000;

/** Error de red: la petición no llegó a completarse (sin cobertura, timeout…). */
export class ErrorDeRed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorDeRed';
  }
}

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

/**
 * Almacén de token:
 * - **Nativo:** SecureStore (cifrado en keychain/keystore).
 * - **Web:** AsyncStorage (localStorage). SecureStore no existe en web
 *   (plataformas android/iOS/tvOS según la doc de SDK 57), así que con un
 *   Map en memoria la sesión se perdía en cada recarga. El token queda
 *   legible para JS en el navegador — aceptable para el modo demo/mocks;
 *   con backend real convendría una cookie httpOnly.
 */
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
    obtener: (clave: string) => AsyncStorage.getItem(clave),
    guardar: (clave: string, valor: string) => AsyncStorage.setItem(clave, valor),
    borrar: (clave: string) => AsyncStorage.removeItem(clave),
  },
})!;

/**
 * Ejecuta la petición con un tiempo límite.
 *
 * Sin timeout, una red caída deja la app esperando indefinidamente (el splash
 * no se oculta y la pantalla queda en "cargando"). `AbortController` + un
 * temporizador own funcionan en todas las plataformas (incluido Hermes).
 */
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

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_PETICION);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controlador.signal,
    });
  } catch (error) {
    // Red caída o tiempo agotado: un error propio, no un crash de la app.
    const abortado = (error as { name?: string })?.name === 'AbortError';
    throw new ErrorDeRed(
      abortado
        ? 'El servidor ha tardado demasiado en responder. Revisa tu conexión e inténtalo de nuevo.'
        : 'No hemos podido conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  } finally {
    clearTimeout(temporizador);
  }

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

  // 204 y 200 sin cuerpo: no hay nada que deserializar (p. ej. un DELETE).
  if (respuesta.status === 204) return undefined as T;
  const cuerpo = await respuesta.text();
  if (!cuerpo) return undefined as T;
  try {
    return JSON.parse(cuerpo) as T;
  } catch {
    throw new ApiError(respuesta.status, 'La respuesta del servidor no tiene un formato válido.');
  }
}

export const api = {
  get: <T>(path: string, auth?: boolean) => peticion<T>(path, { method: 'GET' }, auth),
  post: <T>(path: string, body?: unknown, auth?: boolean) =>
    peticion<T>(
      path,
      { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) },
      auth,
    ),
  put: <T>(path: string, body?: unknown, auth?: boolean) =>
    peticion<T>(
      path,
      { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) },
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
