import { calcularAfinidad } from './afinidad';

describe('utils/afinidad', () => {
  it('devuelve null cuando la familia no pide competencias concretas', () => {
    expect(calcularAfinidad([], ['Memoria'])).toBeNull();
  });

  it('devuelve null cuando el cuidador no declara competencias', () => {
    expect(calcularAfinidad(['Memoria'], undefined)).toBeNull();
    expect(calcularAfinidad(['Memoria'], [])).toBeNull();
  });

  it('calcula el porcentaje de coincidencias redondeado', () => {
    expect(
      calcularAfinidad(['Movilidad reducida', 'Diabetes', 'Memoria', 'Primeros auxilios'], [
        'Movilidad reducida',
        'Diabetes',
        'Memoria',
        'Medicación',
      ]),
    ).toBe(75);
    expect(calcularAfinidad(['Memoria', 'Diabetes'], ['Diabetes'])).toBe(50);
  });

  it('ignora mayúsculas, acentos y espacios al comparar', () => {
    expect(calcularAfinidad(['Atención geriátrica'], ['  ATENCION GERIATRICA  '])).toBe(100);
    expect(calcularAfinidad(['Movilidad reducida'], ['movilidad reducida'])).toBe(100);
  });

  it('un cuidador que declara de más no penaliza', () => {
    expect(calcularAfinidad(['Memoria'], ['Memoria', 'Diabetes', 'Primeros auxilios'])).toBe(100);
  });
});
