/**
 * Tests de la capa de endpoints en modo demo: cada persona a cargo debe ver
 * solo sus datos (tareas, candidaturas y registros).
 */

import { endpoints } from './endpoints';
import { useDataStore } from '@/store/data-store';
import * as mocks from '@/api/mocks';
import { fechaHoy } from '@/utils/format';
import type { CandidatoComparado, Incidencia, PerfilCuidado, RegistroTarea, Tarea } from '@/types';

const perfil = (id: string, nombre: string): PerfilCuidado => ({
  ...mocks.perfilDemo,
  id,
  persona: { ...mocks.perfilDemo.persona, id, nombre },
});

const tarea = (id: string, perfilId: string): Tarea => ({
  id,
  perfilId,
  nombre: `Tarea de ${perfilId}`,
  momento: 'manana',
  hora: '09:00',
  personalizada: false,
  repeticion: 'diaria',
});

const registro = (id: string, tareaId: string, fecha: string): RegistroTarea => ({
  id,
  tareaId,
  fecha,
  estado: 'realizada',
});

const incidencia = (id: string, perfilId: string): Incidencia => ({
  id,
  perfilId,
  fecha: fechaHoy(),
  titulo: `Incidencia de ${perfilId}`,
  estado: 'abierta',
});

const candidatura = (id: string, perfilId: string): CandidatoComparado => ({
  candidatura: {
    id,
    perfilId,
    cuidadorId: 'cui_9',
    estado: 'nueva',
    motivosAfinidad: [],
    creadaEn: '2026-10-18T09:00:00.000Z',
  },
  cuidador: { ...mocks.candidatosDemo[0].cuidador, id: 'cui_9' },
});

describe('endpoints · aislamiento por perfil', () => {
  const hoy = fechaHoy();
  const ayer = '2026-10-19';

  beforeEach(() => {
    useDataStore.setState({
      perfiles: [perfil('per_1', 'Carmen'), perfil('per_2', 'Elena')],
      tareas: [tarea('tar_1', 'per_1'), tarea('tar_2', 'per_1'), tarea('tar_e1', 'per_2')],
      registros: [
        registro('reg_1', 'tar_1', hoy),
        registro('reg_2', 'tar_2', ayer),
        registro('reg_e1', 'tar_e1', hoy),
      ],
      incidencias: [incidencia('inc_1', 'per_1'), incidencia('inc_e1', 'per_2')],
      candidatos: [candidatura('cand_1', 'per_1'), candidatura('cand_e1', 'per_2')],
    });
  });

  it('listarTareas devuelve solo las tareas del perfil', async () => {
    const tareas = await endpoints.listarTareas('per_1');
    expect(tareas.map((t) => t.id)).toEqual(['tar_1', 'tar_2']);
    expect(tareas.every((t) => t.perfilId === 'per_1')).toBe(true);
  });

  it('listarTareas del segundo perfil no incluye las del primero', async () => {
    const tareas = await endpoints.listarTareas('per_2');
    expect(tareas.map((t) => t.id)).toEqual(['tar_e1']);
  });

  it('listarCandidatos devuelve solo las candidaturas del perfil', async () => {
    const candidatos = await endpoints.listarCandidatos('per_1');
    expect(candidatos.map((c) => c.candidatura.id)).toEqual(['cand_1']);
  });

  it('listarCandidatos del segundo perfil no incluye las del primero', async () => {
    const candidatos = await endpoints.listarCandidatos('per_2');
    expect(candidatos.map((c) => c.candidatura.id)).toEqual(['cand_e1']);
  });

  it('listarRegistros devuelve solo los registros de las tareas del perfil', async () => {
    const registros = await endpoints.listarRegistros('per_1', hoy);
    // reg_e1 pertenece a la tarea de Elena: no puede aparecer en la rutina de Carmen.
    expect(registros.map((r) => r.id)).toEqual(['reg_1']);
  });

  it('listarRegistros del segundo perfil no mezcla los del primero', async () => {
    const registros = await endpoints.listarRegistros('per_2', hoy);
    expect(registros.map((r) => r.id)).toEqual(['reg_e1']);
  });

  it('listarRegistros respeta la fecha', async () => {
    const registros = await endpoints.listarRegistros('per_1', ayer);
    expect(registros.map((r) => r.id)).toEqual(['reg_2']);
  });

  it('listarIncidencias devuelve solo las del perfil', async () => {
    const incidencias = await endpoints.listarIncidencias('per_1');
    expect(incidencias.map((i) => i.id)).toEqual(['inc_1']);
  });
});

