/**
 * Tests de la adherencia a la rutina: lo que se muestra en Informes sale de
 * aquí, así que se comprueba con fechas concretas y sin ambigüedades.
 */

import {
  calcularAdherencia,
  diasProgramados,
  diasTranscurridos,
  etiquetaSemana,
  estadoDelDia,
  periodoSemana,
} from './adherencia';
import type { RegistroTarea, Tarea } from '@/types';

const tarea = (id: string, repeticion: Tarea['repeticion'] = 'diaria', fecha?: string): Tarea => ({
  id,
  perfilId: 'per_1',
  nombre: `Tarea ${id}`,
  momento: 'manana',
  hora: '09:00',
  personalizada: false,
  repeticion,
  fechaAplicacion: fecha,
});

const registro = (id: string, tareaId: string, fecha: string, estado: RegistroTarea['estado'] = 'realizada'): RegistroTarea => ({
  id,
  tareaId,
  fecha,
  estado,
});

describe('periodoSemana', () => {
  it('va de lunes a domingo', () => {
    // 20/10/2026 es martes.
    const periodo = periodoSemana(new Date(2026, 9, 20));
    expect(periodo.desde).toBe('2026-10-19');
    expect(periodo.hasta).toBe('2026-10-25');
  });
});

describe('diasTranscurridos', () => {
  it('solo cuenta los días que ya han pasado', () => {
    const dias = diasTranscurridos('2026-10-19', '2026-10-25', '2026-10-20');
    expect(dias).toEqual(['2026-10-19', '2026-10-20']);
  });

  it('no cuenta días futuros', () => {
    const dias = diasTranscurridos('2026-10-19', '2026-10-25', '2026-10-18');
    expect(dias).toEqual([]);
  });
});

describe('diasProgramados', () => {
  it('una tarea diaria está programada cada día transcurrido', () => {
    const dias = diasProgramados(tarea('tar_1'), '2026-10-19', '2026-10-25', '2026-10-20');
    expect(dias).toEqual(['2026-10-19', '2026-10-20']);
  });

  it('una tarea puntual solo cuenta el día de aplicación', () => {
    const dias = diasProgramados(
      tarea('tar_2', 'unica', '2026-10-20'),
      '2026-10-19',
      '2026-10-25',
      '2026-10-21',
    );
    expect(dias).toEqual(['2026-10-20']);
  });

  it('una tarea puntual de otro día no cuenta', () => {
    const dias = diasProgramados(
      tarea('tar_3', 'unica', '2026-11-01'),
      '2026-10-19',
      '2026-10-25',
      '2026-10-21',
    );
    expect(dias).toEqual([]);
  });
});

describe('estadoDelDia', () => {
  it('devuelve el estado del único registro del día', () => {
    expect(estadoDelDia([registro('reg_1', 'tar_1', '2026-10-20')], 'tar_1', '2026-10-20')).toBe(
      'realizada',
    );
  });

  it('con varios registros del día manda el último (el más reciente)', () => {
    const registros = [
      registro('reg_1770000000000_0001', 'tar_1', '2026-10-20', 'pendiente'),
      registro('reg_1770000000000_0002', 'tar_1', '2026-10-20', 'realizada'),
    ];
    expect(estadoDelDia(registros, 'tar_1', '2026-10-20')).toBe('realizada');
  });

  it('sin registros devuelve null', () => {
    expect(estadoDelDia([], 'tar_1', '2026-10-20')).toBeNull();
  });
});

describe('calcularAdherencia', () => {
  it('cuenta realizadas sobre programadas, no sobre el total de tareas', () => {
    const tareas = [tarea('tar_1'), tarea('tar_2')];
    const registros = [
      registro('reg_1', 'tar_1', '2026-10-19'),
      registro('reg_2', 'tar_1', '2026-10-20'),
      registro('reg_3', 'tar_2', '2026-10-19'),
    ];

    const resultado = calcularAdherencia(tareas, registros, '2026-10-19', '2026-10-25', '2026-10-20');

    // 2 tareas × 2 días transcurridos = 4 programadas; 3 realizadas.
    expect(resultado.programadas).toBe(4);
    expect(resultado.realizadas).toBe(3);
    expect(resultado.porTarea).toEqual([
      { tareaId: 'tar_1', nombre: 'Tarea tar_1', realizadas: 2, programadas: 2 },
      { tareaId: 'tar_2', nombre: 'Tarea tar_2', realizadas: 1, programadas: 2 },
    ]);
  });

  it('no cuenta como incumplido lo que aún no ha pasado', () => {
    const resultado = calcularAdherencia(
      [tarea('tar_1')],
      [],
      '2026-10-19',
      '2026-10-25',
      '2026-10-20',
    );
    expect(resultado.programadas).toBe(2);
    expect(resultado.realizadas).toBe(0);
  });

  it('un día con registros intermedios cuenta solo el estado final', () => {
    const registros = [
      registro('reg_1', 'tar_1', '2026-10-20', 'realizada'),
      registro('reg_2', 'tar_1', '2026-10-20', 'pendiente'),
      registro('reg_3', 'tar_1', '2026-10-20', 'realizada'),
    ];
    const resultado = calcularAdherencia(
      [tarea('tar_1')],
      registros,
      '2026-10-20',
      '2026-10-25',
      '2026-10-20',
    );
    expect(resultado.realizadas).toBe(1);
  });
});

describe('etiquetaSemana', () => {
  it('usa el rango de la semana', () => {
    expect(etiquetaSemana('2026-10-12', '2026-10-18')).toBe('Semana del 12–18 de octubre');
  });

  it('une dos meses distintos', () => {
    expect(etiquetaSemana('2026-10-26', '2026-11-01')).toBe('Semana del 26 de oct–1 de nov');
  });
});
