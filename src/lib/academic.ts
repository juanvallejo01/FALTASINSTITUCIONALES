import "server-only";
import type { Jornada } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import type { SessionPayload } from "@/lib/session";

// ---------------------------------------------------------------------------
// SEDES (Campus)
// ---------------------------------------------------------------------------

export async function createCampus(
  institutionId: string,
  data: { name: string; address?: string | null },
  session: SessionPayload,
  request: Request,
) {
  const campus = await prisma.campus.create({
    data: { institutionId, name: data.name, address: data.address ?? null },
  });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "CAMPUS_CREATE",
    resource: "Campus",
    resourceId: campus.id,
    newValue: data,
    request,
  });
  return campus;
}

export async function toggleCampusStatus(
  campusId: string,
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const campus = await prisma.campus.findUnique({ where: { id: campusId } });
  if (!campus || campus.institutionId !== institutionId) {
    throw new NotFoundError("Sede no encontrada");
  }
  const newStatus = campus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.campus.update({ where: { id: campusId }, data: { status: newStatus } });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "CAMPUS_STATUS_CHANGE",
    resource: "Campus",
    resourceId: campusId,
    oldValue: { status: campus.status },
    newValue: { status: newStatus },
    request,
  });
}

// ---------------------------------------------------------------------------
// PERIODOS ACADÉMICOS
// ---------------------------------------------------------------------------

export async function createAcademicPeriod(
  institutionId: string,
  data: { name: string; startDate: string; endDate: string },
  session: SessionPayload,
  request: Request,
) {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new ConflictError("Fechas inválidas");
  }
  if (endDate <= startDate) {
    throw new ConflictError("La fecha de fin debe ser posterior a la fecha de inicio");
  }

  const period = await prisma.academicPeriod.create({
    data: { institutionId, name: data.name, startDate, endDate },
  });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "ACADEMIC_PERIOD_CREATE",
    resource: "AcademicPeriod",
    resourceId: period.id,
    newValue: data,
    request,
  });
  return period;
}

export async function toggleAcademicPeriodStatus(
  periodId: string,
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } });
  if (!period || period.institutionId !== institutionId) {
    throw new NotFoundError("Periodo no encontrado");
  }
  const newStatus = period.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.academicPeriod.update({ where: { id: periodId }, data: { status: newStatus } });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "ACADEMIC_PERIOD_STATUS_CHANGE",
    resource: "AcademicPeriod",
    resourceId: periodId,
    oldValue: { status: period.status },
    newValue: { status: newStatus },
    request,
  });
}

// ---------------------------------------------------------------------------
// MATERIAS (Subject)
// ---------------------------------------------------------------------------

export async function createSubject(
  institutionId: string,
  data: { name: string },
  session: SessionPayload,
  request: Request,
) {
  const existing = await prisma.subject.findUnique({
    where: { institutionId_name: { institutionId, name: data.name } },
  });
  if (existing) throw new ConflictError("Ya existe una materia con ese nombre");

  const subject = await prisma.subject.create({ data: { institutionId, name: data.name } });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "SUBJECT_CREATE",
    resource: "Subject",
    resourceId: subject.id,
    newValue: data,
    request,
  });
  return subject;
}

export async function toggleSubjectStatus(
  subjectId: string,
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject || subject.institutionId !== institutionId) {
    throw new NotFoundError("Materia no encontrada");
  }
  const newStatus = subject.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.subject.update({ where: { id: subjectId }, data: { status: newStatus } });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "SUBJECT_STATUS_CHANGE",
    resource: "Subject",
    resourceId: subjectId,
    oldValue: { status: subject.status },
    newValue: { status: newStatus },
    request,
  });
}

// ---------------------------------------------------------------------------
// CURSOS (Course) — CRUD completo: crear, editar, activar/desactivar
// ---------------------------------------------------------------------------

async function assertCampusAndPeriodBelongToInstitution(
  institutionId: string,
  campusId: string,
  academicPeriodId: string,
) {
  const [campus, period] = await Promise.all([
    prisma.campus.findUnique({ where: { id: campusId } }),
    prisma.academicPeriod.findUnique({ where: { id: academicPeriodId } }),
  ]);
  if (!campus || campus.institutionId !== institutionId) {
    throw new ForbiddenError("La sede no pertenece a esta institución");
  }
  if (!period || period.institutionId !== institutionId) {
    throw new ForbiddenError("El periodo no pertenece a esta institución");
  }
}

export async function createCourse(
  institutionId: string,
  data: { name: string; campusId: string; academicPeriodId: string; jornada: Jornada },
  session: SessionPayload,
  request: Request,
) {
  await assertCampusAndPeriodBelongToInstitution(institutionId, data.campusId, data.academicPeriodId);

  const existing = await prisma.course.findUnique({
    where: {
      institutionId_name_academicPeriodId: {
        institutionId,
        name: data.name,
        academicPeriodId: data.academicPeriodId,
      },
    },
  });
  if (existing) throw new ConflictError("Ya existe un curso con ese nombre en ese periodo");

  const course = await prisma.course.create({
    data: {
      institutionId,
      campusId: data.campusId,
      academicPeriodId: data.academicPeriodId,
      name: data.name,
      jornada: data.jornada,
    },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "COURSE_CREATE",
    resource: "Course",
    resourceId: course.id,
    newValue: data,
    request,
  });

  return course;
}

export async function updateCourse(
  courseId: string,
  institutionId: string,
  data: { name?: string; campusId?: string; academicPeriodId?: string; jornada?: Jornada },
  session: SessionPayload,
  request: Request,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.institutionId !== institutionId) {
    throw new NotFoundError("Curso no encontrado");
  }

  const nextCampusId = data.campusId ?? course.campusId;
  const nextPeriodId = data.academicPeriodId ?? course.academicPeriodId;
  if (data.campusId || data.academicPeriodId) {
    await assertCampusAndPeriodBelongToInstitution(institutionId, nextCampusId, nextPeriodId);
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: {
      name: data.name ?? course.name,
      campusId: nextCampusId,
      academicPeriodId: nextPeriodId,
      jornada: data.jornada ?? course.jornada,
    },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "COURSE_UPDATE",
    resource: "Course",
    resourceId: courseId,
    oldValue: {
      name: course.name,
      campusId: course.campusId,
      academicPeriodId: course.academicPeriodId,
      jornada: course.jornada,
    },
    newValue: data,
    request,
  });

  return updated;
}

export async function toggleCourseStatus(
  courseId: string,
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.institutionId !== institutionId) {
    throw new NotFoundError("Curso no encontrado");
  }
  const newStatus = course.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.course.update({ where: { id: courseId }, data: { status: newStatus } });
  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "COURSE_STATUS_CHANGE",
    resource: "Course",
    resourceId: courseId,
    oldValue: { status: course.status },
    newValue: { status: newStatus },
    request,
  });
}
