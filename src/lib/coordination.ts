import "server-only";
import { prisma } from "@/lib/prisma";
import { dayOfWeekEs, todayDateOnlyUtc } from "@/lib/tz";

export type TodayClassRow = {
  assignmentId: string;
  courseName: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  sessionId: string | null;
  status: "REGISTRADA" | "PENDIENTE";
  registeredAt: Date | null;
};

/**
 * Vista "Asistencia de hoy" para coordinación: una fila por cada clase que
 * debería dictarse hoy según el horario (TeacherCourseSubject), indicando si
 * ya tiene una AttendanceSession registrada. Esto permite detectar tanto
 * clases registradas como pendientes, incluso si el docente aún no ha
 * abierto la clase (lo que no crea la sesión hasta que el docente entra).
 */
export async function getTodayClassesForInstitution(
  institutionId: string,
): Promise<TodayClassRow[]> {
  const today = todayDateOnlyUtc();
  const dayName = dayOfWeekEs();

  const assignments = await prisma.teacherCourseSubject.findMany({
    where: { dayOfWeek: dayName, course: { institutionId } },
    include: { course: true, subject: true, teacher: true },
    orderBy: [{ course: { name: "asc" } }, { startTime: "asc" }],
  });

  const sessions = await prisma.attendanceSession.findMany({
    where: { institutionId, date: today },
  });
  const sessionByKey = new Map(
    sessions.map((s) => [`${s.courseId}:${s.subjectId}:${s.teacherId}:${s.startTime}`, s]),
  );

  return assignments.map((a) => {
    const key = `${a.courseId}:${a.subjectId}:${a.teacherId}:${a.startTime}`;
    const session = sessionByKey.get(key);
    return {
      assignmentId: a.id,
      courseName: a.course.name,
      subjectName: a.subject.name,
      teacherName: `${a.teacher.firstName} ${a.teacher.lastName}`,
      startTime: a.startTime,
      sessionId: session?.id ?? null,
      status: session?.status === "REGISTRADA" ? "REGISTRADA" : "PENDIENTE",
      registeredAt: session?.registeredAt ?? null,
    };
  });
}

export async function getGlobalOverview() {
  const [institutionCount, studentCount, teacherCount, courseCount, openAlerts, pendingCases] =
    await Promise.all([
      prisma.institution.count({ where: { status: "ACTIVE" } }),
      prisma.student.count({ where: { status: "ACTIVE" } }),
      prisma.teacher.count({ where: { status: "ACTIVE" } }),
      prisma.course.count({ where: { status: "ACTIVE" } }),
      prisma.alert.count({ where: { status: "ABIERTA" } }),
      prisma.followUpCase.count({ where: { status: { in: ["PENDIENTE", "EN_GESTION"] } } }),
    ]);

  // Se evita SQL crudo a propósito (ver sección 36 del spec, prevención de
  // inyección SQL): se reutiliza la misma lógica de horario que ya usa
  // coordinación, iterando sobre las pocas instituciones activas.
  const activeInstitutions = await prisma.institution.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
  });
  const pendingPerInstitution = await Promise.all(
    activeInstitutions.map(async (inst) => {
      const classes = await getTodayClassesForInstitution(inst.id);
      const pending = classes.filter((c) => c.status === "PENDIENTE").length;
      return { institutionId: inst.id, name: inst.name, pending, total: classes.length };
    }),
  );

  // Las clases de hoy salen del horario (igual que en cada institución), no solo de
  // las sesiones ya abiertas por un docente; si no, el total global no cuadraba con
  // la suma de los pendientes por institución.
  const sessionsToday = pendingPerInstitution.reduce((sum, r) => sum + r.total, 0);
  const pendingToday = pendingPerInstitution.reduce((sum, r) => sum + r.pending, 0);

  return {
    institutionCount,
    studentCount,
    teacherCount,
    courseCount,
    sessionsToday,
    registeredToday: sessionsToday - pendingToday,
    pendingToday,
    openAlerts,
    pendingCases,
    institutionsWithPending: pendingPerInstitution
      .filter((r) => r.pending > 0)
      .sort((a, b) => b.pending - a.pending),
  };
}

export async function getInstitutionOverview(institutionId: string) {
  const today = todayDateOnlyUtc();

  const [studentCount, teacherCount, courseCount, todayClasses, openAlerts, pendingCases] =
    await Promise.all([
      prisma.student.count({ where: { institutionId, status: "ACTIVE" } }),
      prisma.teacher.count({ where: { institutionId, status: "ACTIVE" } }),
      prisma.course.count({ where: { institutionId, status: "ACTIVE" } }),
      getTodayClassesForInstitution(institutionId),
      prisma.alert.count({ where: { institutionId, status: "ABIERTA" } }),
      prisma.followUpCase.count({
        where: { institutionId, status: { in: ["PENDIENTE", "EN_GESTION"] } },
      }),
    ]);

  const todaySessionIds = (
    await prisma.attendanceSession.findMany({
      where: { institutionId, date: today, status: "REGISTRADA" },
      select: { id: true },
    })
  ).map((s) => s.id);

  const todayRecords = await prisma.attendanceRecord.findMany({
    where: { sessionId: { in: todaySessionIds } },
    select: { status: true },
  });

  const registeredCount = todayClasses.filter((c) => c.status === "REGISTRADA").length;
  const pendingCount = todayClasses.length - registeredCount;

  return {
    studentCount,
    teacherCount,
    courseCount,
    classesToday: todayClasses.length,
    classesRegistered: registeredCount,
    classesPending: pendingCount,
    presentToday: todayRecords.filter((r) => r.status === "PRESENTE").length,
    absentToday: todayRecords.filter((r) => r.status === "AUSENTE").length,
    lateToday: todayRecords.filter((r) => r.status === "TARDE").length,
    justifiedToday: todayRecords.filter((r) => r.status === "JUSTIFICADO").length,
    openAlerts,
    pendingCases,
  };
}
