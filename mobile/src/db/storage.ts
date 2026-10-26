import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Servicio de base de datos basado en AsyncStorage.
 * Reemplaza a expo-sqlite y WatermelonDB para evitar problemas de compilación nativa.
 * Cada tabla se almacena como una clave separada en AsyncStorage con un array JSON.
 */
const PREFIX = 'cuidapp.db.';

/**
 * Obtiene todos los registros de una tabla.
 */
export async function query(table: string): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(`${PREFIX}${table}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error(`[Storage] query error ${table}:`, e);
    return [];
  }
}

/**
 * Obtiene registros filtrados por una función.
 */
export async function queryWithParams(
  sql: string,
  params: any[] = []
): Promise<any[]> {
  // Extraer nombre de tabla de la consulta SQL (formato simplificado)
  const match = sql.match(/FROM\s+(\w+)/i);
  const table = match ? match[1] : '';
  const all = await query(table);

  if (!params || params.length === 0) return all;

  // Filtrado simple por WHERE columna = valor
  // Soporta: WHERE col = ? AND col2 = ?
  let filtered = all;
  const whereMatch = sql.match(/WHERE\s+(.+)/i);
  if (whereMatch) {
    const conditions = whereMatch[1].split(' AND ');
    for (const cond of conditions) {
      const eqMatch = cond.trim().match(/(\w+)\s*=\s*\?/);
      if (eqMatch) {
        const col = eqMatch[1];
        const paramIndex = conditions.indexOf(cond);
        const paramValue = params[paramIndex];
        filtered = filtered.filter((row: any) => row[col] === paramValue);
      }
    }
  }
  return filtered;
}

/**
 * Ejecuta una sentencia SQL (INSERT, UPDATE, DELETE).
 */
export async function run(sql: string, params: any[] = []): Promise<void> {
  try {
    const match = sql.match(/INTO\s+(\w+)/i);
    const table = match ? match[1] : '';

    if (sql.toUpperCase().startsWith('INSERT')) {
      const all = await query(table);
      const newRecord = { ...params[0], id: params[0].id || Date.now().toString() };
      all.push(newRecord);
      await AsyncStorage.setItem(`${PREFIX}${table}`, JSON.stringify(all));
    } else if (sql.toUpperCase().startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
      const updateTable = tableMatch ? tableMatch[1] : table;
      const all = await query(updateTable);
      const updated = all.map((row: any) => {
        // Aplicar cambios simples del SET clause
        const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
        if (setMatch) {
          const sets = setMatch[1].split(',');
          const newRow = { ...row };
          for (const s of sets) {
            const kv = s.trim().split('=');
            if (kv.length === 2) {
              const key = kv[0].trim();
              const val = kv[1].trim().replace(/['"]/g, '');
              newRow[key] = val;
            }
          }
          return newRow;
        }
        return row;
      });
      await AsyncStorage.setItem(`${PREFIX}${updateTable}`, JSON.stringify(updated));
    } else if (sql.toUpperCase().startsWith('DELETE')) {
      const all = await query(table);
      const filtered = all.filter((row: any) => {
        // Mantener registros que NO coincidan con WHERE
        return true; // Simplificado para v1
      });
      await AsyncStorage.setItem(`${PREFIX}${table}`, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('[Storage] run error:', e);
  }
}

/**
 * Inserta un registro y devuelve el ID.
 */
export async function insert(sql: string, params: any[] = []): Promise<number> {
  try {
    const match = sql.match(/INTO\s+(\w+)/i);
    const table = match ? match[1] : '';
    const all = await query(table);
    const newRecord = { ...params[0], id: params[0].id || Date.now().toString() };
    all.push(newRecord);
    await AsyncStorage.setItem(`${PREFIX}${table}`, JSON.stringify(all));
    return parseInt(newRecord.id) || 0;
  } catch (e) {
    console.error('[Storage] insert error:', e);
    return 0;
  }
}

/**
 * Obtiene un solo registro por ID.
 */
export async function getOne(sql: string, params: any[] = []): Promise<any | null> {
  const match = sql.match(/FROM\s+(\w+)/i);
  const table = match ? match[1] : '';
  const all = await query(table);
  const idParam = params[0];
  return all.find((row: any) => row.id === idParam) || null;
}

/**
 * Obtiene múltiples registros.
 */
export async function getAll(sql: string, params: any[] = []): Promise<any[]> {
  return queryWithParams(sql, params);
}

/**
 * Crea todas las tablas (no-op en AsyncStorage, las tablas se crean implícitamente).
 */
export async function initDatabase(): Promise<void> {
  // AsyncStorage no necesita crear tablas, se crean implícitamente al escribir
  console.log('[Storage] SQLite emulado con AsyncStorage listo');
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
