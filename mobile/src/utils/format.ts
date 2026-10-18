import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/** Formatea fecha y hora: "13 oct, 12:30". */
export function formatearFechaHora(iso: string): string {
  return format(parseISO(iso), "d MMM, HH:mm", { locale: es });
}

/** Fecha actual en formato local yyyy-MM-dd (evita el desfase UTC de toISOString). */
export function fechaHoy(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Tiempo relativo: "hace 2 días". */
export function tiempoRelativo(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: es });
}

/** Edad en años a partir de una fecha de nacimiento ISO. */
export function calcularEdad(fechaNacimiento: string, referencia: Date = new Date()): number {
  const nacimiento = parseISO(fechaNacimiento);
  let edad = referencia.getFullYear() - nacimiento.getFullYear();
  const mes = referencia.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return edad;
}

/** Parte sobre total redondeada, acotada a 0..100. */
export function porcentaje(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((parte / total) * 100));
}

/** Importe en euros con formato es-ES: "12,00 €". */
export function formatearEuro(importe: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(importe);
}

/** Decimal con formato es-ES: 4.9 → "4,9". */
export function formatearDecimal(valor: number): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(valor);
}

/** Iniciales de un nombre: "Ana Martínez" -> "AM". */
export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

/** Horario legible: "Lun–Vie · 09:00–13:00". */
export function formatearHorario(dias: string[], desde: string, hasta: string): string {
  if (dias.length === 0) return `${desde}–${hasta}`;
  if (dias.length === 7) return `Todos los días · ${desde}–${hasta}`;
  return `${dias.length} días · ${desde}–${hasta}`;
}
