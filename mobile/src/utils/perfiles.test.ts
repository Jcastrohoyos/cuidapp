import { depurarDatosDePerfil, type DatosVinculadosAlPerfil } from './perfiles';
import type {
  CandidatoComparado,
  Cuidador,
  Incidencia,
  PerfilCuidado,
  RegistroHistorial,
  RegistroTarea,
  Tarea,
} from '@/types';

/** El helper solo lee `id` de los perfiles: un objeto mínimo basta. */
const crearPerfil = (id: string): PerfilCuidado => ({ id }) as PerfilCuidado;

const tarea = (id: string, perfilId: string): Tarea => ({
  id,
  perfilId,
  nombre: 'Paseo',
  momento: 'tarde',
  hora: '17:00',
  personalizada: false,
  repeticion: 'diaria',
});

const registro = (id: string, tareaId: string): RegistroTarea => ({
  id,
  tareaId,
  fecha: '2026-10-18',
  estado: 'realizada',
});

const incidencia = (id: string, perfilId: string): Incidencia => ({
  id,
  perfilId,
  fecha: '2026-10-18',
  titulo: 'Resbalón en el baño',
  estado: 'abierta',
});

const historial = (id: string, perfilId: string): RegistroHistorial => ({
  id,
  perfilId,
  categoria: 'movilidad',
  fecha: '2026-10-17',
  resumen: 'Caminó 20 minutos con andador',
});

const cuidador: Cuidador = {
  id: 'cui_1',
  nombre: 'Laura R.',
  anosExperiencia: 6,
  disponibilidad: 'mañanas',
  verificaciones: [],
};

const candidatura = (id: string, perfilId: string): CandidatoComparado => ({
  candidatura: {
    id,
    perfilId,
    cuidadorId: cuidador.id,
    estado: 'nueva',
    motivosAfinidad: ['Disponibilidad en la zona'],
    creadaEn: '2026-10-18T09:00:00.000Z',
  },
  cuidador,
});

const crearEstado = (
  sobre: Partial<DatosVinculadosAlPerfil> = {},
): DatosVinculadosAlPerfil => ({
  perfiles: [crearPerfil('per_1'), crearPerfil('per_2')],
  tareas: [tarea('tar_1', 'per_1'), tarea('tar_2', 'per_1'), tarea('tar_3', 'per_2')],
  registros: [registro('reg_1', 'tar_1'), registro('reg_2', 'tar_3')],
  incidencias: [incidencia('inc_1', 'per_1'), incidencia('inc_2', 'per_2')],
  candidatos: [candidatura('can_1', 'per_1'), candidatura('can_2', 'per_2')],
  historial: [historial('his_1', 'per_1'), historial('his_2', 'per_2')],
  configsCuidador: {
    per_1: { perfilId: 'per_1', permisos: {
      verDatosClinicos: false, editarRutina: true, verInformes: true,
      registrarIncidencias: true, avisarCompletadas: true,
    } },
    per_2: { perfilId: 'per_2', permisos: {
      verDatosClinicos: false, editarRutina: true, verInformes: true,
      registrarIncidencias: true, avisarCompletadas: true,
    } },
  },
  perfilActivoId: 'per_1',
  ...sobre,
});

describe('depurarDatosDePerfil', () => {
  it('elimina el perfil y conserva intactos los datos de los demás', () => {
    const depurado = depurarDatosDePerfil(crearEstado(), 'per_1');

    expect(depurado.perfiles.map((p) => p.id)).toEqual(['per_2']);
    expect(depurado.tareas.map((t) => t.id)).toEqual(['tar_3']);
    expect(depurado.incidencias.map((i) => i.id)).toEqual(['inc_2']);
    expect(depurado.candidatos.map((c) => c.candidatura.id)).toEqual(['can_2']);
    expect(depurado.historial.map((h) => h.id)).toEqual(['his_2']);
    expect(Object.keys(depurado.configsCuidador)).toEqual(['per_2']);
  });

  it('borra los registros de las tareas del perfil, con cualquier fecha', () => {
    const estado = crearEstado({
      registros: [registro('reg_1', 'tar_1'), registro('reg_2', 'tar_2'), registro('reg_3', 'tar_3')],
    });
    const depurado = depurarDatosDePerfil(estado, 'per_1');
    // reg_1 y reg_2 pertenecen a tareas de per_1; reg_3 es de per_2.
    expect(depurado.registros.map((r) => r.id)).toEqual(['reg_3']);
  });

  it('despeja el perfil activo solo si era el eliminado', () => {
    expect(depurarDatosDePerfil(crearEstado(), 'per_1').perfilActivoId).toBeNull();
    expect(depurarDatosDePerfil(crearEstado(), 'per_2').perfilActivoId).toBe('per_1');
  });

  it('sin coincidencias no toca nada (id inexistente)', () => {
    const estado = crearEstado();
    const depurado = depurarDatosDePerfil(estado, 'per_999');
    expect(depurado.perfiles).toHaveLength(2);
    expect(depurado.tareas).toHaveLength(3);
    expect(depurado.registros).toHaveLength(2);
    expect(depurado.perfilActivoId).toBe('per_1');
  });

  it('no muta la entrada: las colecciones originales quedan igual', () => {
    const estado = crearEstado();
    const copiaPerfiles = [...estado.perfiles];
    const copiaTareas = [...estado.tareas];

    depurarDatosDePerfil(estado, 'per_1');

    expect(estado.perfiles).toEqual(copiaPerfiles);
    expect(estado.tareas).toEqual(copiaTareas);
    expect(estado.perfiles).toHaveLength(2);
    expect(estado.configsCuidador.per_1).toBeDefined();
  });
});
