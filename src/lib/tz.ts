import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

export const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Bogota";

/**
 * Devuelve la fecha calendario "de hoy" en la zona horaria de la aplicación,
 * normalizada a medianoche UTC para almacenarse en columnas @db.Date sin
 * desplazamientos por huso horario (ver sección 42 del spec).
 */
export function todayDateOnlyUtc(reference: Date = new Date()): Date {
  return calendarDateOnlyUtc(reference);
}

export function calendarDateOnlyUtc(reference: Date): Date {
  const zoned = toZonedTime(reference, APP_TIMEZONE);
  return new Date(
    Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()),
  );
}

export function formatDateEs(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "dd/MM/yyyy");
}

/**
 * Formatea un valor de fecha PURA (columnas @db.Date como AttendanceSession.date,
 * o derivados como Alert.lastAbsenceDate), que se almacena como medianoche UTC
 * representando un día calendario, no un instante. Usar formatDateEs (que
 * convierte por zona horaria) aquí correría el día un día hacia atrás en
 * zonas UTC-negativas como America/Bogota. Se leen los componentes UTC
 * directamente porque ya codifican el día calendario correcto.
 */
export function formatDateOnlyEs(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** "Miércoles, 1 de octubre": fecha legible para encabezados (hoy, en la zona de la app). */
export function formatLongDateEs(date: Date = new Date()): string {
  const text = formatInTimeZone(date, APP_TIMEZONE, "EEEE, d 'de' MMMM", { locale: es });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Versión corta y legible para fechas PURAS (@db.Date): "lun 14 sep".
 * Igual que formatDateOnlyEs, lee los componentes UTC para no correr el día.
 */
export function formatShortDateOnlyEs(date: Date): string {
  const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${days[date.getUTCDay()]} ${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
}

export function formatTimeEs(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "HH:mm");
}

export function formatDateTimeEs(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "dd/MM/yyyy HH:mm");
}

/**
 * Hora actual (0-23) en la zona horaria de la aplicación. NO pasar el valor
 * de retorno de toZonedTime a formatDateEs/formatDateTimeEs: esas funciones
 * ya hacen su propia conversión de zona horaria sobre un instante absoluto,
 * y encadenarlas duplicaría el desplazamiento (ver corrección de la sección
 * 42 del spec: bug detectado durante prueba real del flujo docente).
 */
export function currentHourInAppTz(reference: Date = new Date()): number {
  return toZonedTime(reference, APP_TIMEZONE).getHours();
}

/** Nombre del día de la semana (en el enum DayOfWeek) para una fecha, en zona app. */
const DAY_NAMES = [
  "DOMINGO",
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
] as const;

export function dayOfWeekEs(date: Date = new Date()): (typeof DAY_NAMES)[number] {
  const zoned = toZonedTime(date, APP_TIMEZONE);
  return DAY_NAMES[zoned.getDay()]!;
}
