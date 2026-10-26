/**
 * Tests del almacén de datos: la lógica que decide a quién se ha asignado el
 * cuidado y qué datos cuelgan de cada persona a cargo.
 */

import { useDataStore } from './data-store';
import * as mocks from '@/api/mocks';
import type { CandidatoComparado, PerfilCuidado } from '@/types';

const perfil = (id: string): PerfilCuidado => ({ ...mocks.perfilDemo, id, persona: { ...mocks.perfilDemo.persona, id } });

const candidatos = (): CandidatoComparado[] =>
  mocks.candidatosDemo.map((c) => ({
    candidatura: { ...c.candidatura },
    cuidador: { ...c.cuidador },
  }));

const estadoDe = (id: string) =>
  useDataStore.getState().candidatos.find((c) => c.candidatura.id === id)?.candidatura.estado;

describe('seleccionarCandidatoEnPerfil', () => {
  beforeEach(() => {
    useDataStore.setState({
      perfiles: [perfil('per_1'), perfil('per_2')],
      candidatos: candidatos(),
    });
  });

  it('deja una sola candidatura seleccionada: la nueva', () => {
    // La semilla viene con Laura (cand_1) ya seleccionada.
    expect(estadoDe('cand_1')).toBe('seleccionada');

    useDataStore.getState().seleccionarCandidatoEnPerfil('cand_2');

    expect(estadoDe('cand_2')).toBe('seleccionada');
    // La anterior pasa a 'rechazada': "Mi cuidador" no debe seguir mostrando a Laura.
    expect(estadoDe('cand_1')).toBe('rechazada');
    expect(
      useDataStore.getState().candidatos.filter((c) => c.candidatura.estado === 'seleccionada'),
    ).toHaveLength(1);
  });

  it('al cambiar de cuidador dos veces sigue habiendo una sola selección', () => {
    useDataStore.getState().seleccionarCandidatoEnPerfil('cand_2');
    useDataStore.getState().seleccionarCandidatoEnPerfil('cand_3');

    expect(estadoDe('cand_3')).toBe('seleccionada');
    expect(estadoDe('cand_2')).toBe('rechazada');
    expect(estadoDe('cand_1')).toBe('rechazada');
    expect(
      useDataStore.getState().candidatos.filter((c) => c.candidatura.estado === 'seleccionada'),
    ).toHaveLength(1);
  });

  it('el perfil queda en "con_cuidador"', () => {
    useDataStore.getState().seleccionarCandidatoEnPerfil('cand_2');
    expect(useDataStore.getState().perfiles.find((p) => p.id === 'per_1')?.estado).toBe(
      'con_cuidador',
    );
  });

  it('no toca las candidaturas de otro perfil', () => {
    const ajena: CandidatoComparado = {
      candidatura: {
        id: 'cand_otro',
        perfilId: 'per_2',
        cuidadorId: 'cui_9',
        estado: 'seleccionada',
        motivosAfinidad: [],
        creadaEn: '2026-10-18T09:00:00.000Z',
      },
      cuidador: { ...mocks.candidatosDemo[0].cuidador, id: 'cui_9' },
    };
    useDataStore.setState({ candidatos: [...useDataStore.getState().candidatos, ajena] });

    useDataStore.getState().seleccionarCandidatoEnPerfil('cand_2');

    // La selección de otro perfil sigue intacta: cada persona a cargo tiene la suya.
    expect(estadoDe('cand_otro')).toBe('seleccionada');
  });

  it('una candidatura inexistente no cambia nada', () => {
    const antes = useDataStore.getState().candidatos;
    useDataStore.getState().seleccionarCandidatoEnPerfil('cand_no_existe');
    expect(useDataStore.getState().candidatos).toBe(antes);
  });
});

describe('agregarPerfil', () => {
  beforeEach(() => {
    useDataStore.setState({ perfiles: [perfil('per_1')], perfilActivoId: 'per_1' });
  });

  it('devuelve el perfil creado con su id', () => {
    const creado = useDataStore.getState().agregarPerfil({
      ...mocks.perfilDemo,
      id: undefined,
      familiaId: 'fam_1',
      persona: { id: 'per_nuevo', nombre: 'Elena' },
    });

    expect(creado.id).toBeTruthy();
    expect(useDataStore.getState().perfiles.map((p) => p.id)).toContain(creado.id);
  });

  it('deja el perfil nuevo como activo', () => {
    const creado = useDataStore.getState().agregarPerfil({
      ...mocks.perfilDemo,
      id: undefined,
      familiaId: 'fam_1',
      persona: { id: 'per_nuevo', nombre: 'Elena' },
    });

    expect(useDataStore.getState().perfilActivoId).toBe(creado.id);
  });
});

describe('agregarRegistro', () => {
  it('devuelve el registro ya persistido (mismo id)', () => {
    useDataStore.setState({ registros: [] });
    const creado = useDataStore.getState().agregarRegistro({
      tareaId: 'tar_1',
      fecha: '2026-10-20',
      estado: 'realizada',
    });

    const guardados = useDataStore.getState().registros;
    expect(guardados).toHaveLength(1);
    expect(creado.id).toBe(guardados[0].id);
  });
});
