import { calcularEdad, formatearDecimal, formatearEuro, formatearHorario, iniciales, porcentaje } from './format';

describe('utils/format', () => {
  it('calcula la edad a partir de la fecha de nacimiento', () => {
    expect(calcularEdad('1943-05-12', new Date('2026-10-15T00:00:00Z'))).toBe(83);
    // Aún no ha cumplido años este año
    expect(calcularEdad('2000-12-31', new Date('2026-10-15T00:00:00Z'))).toBe(25);
  });

  it('acota el porcentaje entre 0 y 100', () => {
    expect(porcentaje(1, 2)).toBe(50);
    expect(porcentaje(5, 4)).toBe(100);
    expect(porcentaje(1, 0)).toBe(0);
  });

  it('genera iniciales de hasta dos palabras', () => {
    expect(iniciales('Ana Martínez')).toBe('AM');
    expect(iniciales('Carmen')).toBe('C');
  });

  it('describe el horario de forma legible', () => {
    const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
    expect(formatearHorario(dias as unknown as string[], '09:00', '13:00')).toBe(
      'Lun–Vie · 09:00–13:00',
    );
    expect(formatearHorario([], '09:00', '13:00')).toBe('09:00–13:00');
    expect(
      formatearHorario(
        ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
        '09:00',
        '13:00',
      ),
    ).toBe('Todos los días · 09:00–13:00');
    expect(formatearHorario(['sabado', 'domingo'], '10:00', '14:00')).toBe('Sáb–Dom · 10:00–14:00');
    // Un calendario irregular se nombra día a día, no se cuenta.
    expect(formatearHorario(['lunes', 'miercoles', 'viernes'], '09:00', '13:00')).toBe(
      'Lun · Mié · Vie · 09:00–13:00',
    );
  });

  it('formatea importes en euros', () => {
    // Intl usa espacio duro (NBSP) entre el número y el símbolo
    expect(formatearEuro(12).replace(/\u00A0/g, ' ')).toBe('12,00 €');
  });

  it('formatea decimales con coma española', () => {
    expect(formatearDecimal(4.9)).toBe('4,9');
    expect(formatearDecimal(4)).toBe('4,0');
  });
});
