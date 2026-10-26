/**
 * Tests unitarios del evaluador de condiciones (lógica pura).
 * Sin dependencias de BD, 100% deterministas.
 */

import { evaluarCondicion, obtenerProximaEvaluacion } from '../evaluar-condicion';
import type { ReglaCondicion, ContextoEvaluacion } from '../tipos';
import type { RegistroHistorial, Tarea } from '@/types';

const crearContexto = (overrides: Partial<ContextoEvaluacion> = {}): ContextoEvaluacion => ({
  ahora: new Date('2026-10-23T10:00:00.000Z'), // Viernes 10:00
  perfilId: 'per_1',
  tareas: [],
  registrosTarea: [],
  historialSignos: [],
  ...overrides,
});

const historialConGlucosa = (valor: number, haceMinutos = 30): RegistroHistorial[] => [{
  id: 'his_1',
  perfilId: 'per_1',
  categoria: 'mediciones',
  fecha: new Date(Date.now() - haceMinutos * 60 * 1000).toISOString().split('T')[0],
  resumen: 'Glucosa',
  valor,
  unidad: 'mg/dL',
  responsableId: 'fam_1',
}];

const historialConTension = (sistolica: number, diastolica: number): RegistroHistorial[] => [
  {
    id: 'his_1',
    perfilId: 'per_1',
    categoria: 'mediciones',
    fecha: new Date(Date.now() - 30 * 60 * 1000).toISOString().split('T')[0],
    resumen: 'Tensión arterial',
    valor: sistolica,
    unidad: 'mmHg',
    responsableId: 'fam_1',
  },
  {
    id: 'his_2',
    perfilId: 'per_1',
    categoria: 'mediciones',
    fecha: new Date(Date.now() - 30 * 60 * 1000).toISOString().split('T')[0],
    resumen: 'Tensión arterial',
    valor: diastolica,
    unidad: 'mmHg',
    responsableId: 'fam_1',
  },
];

describe('evaluarCondicion - Signos Vitales (umbral)', () => {
  test('glucosa > 180 → cumple', () => {
    const condicion: ReglaCondicion = {
      tipoValor: 'glucosa',
      operador: '>',
      umbral: 180,
    };
    const ctx = crearContexto({ historialSignos: historialConGlucosa(200) });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
    expect(r.datosExtra?.valorActual).toBe(200);
  });

  test('glucosa <= 180 → no cumple', () => {
    const condicion: ReglaCondicion = {
      tipoValor: 'glucosa',
      operador: '<=',
      umbral: 180,
    };
    const ctx = crearContexto({ historialSignos: historialConGlucosa(200) });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(false);
  });

  test('sin historial → no cumple', () => {
    const condicion: ReglaCondicion = {
      tipoValor: 'glucosa',
      operador: '>',
      umbral: 180,
    };
    const ctx = crearContexto({ historialSignos: [] });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(false);
  });

  test('tension_sistolica >= 140 → cumple', () => {
    const condicion: ReglaCondicion = {
      tipoValor: 'tension_sistolica',
      operador: '>=',
      umbral: 140,
    };
    const ctx = crearContexto({ historialSignos: historialConTension(145, 90) });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
  });

  test('temperatura > 38 → cumple (fiebre)', () => {
    const condicion: ReglaCondicion = {
      tipoValor: 'temperatura',
      operador: '>',
      umbral: 38,
    };
    const ctx = crearContexto({
      historialSignos: [{
        id: 'his_1',
        perfilId: 'per_1',
        categoria: 'mediciones',
        fecha: new Date().toISOString().split('T')[0],
        resumen: 'Temperatura',
        valor: 38.5,
        unidad: '°C',
        responsableId: 'fam_1',
      }]
    });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
  });
});

