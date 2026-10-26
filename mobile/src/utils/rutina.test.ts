import { esHoraValida, tareasDelDia } from './rutina';
import type { Tarea } from '@/types';

const base: Omit<Tarea, 'id' | 'repeticion' | 'fechaAplicacion'> = {
  perfilId: 'per_1',
  nombre: 'Paseo',
  momento: 'tarde',
  hora: '17:00',
  personalizada: false,
};

const HOY = '2026-10-18';
const AYER = '2026-10-17';

describe('tareasDelDia', () => {
  it('mantiene siempre las tareas diarias', () => {
    const diaria: Tarea = { ...base, id: 'tar_1', repeticion: 'diaria' };
    expect(tareasDelDia([diaria], HOY)).toEqual([diaria]);
    expect(tareasDelDia([diaria], AYER)).toEqual([diaria]);
  });

  it('muestra la tarea puntual solo en su fecha de aplicación', () => {
    const unica: Tarea = { ...base, id: 'tar_2', repeticion: 'unica', fechaAplicacion: HOY };
    expect(tareasDelDia([unica], HOY)).toEqual([unica]);
    expect(tareasDelDia([unica], AYER)).toEqual([]);
  });

  it('una puntual sin fecha nunca se ve (dato incompleto, no tira hacia arriba)', () => {
    const unicaSinFecha: Tarea = { ...base, id: 'tar_3', repeticion: 'unica' };
    expect(tareasDelDia([unicaSinFecha], HOY)).toEqual([]);
  });

  it('mezcla diarias y puntuales respetando el orden original', () => {
    const tareas: Tarea[] = [
      { ...base, id: 'tar_1', repeticion: 'diaria' },
      { ...base, id: 'tar_2', repeticion: 'unica', fechaAplicacion: HOY },
      { ...base, id: 'tar_3', repeticion: 'unica', fechaAplicacion: AYER },
    ];
    expect(tareasDelDia(tareas, HOY).map((t) => t.id)).toEqual(['tar_1', 'tar_2']);
  });
});

describe('esHoraValida', () => {
  it('acepta horas en formato HH:MM', () => {
    expect(esHoraValida('09:00')).toBe(true);
    expect(esHoraValida('9:05')).toBe(true);
    expect(esHoraValida('23:59')).toBe(true);
  });

  it('rechaza formatos inválidos', () => {
    expect(esHoraValida('')).toBe(false);
    expect(esHoraValida('24:00')).toBe(false);
    expect(esHoraValida('12:60')).toBe(false);
    expect(esHoraValida('9 de la mañana')).toBe(false);
  });
});
