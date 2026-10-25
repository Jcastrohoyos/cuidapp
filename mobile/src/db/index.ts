import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { schema } from './schema';
import {
  Familia,
  Perfil,
  Cuidador,
  Candidatura,
  ConfigCuidador,
  Tarea,
  RegistroTarea,
  Incidencia,
  Servicio,
  Historial,
  Ajuste,
  Alerta,
  ReglaAlerta,
  ConfigNotificaciones,
} from './models';
import { migrateFromZustand, isMigrationDone, markMigrationDone, forceRemigrate } from './migrar-zustand';

/**
 * Inicializa la base de datos WatermelonDB con el adaptador SQLite de Expo.
 * Debe llamarse una sola vez al arrancar la app (en AppProviders o similar).
 */
let databaseInstance: any = null;

export function getDatabase(): any {
  if (databaseInstance) return databaseInstance;

  const sqliteDatabase = openDatabaseSync('cuidapp.db');

  const adapter = new SQLiteAdapter({
    schema,
    dbName: 'cuidapp.db',
    jsi: true, // Use JSI dispatcher for Expo/React Native
    usesExclusiveLocking: true,
  });

  databaseInstance = new Database({
    adapter,
    modelClasses: [
      Familia,
      Perfil,
      Cuidador,
      Candidatura,
      ConfigCuidador,
      Tarea,
      RegistroTarea,
      Incidencia,
      Servicio,
      Historial,
      Ajuste,
      Alerta,
      ReglaAlerta,
      ConfigNotificaciones,
    ],
  });

  return databaseInstance;
}

/**
 * Hook para obtener la base de datos en componentes React
 * (útil si se usa withObservables en el futuro)
 */
export function useDatabase(): any {
  return getDatabase();
}

/**
 * Inicializa la BD y ejecuta migraciones si es necesario.
 * Llamar al arrancar la app (AppProviders.tsx).
 */
export async function initializeDatabase(): Promise<any> {
  const db = getDatabase();
  // WatermelonDB ejecuta migraciones automáticamente al conectar
  // Forzamos la conexión para que se ejecuten
  await db.adapter.execute('SELECT 1');
  return db;
}

/**
 * Cierra la conexión a la base de datos (útil para testing o logout)
 */
export async function closeDatabase(): Promise<void> {
  if (databaseInstance) {
    databaseInstance = null;
  }
}

// Re-export migrateFromZustand
export { migrateFromZustand, isMigrationDone, markMigrationDone, forceRemigrate } from './migrar-zustand';