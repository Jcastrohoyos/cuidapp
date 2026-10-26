import {
  query,
  queryWithParams,
  run,
  insert,
  getOne,
  getAll,
  initDatabase,
} from './storage';

/**
 * Base de datos con AsyncStorage.
 * Reemplaza a WatermelonDB y expo-sqlite para evitar problemas de compilación nativa.
 */
let databaseInitialized = false;

/**
 * Inicializa la base de datos AsyncStorage.
 */
export async function initializeDatabase(): Promise<any> {
  try {
    await initDatabase();
    databaseInitialized = true;
    console.log('[DB] AsyncStorage inicializada correctamente');
    return { adapter: { execute: async () => {} } };
  } catch (error) {
    console.error('Database initialization failed:', error);
    return null;
  }
}

/**
 * Cierra la conexión a la base de datos.
 */
export async function closeDatabase(): Promise<void> {
  databaseInitialized = false;
}

// Re-exportar funciones del servicio AsyncStorage
export { query, queryWithParams, run, insert, getOne, getAll, initDatabase };

// Exportar funciones de migración como no-op
export async function isMigrationDone(): Promise<boolean> {
  return true;
}

export async function markMigrationDone(): Promise<void> {
  // No-op
}

export async function forceRemigrate(): Promise<void> {
  // No-op
}

export async function migrateFromZustand(): Promise<void> {
  // No-op
}

export default {
  query,
  queryWithParams,
  run,
  insert,
  getOne,
  getAll,
  initDatabase,
  initializeDatabase,
  isMigrationDone,
  markMigrationDone,
  forceRemigrate,
  migrateFromZustand,
};
