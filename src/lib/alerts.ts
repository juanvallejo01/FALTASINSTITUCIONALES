// Nota: este módulo NO importa "server-only" a propósito, porque también se
// reutiliza desde prisma/seed.ts (ejecutado como script plano con tsx, fuera
// del bundler de Next.js). Solo se importa desde código de servidor de la
// app (route handlers, server actions) y desde el seed; nunca desde un
// componente cliente.
import type { AlertLevel, AttendanceStatusValue } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { todayDateOnlyUtc } from "@/lib/tz";

export type AlertConfigValues = {
  seguimientoThreshold: number;
  alertaThreshold: number;
  consecutiveThreshold: number;
  minAttendancePercent: number;
  periodDays: number;
};

export const DEFAULT_ALERT_CONFIG: AlertConfigValues = {
  seguimientoThreshold: 3,
  alertaThreshold: 5,
  consecutiveThreshold: 3,
  minAttendancePercent: 80,
  periodDays: 30,
};

export type AttendanceStats = {
  absenceCount: number;
  consecutiveAbsences: number;
  attendancePercentage: number;
  lastAbsenceDate: Date | null;
};

/**
 * Regla de negocio pura (sin acceso a datos) para poder probarse
 * unitariamente sin base de datos. `records` debe venir ordenado
 * cronológicamente ascendente y ya filtrado a la ventana de periodo.
 */
export function computeAttendanceStats(
  records: { status: AttendanceStatusValue; date: Date }[],
): AttendanceStats {
  if (records.length === 0) {
    return {
      absenceCount: 0,
      consecutiveAbsences: 0,
      attendancePercentage: 100,
      lastAbsenceDate: null,
    };
  }

  const absences = records.filter((r) => r.status === "AUSENTE");
  const absenceCount = absences.length;
  const lastAbsenceDate =
    absences.length > 0 ? absences[absences.length - 1]!.date : null;

  // Ausencias consecutivas: recorrer desde el registro más reciente hacia
  // atrás y contar mientras el estado sea AUSENTE.
  let consecutiveAbsences = 0;
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i]!.status === "AUSENTE") {
      consecutiveAbsences++;
    } else {
      break;
    }
  }

  const presentEquivalent = records.filter(
    (r) => r.status === "PRESENTE" || r.status === "TARDE" || r.status === "JUSTIFICADO",
  ).length;
  const attendancePercentage = Math.round(
    (presentEquivalent / records.length) * 10000,
  ) / 100;

  return { absenceCount, consecutiveAbsences, attendancePercentage, lastAbsenceDate };
}

/** Determina el nivel de alerta a partir de las estadísticas y la configuración vigente. */
export function computeAlertLevel(
  config: AlertConfigValues,
  stats: AttendanceStats,
): AlertLevel {
  const belowMinAttendance = stats.attendancePercentage < config.minAttendancePercent;
  const meetsAlerta =
    stats.absenceCount >= config.alertaThreshold ||
    stats.consecutiveAbsences >= config.consecutiveThreshold;

  if (meetsAlerta) return "ALERTA";
  if (stats.absenceCount >= config.seguimientoThreshold || belowMinAttendance) {
    return "SEGUIMIENTO";
  }
  return "NORMAL";
}

export async function getEffectiveAlertConfig(
  institutionId: string,
): Promise<AlertConfigValues> {
  const specific = await prisma.alertConfig.findUnique({ where: { institutionId } });
  if (specific) return specific;
  const global = await prisma.alertConfig.findFirst({ where: { institutionId: null } });
  if (global) return global;
  return DEFAULT_ALERT_CONFIG;
}

/**
 * Recalcula el nivel de alerta de un estudiante a partir de su asistencia
 * reciente, persiste el resultado y, si corresponde, abre un caso de
 * seguimiento. Se invoca tras cada guardado de asistencia con ausencias.
 */
export async function recomputeStudentAlert(studentId: string): Promise<void> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: { id: true, institutionId: true },
  });

  const config = await getEffectiveAlertConfig(student.institutionId);
  const windowStart = new Date(todayDateOnlyUtc());
  windowStart.setUTCDate(windowStart.getUTCDate() - config.periodDays);

  const records = await prisma.attendanceRecord.findMany({
    where: { studentId, session: { date: { gte: windowStart } } },
    include: { session: { select: { date: true } } },
    orderBy: { session: { date: "asc" } },
  });

  const stats = computeAttendanceStats(
    records.map((r) => ({ status: r.status, date: r.session.date })),
  );
  const level = computeAlertLevel(config, stats);

  const existingOpenAlert = await prisma.alert.findFirst({
    where: { studentId, status: "ABIERTA" },
    orderBy: { createdAt: "desc" },
  });

  let alertId: string;
  if (level === "NORMAL") {
    if (existingOpenAlert) {
      await prisma.alert.update({
        where: { id: existingOpenAlert.id },
        data: { status: "CERRADA", ...stats, level },
      });
    }
    return;
  }

  if (existingOpenAlert) {
    const updated = await prisma.alert.update({
      where: { id: existingOpenAlert.id },
      data: { ...stats, level },
    });
    alertId = updated.id;
  } else {
    const created = await prisma.alert.create({
      data: {
        institutionId: student.institutionId,
        studentId: student.id,
        level,
        status: "ABIERTA",
        ...stats,
      },
    });
    alertId = created.id;
  }

  const existingCase = await prisma.followUpCase.findFirst({
    where: { studentId, status: { notIn: ["CERRADO"] } },
  });
  if (!existingCase) {
    await prisma.followUpCase.create({
      data: {
        institutionId: student.institutionId,
        studentId: student.id,
        alertId,
        status: "PENDIENTE",
      },
    });
  } else if (existingCase.alertId !== alertId) {
    await prisma.followUpCase.update({
      where: { id: existingCase.id },
      data: { alertId },
    });
  }
}
