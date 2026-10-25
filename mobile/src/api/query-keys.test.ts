/**
 * Tests de las claves de caché: dos consultas con parámetros distintos no
 * pueden compartir la misma entrada de React Query.
 */

import { qk } from './query-keys';

describe('qk.historial', () => {
  it('incluye los filtros en la clave', () => {
    const cinco = qk.historial('per_1', { limite: 5 });
    const veinte = qk.historial('per_1', { limite: 20 });
    expect(cinco).not.toEqual(veinte);
  });

  it('distingue por rango de fechas', () => {
    const desde = qk.historial('per_1', { desde: '2026-10-01' });
    const hasta = qk.historial('per_1', { hasta: '2026-10-20' });
    expect(desde).not.toEqual(hasta);
  });

  it('la misma consulta produce la misma clave', () => {
    expect(qk.historial('per_1', { limite: 5 })).toEqual(qk.historial('per_1', { limite: 5 }));
  });

  it('sin filtros también es una clave estable', () => {
    expect(qk.historial('per_1')).toEqual(qk.historial('per_1', undefined));
  });
});
