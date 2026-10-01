/**
 * Textos legibles y tonos de color para los valores internos (enums) que
 * antes se mostraban tal cual en pantalla (p. ej. "EN_GESTION").
 */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const TONE_BADGE: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-brand-50 text-brand-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
};

type Labeled = { label: string; tone: Tone };

export const CASE_STATUS: Record<string, Labeled> = {
  PENDIENTE: { label: "Pendiente", tone: "danger" },
  EN_GESTION: { label: "En gestión", tone: "warning" },
  CONTACTADO: { label: "Contactado", tone: "success" },
  NO_CONTACTADO: { label: "No contactado", tone: "warning" },
  JUSTIFICADO: { label: "Justificado", tone: "info" },
  CERRADO: { label: "Cerrado", tone: "neutral" },
};

export const ALERT_LEVEL: Record<string, Labeled> = {
  ALERTA: { label: "Alerta", tone: "danger" },
  SEGUIMIENTO: { label: "Seguimiento", tone: "warning" },
  NORMAL: { label: "Normal", tone: "neutral" },
};

export const ATTENDANCE_STATUS: Record<string, Labeled> = {
  PRESENTE: { label: "Presente", tone: "success" },
  AUSENTE: { label: "Ausente", tone: "danger" },
  TARDE: { label: "Tarde", tone: "warning" },
  JUSTIFICADO: { label: "Justificado", tone: "info" },
};

export const CLASS_STATUS: Record<string, Labeled> = {
  REGISTRADA: { label: "Registrada", tone: "success" },
  PENDIENTE: { label: "Pendiente", tone: "warning" },
};

export const JORNADA: Record<string, string> = {
  MANANA: "Mañana",
  TARDE: "Tarde",
  NOCHE: "Noche",
  UNICA: "Única",
};

export const CONTACT_TYPE: Record<string, string> = {
  LLAMADA: "Llamada",
  MENSAJE: "Mensaje",
  PRESENCIAL: "Presencial",
  OTRO: "Otro",
};

export const CONTACT_RESULT: Record<string, string> = {
  ACUDIENTE_CONTACTADO: "Acudiente contactado",
  NO_CONTESTO: "No contestó",
  NUMERO_INVALIDO: "Número inválido",
  SOLICITA_DEVOLUCION_LLAMADA: "Pide que le devuelvan la llamada",
  AUSENCIA_JUSTIFICADA: "Ausencia justificada",
  OTRO: "Otro",
};

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_INSTITUCIONAL: "Admin institucional",
  COORDINADOR: "Coordinador",
  DOCENTE: "Docente",
  GESTOR_SEGUIMIENTO: "Gestor de seguimiento",
};

/** Acciones de auditoría, en lenguaje claro. */
export const AUDIT_ACTION: Record<string, string> = {
  LOGIN: "Inicio de sesión",
  LOGIN_FAILED: "Intento de inicio fallido",
  LOGOUT: "Cierre de sesión",
  PASSWORD_CHANGE: "Cambio de contraseña",
  PASSWORD_RESET_REQUESTED: "Solicitud de recuperación",
  PASSWORD_RESET: "Contraseña restablecida",
  ATTENDANCE_CREATE: "Asistencia registrada",
  ATTENDANCE_UPDATE: "Asistencia corregida",
  FOLLOWUP_CONTACT_CREATE: "Contacto con acudiente",
  FOLLOWUP_STATUS_CHANGE: "Cambio de estado de caso",
  STUDENT_CREATE: "Estudiante creado",
  STUDENT_UPDATE: "Estudiante editado",
  STUDENT_DELETE: "Estudiante eliminado",
  TEACHER_CREATE: "Docente creado",
  TEACHER_UPDATE: "Docente editado",
  TEACHER_DELETE: "Docente eliminado",
  INSTITUTION_CREATE: "Institución creada",
  INSTITUTION_UPDATE: "Institución editada",
  INSTITUTION_STATUS_CHANGE: "Institución activada/desactivada",
  INSTITUTION_DELETE: "Institución eliminada",
  CAMPUS_CREATE: "Sede creada",
  CAMPUS_STATUS_CHANGE: "Sede activada/desactivada",
  ACADEMIC_PERIOD_CREATE: "Periodo creado",
  ACADEMIC_PERIOD_STATUS_CHANGE: "Periodo activado/desactivado",
  SUBJECT_CREATE: "Materia creada",
  SUBJECT_STATUS_CHANGE: "Materia activada/desactivada",
  COURSE_CREATE: "Curso creado",
  COURSE_UPDATE: "Curso editado",
  COURSE_STATUS_CHANGE: "Curso activado/desactivado",
};

/** Busca la etiqueta; si el valor no está mapeado, lo muestra legible en vez de en MAYÚSCULAS_CON_GUION. */
export function labelOf(map: Record<string, Labeled>, value: string): Labeled {
  return map[value] ?? { label: humanize(value), tone: "neutral" };
}

export function humanize(value: string): string {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
