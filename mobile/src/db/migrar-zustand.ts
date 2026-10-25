import { getDatabase } from './index';
import { Familia, Perfil, Cuidador, Candidatura, ConfigCuidador, Tarea, RegistroTarea, Incidencia, Servicio, Historial, Ajuste } from './models';
import { useDataStore } from '@/store/data-store';
import SecureStore from 'expo-secure-store';

/**
 * Migración única: Zustand (v4) → WatermelonDB
 * 
 * Lee el estado completo de `cuidapp.demo_data.v4` de AsyncStorage
 * y lo vuelca en las tablas de WatermelonDB en una sola transacción.
 * 
 * Se ejecuta UNA SOLA VEZ al arrancar la app si no existe la marca de migración.
 */

const MIGRATION_KEY = 'cuidapp.migration.v4_to_watermelon.done';

interface ZustandState {
  familia?: any;
  perfiles?: any[];
  tareas?: any[];
  registros?: any[];
  incidencias?: any[];
  servicios?: any[];
  historial?: any[];
  candidatos?: any[];
  configsCuidador?: Record<string, any>;
  perfilActivoId?: string;
  [key: string]: any;
}

/**
 * Verifica si la migración ya se ejecutó
 */
async function isMigrationDone(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(MIGRATION_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Marca la migración como completada
 */
async function markMigrationDone(): Promise<void> {
  try {
    await SecureStore.setItemAsync(MIGRATION_KEY, 'true');
  } catch {
    // Silencioso
  }
}

/**
 * Convierte timestamp number a Date (WatermelonDB espera Date)
 */
function toDate(value: number | string | undefined): Date | undefined {
  if (value === undefined || value === null) return undefined;
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  return isNaN(n) ? undefined : new Date(n);
}

/**
 * Convierte ISO string a timestamp number
 */
function toTimestamp(value: string | number | Date | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? undefined : d.getTime();
}

/**
 * Ejecuta la migración completa
 */
async function migrateFromZustand(): Promise<void> {
  // 1. Verificar si ya se hizo
  if (await isMigrationDone()) {
    console.log('[Migration] Ya completada, omitiendo');
    return;
  }

  console.log('[Migration] Iniciando migración Zustand v4 → WatermelonDB...');

  // 2. Leer estado actual de Zustand
  const zustandState = useDataStore.getState() as any;

  if (!zustandState || Object.keys(zustandState).length === 0) {
    console.log('[Migration] Estado Zustand vacío, nada que migrar');
    await markMigrationDone();
    return;
  }

  const db = getDatabase();

  // 3. Ejecutar todo en una transacción atómica
  await db.action(async () => {
    // 3.1 Familia
    if (zustandState.familia) {
      const f = zustandState.familia;
      await db.get('familias').create((fam: any) => {
        fam._raw.id = f.id;
        fam.nombre = f.nombre;
        fam.email = f.email;
        fam.telefono = f.telefono;
        fam.plan = f.plan;
        fam.perfilesMaximos = f.perfilesMaximos ?? 1;
        fam.ubicacion = f.ubicacion ?? null;
        fam.miembros = f.miembros ?? [];
        fam.contactoEmergencia = f.contactoEmergencia ?? null;
        fam.preferencias = f.preferencias ?? {
          distanciaMaxKm: undefined,
          tarifaMaxHora: undefined,
          franjas: [],
          verificacionesMinimas: [],
        };
      });
      console.log('[Migration] Familia migrada:', f.id);
    }

    // 3.2 Perfiles
    if (zustandState.perfiles?.length) {
      for (const p of zustandState.perfiles) {
        await db.get('perfiles').create((perfil: any) => {
          perfil._raw.id = p.id;
          perfil.familiaId = p.familiaId;
          perfil.persona = p.persona;
          perfil.tipoAtencion = p.tipoAtencion;
          perfil.estado = p.estado;
          perfil.ubicacion = p.ubicacion;
          perfil.horario = p.horario;
          perfil.movilidad = p.movilidad;
          perfil.habitos = p.habitos ?? [];
          perfil.competenciasRequeridas = p.competenciasRequeridas ?? [];
          perfil.datosSensibles = p.datosSensibles ?? {
            visibleEnOferta: false,
          };
          perfil.notas = p.notas;
          perfil.actualizadoEn = toDate(p.actualizadoEn) ?? new Date();
        });
      }
      console.log('[Migration] Perfiles migrados:', zustandState.perfiles.length);
    }

    // 3.3 Cuidadores (de mocks o estado)
    if (zustandState.cuidadores?.length) {
      for (const c of zustandState.cuidadores) {
        await db.get('cuidadores').create((cuidador: any) => {
          cuidador._raw.id = c.id;
          cuidador.nombre = c.nombre;
          cuidador.fotoUrl = c.fotoUrl;
          cuidador.anosExperiencia = c.anosExperiencia ?? 0;
          cuidador.distanciaKm = c.distanciaKm;
          cuidador.tarifaHora = c.tarifaHora;
          cuidador.valoracion = c.valoracion;
          cuidador.valoraciones = c.valoraciones;
          cuidador.disponibilidad = c.disponibilidad ?? '';
          cuidador.verificaciones = c.verificaciones ?? [];
          cuidador.biografia = c.biografia;
          cuidador.competencias = c.competencias ?? [];
        });
      }
      console.log('[Migration] Cuidadores migrados:', zustandState.cuidadores.length);
    }

    // 3.4 Candidaturas
    if (zustandState.candidatos?.length) {
      for (const c of zustandState.candidatos) {
        await db.get('candidaturas').create((cand: any) => {
          cand._raw.id = c.id;
          cand.perfilId = c.perfilId;
          cand.cuidadorId = c.cuidadorId;
          cand.estado = c.estado ?? 'nueva';
          cand.motivosAfinidad = c.motivosAfinidad ?? [];
          cand.mensaje = c.mensaje;
          cand.creadaEn = toDate(c.creadaEn) ?? new Date();
        });
      }
      console.log('[Migration] Candidaturas migradas:', zustandState.candidatos.length);
    }

    // 3.5 Configs cuidador
    if (zustandState.configsCuidador) {
      for (const [perfilId, config] of Object.entries(zustandState.configsCuidador)) {
        await db.get('configs_cuidador').create((cfg: any) => {
          cfg._raw.id = `cfg_${perfilId}`;
          cfg.perfilId = perfilId;
          cfg.horarioAcordado = (config as any).horarioAcordado;
          cfg.tarifaAcordada = (config as any).tarifaAcordada;
          cfg.nota = (config as any).nota;
          cfg.permisos = (config as any).permisos ?? {
            verDatosClinicos: false,
            editarRutina: true,
            verInformes: true,
            registrarIncidencias: true,
            avisarCompletadas: true,
          };
        });
      }
      console.log('[Migration] Configs cuidador migradas:', Object.keys(zustandState.configsCuidador).length);
    }

    // 3.6 Tareas
    if (zustandState.tareas?.length) {
      for (const t of zustandState.tareas) {
        await db.get('tareas').create((tarea: any) => {
          tarea._raw.id = t.id;
          tarea.perfilId = t.perfilId;
          tarea.nombre = t.nombre;
          tarea.momento = t.momento;
          tarea.hora = t.hora;
          tarea.responsableId = t.responsableId;
          tarea.personalizada = t.personalizada ?? false;
          tarea.repeticion = t.repeticion ?? 'diaria';
          tarea.fechaAplicacion = toDate(t.fechaAplicacion);
        });
      }
      console.log('[Migration] Tareas migradas:', zustandState.tareas.length);
    }

    // 3.7 Registros de tarea
    if (zustandState.registros?.length) {
      for (const r of zustandState.registros) {
        await db.get('registros_tarea').create((reg: any) => {
          reg._raw.id = r.id;
          reg.tareaId = r.tareaId;
          reg.fecha = toDate(r.fecha) ?? new Date();
          reg.estado = r.estado ?? 'pendiente';
          reg.responsableId = r.responsableId;
          reg.nota = r.nota;
        });
      }
      console.log('[Migration] Registros migrados:', zustandState.registros.length);
    }

    // 3.8 Incidencias
    if (zustandState.incidencias?.length) {
      for (const i of zustandState.incidencias) {
        await db.get('incidencias').create((inc: any) => {
          inc._raw.id = i.id;
          inc.perfilId = i.perfilId;
          inc.fecha = toDate(i.fecha) ?? new Date();
          inc.titulo = i.titulo;
          inc.descripcion = i.descripcion;
          inc.responsableId = i.responsableId;
          inc.estado = i.estado ?? 'abierta';
          inc.resolucion = i.resolucion;
        });
      }
      console.log('[Migration] Incidencias migradas:', zustandState.incidencias.length);
    }

    // 3.9 Servicios
    if (zustandState.servicios?.length) {
      for (const s of zustandState.servicios) {
        await db.get('servicios').create((serv: any) => {
          serv._raw.id = s.id;
          serv.categoria = s.categoria;
          serv.nombre = s.nombre;
          serv.descripcion = s.descripcion;
          serv.condiciones = s.condiciones;
          serv.contratado = s.contratado ?? false;
        });
      }
      console.log('[Migration] Servicios migrados:', zustandState.servicios.length);
    }

    // 3.10 Historial
    if (zustandState.historial?.length) {
      for (const h of zustandState.historial) {
        await db.get('historial').create((hist: any) => {
          hist._raw.id = h.id;
          hist.perfilId = h.perfilId;
          hist.categoria = h.categoria;
          hist.fecha = toDate(h.fecha) ?? new Date();
          hist.resumen = h.resumen;
          hist.valor = h.valor;
          hist.unidad = h.unidad;
          hist.responsableId = h.responsableId;
        });
      }
      console.log('[Migration] Historial migrado:', zustandState.historial.length);
    }

    // 3.11 Ajustes (perfil activo, texto grande, etc.)
    if (zustandState.perfilActivoId) {
      await db.get('ajustes').create((aj: any) => {
        aj._raw.id = 'perfil_activo_id';
        aj.clave = 'perfil_activo_id';
        aj.valor = zustandState.perfilActivoId;
      });
    }

    console.log('[Migration] ¡Migración completada con éxito!');
  });

  // 4. Marcar como completada
  await markMigrationDone();
}


/**
 * Función helper para forzar re-migración (solo desarrollo)
 */
async function forceRemigrate(): Promise<void> {
  await SecureStore.deleteItemAsync(MIGRATION_KEY);
  await migrateFromZustand();
}

export { migrateFromZustand, isMigrationDone, markMigrationDone, forceRemigrate };