describe('evaluarCondicion - Medicación (hora fija diaria)', () => {
  test('hora exacta → cumple', () => {
    const condicion: ReglaCondicion = {
      hora: '10:00',
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-23T10:00:00.000Z') });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
    expect(r.proximaFecha).toBeDefined();
  });

  test('30 min después de hora → cumple (ventana tardía)', () => {
    const condicion: ReglaCondicion = {
      hora: '10:00',
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-23T10:25:00.000Z') });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
  });

  test('45 min después → no cumple (ventana expirada)', () => {
    const condicion: ReglaCondicion = {
      hora: '10:00',
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-23T10:45:00.000Z') });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(false);
  });

  test('antes de hora → no cumple', () => {
    const condicion: ReglaCondicion = {
      hora: '10:00',
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-23T09:30:00.000Z') });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(false);
    expect(r.proximaFecha).toBeDefined();
  });
});

describe('evaluarCondicion - Medicación (días de semana)', () => {
  test('viernes en días permitidos [1,3,5] → cumple si es hora', () => {
    const condicion: ReglaCondicion = {
      hora: '10:00',
      diasSemana: [1, 3, 5], // Lun, Mié, Vie
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-23T10:00:00.000Z') }); // Viernes
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
  });

  test('sábado NO en días permitidos [1,3,5] → no cumple', () => {
    const condicion: ReglaCondicion = {
      hora: '10:00',
      diasSemana: [1, 3, 5],
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-24T10:00:00.000Z') }); // Sábado
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(false);
  });
});

describe('evaluarCondicion - Cada N horas', () => {
  test('cada 8 horas desde medianoche → cumple en ventana', () => {
    const condicion: ReglaCondicion = {
      horasEntreTomas: 8,
      hora: '00:00', // Base medianoche
    };
    // 08:00, 16:00, 00:00...
    const ctx = crearContexto({ ahora: new Date('2026-10-23T08:10:00.000Z') });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.cumple).toBe(true);
  });

  test('cada 6 horas → próxima calculada', () => {
    const condicion: ReglaCondicion = {
      horasEntreTomas: 6,
    };
    const ctx = crearContexto({ ahora: new Date('2026-10-23T10:00:00.000Z') });
    const r = evaluarCondicion(condicion, ctx);
    expect(r.proximaFecha).toBeDefined();
  });
});

describe('evaluarCondicion - Cita (recordatorios previos)', () => {
  // Usar fecha ISO con timezone UTC explícito para evitar problemas de parseISO
  const FECHA_CITA = '2026-10-25T00:00:00.000Z';
  const citaCondicion: ReglaCondicion = {
    fechaCita: FECHA_CITA,
    recordatoriosPrevios: [1440, 60, 15], // 1 día, 1h, 15min antes
  };

  test('1 día antes (2026-10-24T00:00:00Z) → cumple', () => {
    const ctx = crearContexto({ ahora: new Date('2026-10-24T00:00:00.000Z') });
    const r = evaluarCondicion(citaCondicion, ctx);
    expect(r.cumple).toBe(true);
    expect(r.datosExtra?.minutosAntes).toBe(1440);
  });

  test('1 hora antes (2026-10-24T23:00:00Z) → cumple', () => {
    const ctx = crearContexto({ ahora: new Date('2026-10-24T23:00:00.000Z') });
    const r = evaluarCondicion(citaCondicion, ctx);
    expect(r.cumple).toBe(true);
    expect(r.datosExtra?.minutosAntes).toBe(60);
  });

  test('15 min antes (2026-10-24T23:45:00Z) → cumple', () => {
    const ctx = crearContexto({ ahora: new Date('2026-10-24T23:45:00.000Z') });
    const r = evaluarCondicion(citaCondicion, ctx);
    expect(r.cumple).toBe(true);
    expect(r.datosExtra?.minutosAntes).toBe(15);
  });

  test('2 días antes → no cumple (no en lista)', () => {
    const ctx = crearContexto({ ahora: new Date('2026-10-23T10:00:00.000Z') });
    const r = evaluarCondicion(citaCondicion, ctx);
    expect(r.cumple).toBe(false);
    expect(r.proximaFecha).toBeDefined(); // Próximo: 1 día antes
  });
});

describe('obtenerProximaEvaluacion', () => {
  test('hora fija → devuelve próxima ocurrencia', () => {
    const condicion: ReglaCondicion = { hora: '10:00' };
    const proxima = obtenerProximaEvaluacion(condicion, new Date('2026-10-23T09:00:00.000Z'));
    expect(proxima).toBeDefined();
    expect(proxima!.getUTCHours()).toBe(10);
    expect(proxima!.getUTCMinutes()).toBe(0);
  });

  test('cada 8h desde medianoche → devuelve próxima ocurrencia', () => {
    const condicion: ReglaCondicion = { horasEntreTomas: 8 };
    // A las 07:00 UTC, la próxima desde medianoche (0, 8, 16...) es 08:00 UTC
    const proxima = obtenerProximaEvaluacion(condicion, new Date('2026-10-23T07:00:00.000Z'));
    expect(proxima).toBeDefined();
    expect(proxima!.getUTCHours()).toBe(8);
  });

  test('cada 8h → a las 10:00 UTC la próxima es 16:00 UTC', () => {
    const condicion: ReglaCondicion = { horasEntreTomas: 8 };
    const proxima = obtenerProximaEvaluacion(condicion, new Date('2026-10-23T10:00:00.000Z'));
    expect(proxima).toBeDefined();
    expect(proxima!.getUTCHours()).toBe(16);
  });
});