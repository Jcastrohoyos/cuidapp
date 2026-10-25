/**
 * Tests de helpers y validadores.
 */

import {
  validarCondicion,
  validarAccion,
  validarEscalado,
  prioridadANumero,
  formatearFechaAlerta,
  generarId,
  estaEnNoMolestar,
} from '../helpers';

describe('validarCondicion', () => {
  test('signos_vitales válida', () => {
    const r = validarCondicion({
      tipoValor: 'glucosa',
      operador: '>',
      umbral: 180,
    });
    expect(r.valida).toBe(true);
    expect(r.errores).toHaveLength(0);
  });

  test('signos_vitales: tipoValor inválido', () => {
    const r = validarCondicion({
      tipoValor: 'colesterol' as any,
      operador: '>',
      umbral: 200,
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('tipoValor no válido');
  });

  test('signos_vitales: operador inválido', () => {
    const r = validarCondicion({
      tipoValor: 'glucosa',
      operador: '!=' as any,
      umbral: 180,
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('operador no válido');
  });

  test('cita válida', () => {
    const r = validarCondicion({
      fechaCita: '2026-10-25',
      recordatoriosPrevios: [1440, 60],
    });
    expect(r.valida).toBe(true);
  });

  test('cita: fecha inválida', () => {
    const r = validarCondicion({
      fechaCita: '25-10-2026',
      recordatoriosPrevios: [60],
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('fechaCita debe ser ISODate (YYYY-MM-DD)');
  });

  test('cita: recordatorios vacíos', () => {
    const r = validarCondicion({
      fechaCita: '2026-10-25',
      recordatoriosPrevios: [],
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('recordatoriosPrevios debe ser array no vacío');
  });

  test('temporal: hora válida', () => {
    const r = validarCondicion({ hora: '10:30' });
    expect(r.valida).toBe(true);
  });

  test('temporal: hora inválida', () => {
    const r = validarCondicion({ hora: '25:00' });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('hora debe ser HH:MM (0-23)');
  });

  test('temporal: horasEntreTomas válido', () => {
    const r = validarCondicion({ horasEntreTomas: 8 });
    expect(r.valida).toBe(true);
  });

  test('temporal: horasEntreTomas fuera de rango', () => {
    const r = validarCondicion({ horasEntreTomas: 25 });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('horasEntreTomas debe ser entero 1-24');
  });

  test('temporal: diasSemana válidos', () => {
    const r = validarCondicion({ diasSemana: [1, 3, 5] });
    expect(r.valida).toBe(true);
  });

  test('temporal: diasSemana inválidos', () => {
    const r = validarCondicion({ diasSemana: [0, 8] });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('diasSemana debe ser array de 1-7 (1=Lunes)');
  });
});

describe('validarAccion', () => {
  test('acción válida completa', () => {
    const r = validarAccion({
      tituloPlantilla: 'Hora de {medicamento}',
      mensajePlantilla: 'Toma {dosis} de {medicamento}',
      prioridadAlerta: 'alta',
      accion: { tipo: 'abrir_tarea', valor: 'task_1' },
    });
    expect(r.valida).toBe(true);
  });

  test('falta tituloPlantilla', () => {
    const r = validarAccion({ mensajePlantilla: 'Test' });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('tituloPlantilla requerido');
  });

  test('prioridadAlerta inválida', () => {
    const r = validarAccion({
      tituloPlantilla: 'Test',
      mensajePlantilla: 'Test',
      prioridadAlerta: 'urgente',
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('prioridadAlerta no válida');
  });

  test('accion.tipo inválido', () => {
    const r = validarAccion({
      tituloPlantilla: 'Test',
      mensajePlantilla: 'Test',
      accion: { tipo: 'navegar', valor: 'x' },
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('accion.tipo no válido');
  });
});

describe('validarEscalado', () => {
  test('escalado válido 2 niveles', () => {
    const r = validarEscalado({
      niveles: [
        { orden: 1, tipo: 'push_local', destinatario: 'cuidador', mensajePlantilla: 'Alerta', retrasoMinutos: 0, requiereConfirmacion: true },
        { orden: 2, tipo: 'contacto_emergencia', destinatario: 'contacto_emergencia', mensajePlantilla: 'Urgente', retrasoMinutos: 30, requiereConfirmacion: false },
      ],
      tiempoMaximoSinRespuesta: 60,
    });
    expect(r.valida).toBe(true);
  });

  test('niveles vacío', () => {
    const r = validarEscalado({ niveles: [], tiempoMaximoSinRespuesta: 60 });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('niveles requerido (array no vacío)');
  });

  test('orden incorrecto', () => {
    const r = validarEscalado({
      niveles: [
        { orden: 2, tipo: 'push_local', destinatario: 'cuidador', mensajePlantilla: 'x', retrasoMinutos: 0, requiereConfirmacion: true },
      ],
      tiempoMaximoSinRespuesta: 60,
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('nivel 1: orden debe ser 1');
  });

  test('tipo nivel inválido', () => {
    const r = validarEscalado({
      niveles: [
        { orden: 1, tipo: 'email', destinatario: 'cuidador', mensajePlantilla: 'x', retrasoMinutos: 0, requiereConfirmacion: true },
      ],
      tiempoMaximoSinRespuesta: 60,
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('nivel 1: tipo no válido');
  });

  test('telefono_personalizado sin teléfono', () => {
    const r = validarEscalado({
      niveles: [
        { orden: 1, tipo: 'sms', destinatario: 'telefono_personalizado', mensajePlantilla: 'x', retrasoMinutos: 0, requiereConfirmacion: true },
      ],
      tiempoMaximoSinRespuesta: 60,
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('nivel 1: telefono requerido para telefono_personalizado');
  });

  test('tiempoMaximoSinRespuesta inválido', () => {
    const r = validarEscalado({
      niveles: [
        { orden: 1, tipo: 'push_local', destinatario: 'cuidador', mensajePlantilla: 'x', retrasoMinutos: 0, requiereConfirmacion: true },
      ],
      tiempoMaximoSinRespuesta: 0,
    });
    expect(r.valida).toBe(false);
    expect(r.errores).toContain('tiempoMaximoSinRespuesta debe ser número >= 1');
  });
});

describe('prioridadANumero', () => {
  test('orden correcto', () => {
    expect(prioridadANumero('baja')).toBe(1);
    expect(prioridadANumero('media')).toBe(2);
    expect(prioridadANumero('alta')).toBe(3);
    expect(prioridadANumero('critica')).toBe(4);
  });
});

describe('formatearFechaAlerta', () => {
  test('formato español', () => {
    const fecha = new Date('2026-10-23T10:30:00.000Z');
    const r = formatearFechaAlerta(fecha);
    expect(r).toContain('23');
    expect(r).toContain('oct');
    expect(r).toContain('10:30');
  });

  test('acepta string ISO', () => {
    const r = formatearFechaAlerta('2026-10-23T10:30:00.000Z');
    expect(r).toContain('23');
  });
});

describe('generarId', () => {
  test('formato correcto', () => {
    const id = generarId('alt');
    expect(id).toMatch(/^alt_\d+_[a-z0-9]{6}$/);
  });

  test('únicos', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generarId('test'));
    }
    expect(ids.size).toBe(100);
  });
});

describe('estaEnNoMolestar', () => {
  const noMolestar = { activado: true, inicio: '22:00', fin: '08:00', permitirCriticas: true };

  test('dentro de rango (23:00) → true', () => {
    expect(estaEnNoMolestar(new Date('2026-10-23T23:00:00.000Z'), noMolestar, 'media')).toBe(true);
  });

  test('fuera de rango (10:00) → false', () => {
    expect(estaEnNoMolestar(new Date('2026-10-23T10:00:00.000Z'), noMolestar, 'media')).toBe(false);
  });

  test('crítica rompe no molestar', () => {
    expect(estaEnNoMolestar(new Date('2026-10-23T23:00:00.000Z'), noMolestar, 'critica')).toBe(false);
  });

  test('no molestar desactivado → false', () => {
    expect(estaEnNoMolestar(new Date('2026-10-23T23:00:00.000Z'), { ...noMolestar, activado: false }, 'media')).toBe(false);
  });

  test('rango mismo día (08:00-22:00)', () => {
    const nm = { activado: true, inicio: '08:00', fin: '22:00', permitirCriticas: false };
    expect(estaEnNoMolestar(new Date('2026-10-23T10:00:00.000Z'), nm, 'media')).toBe(true);
    expect(estaEnNoMolestar(new Date('2026-10-23T23:00:00.000Z'), nm, 'media')).toBe(false);
  });
});