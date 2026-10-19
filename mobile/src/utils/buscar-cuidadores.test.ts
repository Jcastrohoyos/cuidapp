/**
 * Tests de los filtros de la pestaña Buscar. Cubren cada chip de la demo por
 * separado y combinados, más los bordes honestos (sin distancia registrada,
 * sin franjas pedidas, sin verificaciones mínimas).
 */
import type { Cuidador } from '@/types';
import {
  filtrarCuidadores,
  UMBRAL_VALORACION_BUSCADA,
  type CriteriosBusqueda,
} from './buscar-cuidadores';

const LAURA: Cuidador = {
  id: 'cui_1',
  nombre: 'Laura R.',
  anosExperiencia: 6,
  distanciaKm: 3.2,
  tarifaHora: 12,
  valoracion: 4.9,
  valoraciones: 27,
  disponibilidad: 'Lun–Vie · mañanas',
  competencias: ['Movilidad reducida', 'Diabetes'],
  biografia: 'Seis años de atención geriátrica a domicilio.',
  verificaciones: [
    { tipo: 'identidad', estado: 'verificada' },
    { tipo: 'penales', estado: 'verificada' },
  ],
};

const MARTA: Cuidador = {
  id: 'cui_2',
  nombre: 'Marta S.',
  anosExperiencia: 4,
  distanciaKm: 5.1,
  tarifaHora: 11,
  valoracion: 4.8,
  valoraciones: 19,
  disponibilidad: 'Lun–Sáb · tardes',
  competencias: ['Memoria', 'Diabetes'],
  biografia: 'Auxiliar de enfermería.',
  verificaciones: [
    { tipo: 'identidad', estado: 'verificada' },
    { tipo: 'penales', estado: 'pendiente' },
  ],
};

const CARLOS: Cuidador = {
  id: 'cui_3',
  nombre: 'Carlos D.',
  anosExperiencia: 3,
  distanciaKm: 2.4,
  tarifaHora: 10,
  valoracion: 4.7,
  valoraciones: 12,
  disponibilidad: 'Lun–Dom · mediodía y noche',
  competencias: ['Primeros auxilios'],
  verificaciones: [
    { tipo: 'identidad', estado: 'verificada' },
    { tipo: 'penales', estado: 'verificada' },
  ],
};

const TODOS = [LAURA, MARTA, CARLOS];

/** Criterios por defecto: sin ningún filtro activo. */
function criterios(extras: Partial<CriteriosBusqueda> = {}): CriteriosBusqueda {
  return {
    texto: '',
    cercaDe: false,
    distanciaMaxKm: 10,
    porDisponibilidad: false,
    franjas: [],
    soloVerificados: false,
    verificacionesMinimas: [],
    mejorValorados: false,
    ...extras,
  };
}

const ids = (lista: Cuidador[]) => lista.map((c) => c.id);

describe('filtrarCuidadores', () => {
  it('devuelve todos los cuidadores sin filtros', () => {
    expect(ids(filtrarCuidadores(TODOS, criterios()))).toEqual(['cui_1', 'cui_2', 'cui_3']);
  });

  it('un texto vacío o en blanco no filtra', () => {
    expect(filtrarCuidadores(TODOS, criterios({ texto: '   ' }))).toHaveLength(3);
  });

  it('el texto ignora acentos y mayúsculas (biografía)', () => {
    const resultado = filtrarCuidadores(TODOS, criterios({ texto: 'GERIATRICA' }));
    expect(ids(resultado)).toEqual(['cui_1']);
  });

  it('el texto también busca por competencias y nombre', () => {
    expect(ids(filtrarCuidadores(TODOS, criterios({ texto: 'movilidad' })))).toEqual(['cui_1']);
    expect(ids(filtrarCuidadores(TODOS, criterios({ texto: 'marta' })))).toEqual(['cui_2']);
  });

  it('el chip de distancia excluye a quien pase de N km', () => {
    const resultado = filtrarCuidadores(TODOS, criterios({ cercaDe: true, distanciaMaxKm: 4 }));
    expect(ids(resultado)).toEqual(['cui_1', 'cui_3']);
  });

  it('sin distancia registrada el chip de cerca no descarta (nada inventado)', () => {
    const sinDistancia: Cuidador = { ...CARLOS, distanciaKm: undefined };
    const resultado = filtrarCuidadores([sinDistancia], criterios({ cercaDe: true }));
    expect(resultado).toHaveLength(1);
  });

  it('el chip de disponibilidad exige franja de la familia', () => {
    const resultado = filtrarCuidadores(TODOS, criterios({
      porDisponibilidad: true,
      franjas: ['manana', 'tarde'],
    }));
    expect(ids(resultado)).toEqual(['cui_1', 'cui_2']);
  });

  it('con franjas vacías el chip de disponibilidad no descarta a nadie', () => {
    expect(filtrarCuidadores(TODOS, criterios({ porDisponibilidad: true }))).toHaveLength(3);
  });

  it('el chip de verificados exige las mínimas pedidas por la familia', () => {
    const resultado = filtrarCuidadores(TODOS, criterios({
      soloVerificados: true,
      verificacionesMinimas: ['identidad', 'penales'],
    }));
    // Marta tiene los penales pendientes: no pasa.
    expect(ids(resultado)).toEqual(['cui_1', 'cui_3']);
  });

  it('sin verificaciones mínimas el chip de verificados no descarta a nadie', () => {
    expect(filtrarCuidadores(TODOS, criterios({ soloVerificados: true }))).toHaveLength(3);
  });

  it('el chip de valoración usa el umbral 4,5 incluyéndolo', () => {
    const justa: Cuidador = { ...CARLOS, valoracion: UMBRAL_VALORACION_BUSCADA };
    const resultado = filtrarCuidadores(
      [...TODOS, justa],
      criterios({ mejorValorados: true }),
    );
    // 4,4 no pasa; 4,5 sí (umbral incluyente).
    const menor: Cuidador = { ...CARLOS, id: 'cui_9', valoracion: 4.4 };
    expect(ids(filtrarCuidadores([...TODOS, menor], criterios({ mejorValorados: true }))))
      .toEqual(['cui_1', 'cui_2', 'cui_3']);
    expect(ids(resultado)).toEqual(['cui_1', 'cui_2', 'cui_3', 'cui_3']);
  });

  it('combina texto + chips por intersección', () => {
    const resultado = filtrarCuidadores(TODOS, criterios({
      texto: 'diabetes',
      cercaDe: true,
      distanciaMaxKm: 6,
      mejorValorados: true,
    }));
    // Laura y Marta declaran Diabetes y están a menos de 6 km.
    expect(ids(resultado)).toEqual(['cui_1', 'cui_2']);
  });
});
