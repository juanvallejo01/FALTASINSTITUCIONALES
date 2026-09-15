import "server-only";
import type { ContactResult, ContactType, FollowUpStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scopedInstitutionId } from "@/lib/rbac";
import { NotFoundError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import type { SessionPayload } from "@/lib/session";

export type CaseFilters = {
  institutionId?: string;
  courseId?: string;
  status?: FollowUpStatus;
  minAbsences?: number;
};

/**
 * El gestor de seguimiento solo debe ver los campos estrictamente
 * necesarios para su labor (sección 4 y 18 del spec): identidad del
 * estudiante, institución, curso, ausencias y datos mínimos del acudiente.
 * Nunca se expone aquí información administrativa de la institución.
 */
export async function listFollowUpCases(session: SessionPayload, filters: CaseFilters) {
  const scoped = scopedInstitutionId(session);

  const cases = await prisma.followUpCase.findMany({
    where: {
      deletedAt: null,
      institutionId: filters.institutionId ?? scoped ?? undefined,
      status: filters.status,
      student: filters.courseId ? { courseId: filters.courseId } : undefined,
      alert: filters.minAbsences ? { absenceCount: { gte: filters.minAbsences } } : undefined,
    },
    include: {
      student: { include: { course: true, institution: true } },
      alert: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return cases.map((c) => ({
    id: c.id,
    status: c.status,
    studentName: `${c.student.lastName} ${c.student.firstName}`,
    institutionName: c.student.institution.name,
    courseName: c.student.course.name,
    absenceCount: c.alert?.absenceCount ?? 0,
    level: c.alert?.level ?? "NORMAL",
    lastAbsenceDate: c.alert?.lastAbsenceDate ?? null,
    createdAt: c.createdAt,
  }));
}

export async function getFollowUpCaseDetail(caseId: string, session: SessionPayload) {
  const scoped = scopedInstitutionId(session);

  const followUpCase = await prisma.followUpCase.findUnique({
    where: { id: caseId },
    include: {
      student: { include: { course: true, institution: true, guardian: true } },
      alert: true,
      contacts: {
        where: { deletedAt: null },
        include: { gestor: true },
        orderBy: { contactDate: "desc" },
      },
    },
  });
  if (!followUpCase || followUpCase.deletedAt) throw new NotFoundError("Caso no encontrado");
  if (scoped && followUpCase.institutionId !== scoped) {
    throw new NotFoundError("Caso no encontrado");
  }

  const attendanceHistory = await prisma.attendanceRecord.findMany({
    where: { studentId: followUpCase.studentId, status: { not: "PRESENTE" } },
    include: { session: { include: { subject: true, teacher: true } } },
    orderBy: { session: { date: "desc" } },
    take: 30,
  });

  return {
    id: followUpCase.id,
    status: followUpCase.status,
    student: {
      id: followUpCase.student.id,
      name: `${followUpCase.student.lastName} ${followUpCase.student.firstName}`,
      internalCode: followUpCase.student.internalCode,
      institutionName: followUpCase.student.institution.name,
      courseName: followUpCase.student.course.name,
    },
    guardian: followUpCase.student.guardian
      ? {
          name: `${followUpCase.student.guardian.firstName} ${followUpCase.student.guardian.lastName}`,
          phone: followUpCase.student.guardian.phone,
          relationship: followUpCase.student.guardian.relationship,
        }
      : null,
    alert: followUpCase.alert
      ? {
          level: followUpCase.alert.level,
          absenceCount: followUpCase.alert.absenceCount,
          consecutiveAbsences: followUpCase.alert.consecutiveAbsences,
          attendancePercentage: followUpCase.alert.attendancePercentage,
          lastAbsenceDate: followUpCase.alert.lastAbsenceDate,
        }
      : null,
    attendanceHistory: attendanceHistory.map((r) => ({
      date: r.session.date,
      subjectName: r.session.subject.name,
      teacherName: `${r.session.teacher.firstName} ${r.session.teacher.lastName}`,
      status: r.status,
    })),
    contacts: followUpCase.contacts.map((c) => ({
      id: c.id,
      contactDate: c.contactDate,
      gestorName: c.gestor.name,
      type: c.type,
      result: c.result,
      observation: c.observation,
      nextFollowUpDate: c.nextFollowUpDate,
    })),
  };
}

export async function registerFollowUpContact(
  caseId: string,
  data: {
    type: ContactType;
    result: ContactResult;
    observation?: string | null;
    nextFollowUpDate?: string | null;
  },
  session: SessionPayload,
  request: Request,
) {
  const scoped = scopedInstitutionId(session);
  const followUpCase = await prisma.followUpCase.findUnique({ where: { id: caseId } });
  if (!followUpCase || followUpCase.deletedAt) throw new NotFoundError("Caso no encontrado");
  if (scoped && followUpCase.institutionId !== scoped) throw new NotFoundError("Caso no encontrado");

  const contact = await prisma.followUpContact.create({
    data: {
      caseId,
      gestorId: session.sub,
      type: data.type,
      result: data.result,
      observation: data.observation ?? null,
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
    },
  });

  const nextStatus = resultToStatus(data.result, followUpCase.status);
  if (nextStatus !== followUpCase.status) {
    await prisma.followUpCase.update({ where: { id: caseId }, data: { status: nextStatus } });
  }

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId: followUpCase.institutionId,
    action: "FOLLOWUP_CONTACT_CREATE",
    resource: "FollowUpContact",
    resourceId: contact.id,
    newValue: data,
    request,
  });

  return contact;
}

function resultToStatus(result: ContactResult, current: FollowUpStatus): FollowUpStatus {
  switch (result) {
    case "ACUDIENTE_CONTACTADO":
      return "CONTACTADO";
    case "NO_CONTESTO":
    case "NUMERO_INVALIDO":
      return "NO_CONTACTADO";
    case "AUSENCIA_JUSTIFICADA":
      return "JUSTIFICADO";
    default:
      return current === "PENDIENTE" ? "EN_GESTION" : current;
  }
}

export async function updateFollowUpCaseStatus(
  caseId: string,
  status: FollowUpStatus,
  session: SessionPayload,
  request: Request,
) {
  const scoped = scopedInstitutionId(session);
  const followUpCase = await prisma.followUpCase.findUnique({ where: { id: caseId } });
  if (!followUpCase || followUpCase.deletedAt) throw new NotFoundError("Caso no encontrado");
  if (scoped && followUpCase.institutionId !== scoped) throw new NotFoundError("Caso no encontrado");

  await prisma.followUpCase.update({ where: { id: caseId }, data: { status } });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId: followUpCase.institutionId,
    action: "FOLLOWUP_STATUS_CHANGE",
    resource: "FollowUpCase",
    resourceId: caseId,
    oldValue: { status: followUpCase.status },
    newValue: { status },
    request,
  });
}
