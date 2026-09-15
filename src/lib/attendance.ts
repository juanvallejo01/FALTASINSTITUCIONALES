import "server-only";
import { prisma } from "@/lib/prisma";
import { dayOfWeekEs, todayDateOnlyUtc } from "@/lib/tz";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { recomputeStudentAlert } from "@/lib/alerts";
import { writeAuditLog } from "@/lib/audit";
import type { SessionPayload } from "@/lib/session";
import type { AttendanceStatusValue } from "@prisma/client";

/**
 * Obtiene (creando si hace falta) las sesiones de clase de hoy para un
 * docente, a partir de su horario asignado (TeacherCourseSubject). Una
 * sesión representa una clase concreta: curso + materia + fecha + hora.
 */
export async function getTodaySessionsForTeacher(teacherId: string) {
  const today = todayDateOnlyUtc();
  const dayName = dayOfWeekEs();

  const assignments = await prisma.teacherCourseSubject.findMany({
    where: { teacherId, dayOfWeek: dayName },
    include: { course: true, subject: true },
    orderBy: { startTime: "asc" },
  });

  const sessions = [];
  for (const assignment of assignments) {
    const session = await prisma.attendanceSession.upsert({
      where: {
        courseId_subjectId_teacherId_date_startTime: {
          courseId: assignment.courseId,
          subjectId: assignment.subjectId,
          teacherId,
          date: today,
          startTime: assignment.startTime,
        },
      },
      update: {},
      create: {
        institutionId: assignment.course.institutionId,
        courseId: assignment.courseId,
        subjectId: assignment.subjectId,
        teacherId,
        date: today,
        startTime: assignment.startTime,
        status: "PENDIENTE",
      },
    });
    sessions.push({
      id: session.id,
      startTime: session.startTime,
      status: session.status,
      courseName: assignment.course.name,
      subjectName: assignment.subject.name,
    });
  }
  return sessions;
}

function assertCanManageSession(
  session: SessionPayload,
  attendanceSession: { institutionId: string; teacherId: string },
  teacherIdOfActingUser: string | null,
) {
  if (session.role === "SUPER_ADMIN") return;
  if (session.institutionId !== attendanceSession.institutionId) {
    throw new ForbiddenError("La sesión pertenece a otra institución");
  }
  if (session.role === "ADMIN_INSTITUCIONAL") return;
  if (session.role === "DOCENTE") {
    if (teacherIdOfActingUser !== attendanceSession.teacherId) {
      throw new ForbiddenError("No puedes gestionar la asistencia de otro docente");
    }
    return;
  }
  throw new ForbiddenError("Rol sin permiso para gestionar asistencia");
}

export async function getSessionRoster(sessionId: string, session: SessionPayload) {
  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      course: true,
      subject: true,
      teacher: true,
      records: true,
    },
  });
  if (!attendanceSession) throw new NotFoundError("Sesión no encontrada");

  const teacherProfile =
    session.role === "DOCENTE"
      ? await prisma.teacher.findUnique({ where: { userId: session.sub } })
      : null;

  assertCanManageSession(session, attendanceSession, teacherProfile?.id ?? null);

  const students = await prisma.student.findMany({
    where: { courseId: attendanceSession.courseId, status: "ACTIVE", deletedAt: null },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const recordByStudent = new Map(attendanceSession.records.map((r) => [r.studentId, r]));

  return {
    session: {
      id: attendanceSession.id,
      date: attendanceSession.date,
      startTime: attendanceSession.startTime,
      status: attendanceSession.status,
      courseName: attendanceSession.course.name,
      subjectName: attendanceSession.subject.name,
      teacherName: `${attendanceSession.teacher.firstName} ${attendanceSession.teacher.lastName}`,
    },
    students: students.map((s) => ({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      internalCode: s.internalCode,
      status: recordByStudent.get(s.id)?.status ?? "PRESENTE",
      observation: recordByStudent.get(s.id)?.observation ?? null,
    })),
  };
}

export async function saveAttendance(
  sessionId: string,
  records: { studentId: string; status: AttendanceStatusValue; observation?: string | null }[],
  session: SessionPayload,
  request: Request,
) {
  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!attendanceSession) throw new NotFoundError("Sesión no encontrada");

  const teacherProfile =
    session.role === "DOCENTE"
      ? await prisma.teacher.findUnique({ where: { userId: session.sub } })
      : null;
  assertCanManageSession(session, attendanceSession, teacherProfile?.id ?? null);

  const validStudentIds = new Set(
    (
      await prisma.student.findMany({
        where: { courseId: attendanceSession.courseId, status: "ACTIVE" },
        select: { id: true },
      })
    ).map((s) => s.id),
  );

  const existingRecords = await prisma.attendanceRecord.findMany({ where: { sessionId } });
  const existingByStudent = new Map(existingRecords.map((r) => [r.studentId, r]));

  for (const record of records) {
    if (!validStudentIds.has(record.studentId)) {
      throw new ForbiddenError("Uno de los estudiantes no pertenece a este curso");
    }

    const existing = existingByStudent.get(record.studentId);
    if (existing) {
      if (existing.status === record.status && (existing.observation ?? null) === (record.observation ?? null)) {
        continue;
      }
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: record.status, observation: record.observation ?? null, recordedById: session.sub },
      });
      await writeAuditLog({
        userId: session.sub,
        role: session.role,
        institutionId: attendanceSession.institutionId,
        action: "ATTENDANCE_UPDATE",
        resource: "AttendanceRecord",
        resourceId: existing.id,
        oldValue: { status: existing.status, observation: existing.observation },
        newValue: { status: record.status, observation: record.observation ?? null },
        request,
      });
    } else {
      const created = await prisma.attendanceRecord.create({
        data: {
          sessionId,
          studentId: record.studentId,
          status: record.status,
          observation: record.observation ?? null,
          recordedById: session.sub,
        },
      });
      await writeAuditLog({
        userId: session.sub,
        role: session.role,
        institutionId: attendanceSession.institutionId,
        action: "ATTENDANCE_CREATE",
        resource: "AttendanceRecord",
        resourceId: created.id,
        newValue: { status: record.status, observation: record.observation ?? null },
        request,
      });
    }
  }

  await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: {
      status: "REGISTRADA",
      registeredAt: attendanceSession.registeredAt ?? new Date(),
      registeredById: attendanceSession.registeredById ?? session.sub,
    },
  });

  for (const record of records) {
    await recomputeStudentAlert(record.studentId);
  }
}