describe('endpoints · registros y invariantes', () => {
  beforeEach(() => {
    useDataStore.setState({
      perfiles: [perfil('per_1', 'Carmen'), perfil('per_2', 'Elena')],
      tareas: [tarea('tar_1', 'per_1')],
      registros: [],
    });
  });

  it('registrarTarea devuelve el registro ya persistido (mismo id)', async () => {
    const registro = await endpoints.registrarTarea('tar_1', 'realizada');

    const guardados = useDataStore.getState().registros;
    expect(guardados).toHaveLength(1);
    // El id devuelto debe ser el del registro guardado: si no, la app y el
    // almacén discrepan del mismo cambio.
    expect(registro.id).toBe(guardados[0].id);
    expect(registro.tareaId).toBe('tar_1');
    expect(registro.estado).toBe('realizada');
  });

  it('actualizarPerfil ignora el estado (no lo decide el cliente)', async () => {
    useDataStore.setState({
      perfiles: [{ ...perfil('per_1', 'Carmen'), estado: 'borrador' }],
    });

    const actualizado = await endpoints.actualizarPerfil('per_1', { estado: 'con_cuidador' });

    // El cliente no puede saltar al estado "con_cuidador": eso lo decide la
    // selección real del cuidador.
    expect(actualizado.estado).toBe('borrador');
  });

  it('actualizarPerfil rechaza hacer públicos los datos sensibles', async () => {
    await expect(
      endpoints.actualizarPerfil('per_1', {
        datosSensibles: { visibleEnOferta: true } as never,
      }),
    ).rejects.toThrow(/públicos/i);
  });
});

describe('endpoints · cuenta de la familia', () => {  beforeEach(() => {
    useDataStore.setState({ familia: { ...mocks.familiaDemo } });
  });

  it('iniciarSesion devuelve la cuenta con el correo con el que se entra', async () => {
    const sesion = await endpoints.iniciarSesion('Mi.Familia@Correo.com', 'demo1234');
    expect(sesion.familia.email).toBe('mi.familia@correo.com');
    // El nombre visible se deriva del correo con el que se entra.
    expect(sesion.familia.nombre).toBe('Mi Familia');
  });

  it('iniciarSesion con el correo de ejemplo conserva la familia de la demo', async () => {
    const sesion = await endpoints.iniciarSesion('ana.martinez@email.com', 'demo1234');
    expect(sesion.familia.nombre).toBe(mocks.familiaDemo.nombre);
    expect(sesion.familia.email).toBe(mocks.familiaDemo.email);
  });

  it('obtenerFamilia devuelve la cuenta guardada, no la de ejemplo', async () => {
    // Si devolviera la de ejemplo, al restaurar la sesión se pisaría el
    // correo con el que se entró.
    useDataStore.getState().actualizarFamilia({ email: 'mi.familia@correo.com' });

    const familia = await endpoints.obtenerFamilia();

    expect(familia.email).toBe('mi.familia@correo.com');
  });
});

describe('endpoints · informe honesto', () => {
  beforeEach(() => {
    useDataStore.setState({
      perfiles: [perfil('per_1', 'Carmen')],
      tareas: [tarea('tar_1', 'per_1')],
      registros: [],
      incidencias: [],
      candidatos: [],
    });
  });

  it('el periodo es la semana en curso, no una ventana inventada', async () => {
    const informe = await endpoints.obtenerInforme('per_1');
    const lunes = new Date(informe.periodo.desde + 'T00:00:00');
    expect(lunes.getDay()).toBe(1); // lunes
    expect(informe.periodo.hasta >= informe.periodo.desde).toBe(true);
  });

  it('las tareas programadas se cuentan por los días transcurridos', async () => {
    const informe = await endpoints.obtenerInforme('per_1');
    // Una tarea diaria: se programa cada día ya transcurrido de la semana.
    const adhesion = informe.adherencia.find((a) => a.tareaId === 'tar_1');
    expect(adhesion?.programadas).toBeGreaterThan(0);
    expect(adhesion?.programadas).toBeLessThanOrEqual(7);
    expect(informe.tareasTotales).toBe(adhesion?.programadas);
  });

  it('no inventa una valoración si no hay cuidador asignado', async () => {
    const informe = await endpoints.obtenerInforme('per_1');
    expect(informe.valoracion).toBeUndefined();
  });

  it('la valoración sale de las reseñas reales del cuidador', async () => {
    useDataStore.setState({
      candidatos: [
        {
          candidatura: {
            id: 'cand_1',
            perfilId: 'per_1',
            cuidadorId: 'cui_1',
            estado: 'seleccionada',
            motivosAfinidad: [],
            creadaEn: '2026-10-18T09:00:00.000Z',
          },
          cuidador: { ...mocks.candidatosDemo[0].cuidador, valoracion: 4.9, valoraciones: 27 },
        },
      ],
    });

    const informe = await endpoints.obtenerInforme('per_1');

    expect(informe.valoracion).toBe(4.9);
  });
});
