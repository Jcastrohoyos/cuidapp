import { openDatabaseSync } from 'expo-sqlite';

let db: any = null;

function getDb() {
  if (!db) {
    db = openDatabaseSync('cuidapp.db');
  }
  return db;
}

export async function query(sql: string): Promise<any[]> {
  try {
    const result = getDb().execSync(sql);
    return result[0]?.rows?.toArray?.() || [];
  } catch (e) {
    return [];
  }
}

export async function queryWithParams(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const result = getDb().execSync(sql, params);
    return result[0]?.rows?.toArray?.() || [];
  } catch (e) {
    return [];
  }
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  try {
    getDb().execSync(sql, params);
  } catch (e) {
    console.error('SQLite run error:', e);
  }
}

export async function insert(sql: string, params: any[] = []): Promise<number> {
  try {
    const result = getDb().execSync(sql, params);
    const rows = result[0]?.rows?.toArray?.() || [];
    return rows.length > 0 ? (rows[0] as any).last_insert_rowid : 0;
  } catch (e) {
    console.error('SQLite insert error:', e);
    return 0;
  }
}

export async function getOne(sql: string, params: any[] = []): Promise<any | null> {
  const rows = await queryWithParams(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function getAll(sql: string, params: any[] = []): Promise<any[]> {
  return queryWithParams(sql, params);
}

export async function initDatabase(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS familias (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      email TEXT,
      telefono TEXT,
      plan TEXT,
      perfiles_maximos INTEGER,
      ubicacion TEXT,
      miembros TEXT,
      contacto_emergencia TEXT,
      preferencias TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS perfiles (
      id TEXT PRIMARY KEY,
      familia_id TEXT,
      persona TEXT,
      tipo_atencion TEXT,
      estado TEXT,
      ubicacion TEXT,
      horario TEXT,
      movilidad TEXT,
      habitos TEXT,
      competencias_requeridas TEXT,
      datos_sensibles TEXT,
      notas TEXT,
      actualizado_en INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS cuidadores (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      foto_url TEXT,
      anos_experiencia INTEGER,
      distancia_km INTEGER,
      tarifa_hora INTEGER,
      valoracion INTEGER,
      valoraciones INTEGER,
      disponibilidad TEXT,
      verificaciones TEXT,
      biografia TEXT,
      competencias TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS candidaturas (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      cuidador_id TEXT,
      estado TEXT,
      motivos_afinidad TEXT,
      mensaje TEXT,
      creada_en INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS configs_cuidador (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      horario_acordado TEXT,
      tarifa_acordada INTEGER,
      nota TEXT,
      permisos TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tareas (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      nombre TEXT,
      momento TEXT,
      hora TEXT,
      responsable_id TEXT,
      personalizada INTEGER,
      repeticion TEXT,
      fecha_aplicacion INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS registros_tarea (
      id TEXT PRIMARY KEY,
      tarea_id TEXT,
      fecha INTEGER,
      estado TEXT,
      responsable_id TEXT,
      nota TEXT,
      created_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS incidencias (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      fecha INTEGER,
      titulo TEXT,
      descripcion TEXT,
      responsable_id TEXT,
      estado TEXT,
      resolucion TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS servicios (
      id TEXT PRIMARY KEY,
      categoria TEXT,
      nombre TEXT,
      descripcion TEXT,
      condiciones TEXT,
      contratado INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS historial (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      categoria TEXT,
      fecha INTEGER,
      resumen TEXT,
      valor INTEGER,
      unidad TEXT,
      responsable_id TEXT,
      created_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS ajustes (
      id TEXT PRIMARY KEY,
      clave TEXT,
      valor TEXT,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS alertas (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      tipo TEXT,
      prioridad TEXT,
      titulo TEXT,
      mensaje TEXT,
      fecha_hora INTEGER,
      leida INTEGER,
      descartada INTEGER,
      accion TEXT,
      regla_id TEXT,
      escalada INTEGER,
      nivel_escalado_actual INTEGER,
      leida_en INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS reglas_alerta (
      id TEXT PRIMARY KEY,
      perfil_id TEXT,
      nombre TEXT,
      tipo TEXT,
      condicion TEXT,
      accion TEXT,
      escalado TEXT,
      activa INTEGER,
      ultima_ejecucion INTEGER,
      proxima_ejecucion INTEGER,
      veces_ejecutada INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS config_notificaciones (
      id TEXT PRIMARY KEY,
      clave TEXT,
      valor TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
  `);
}

export default {
  query,
  queryWithParams,
  run,
  insert,
  getOne,
  getAll,
  initDatabase,
};
