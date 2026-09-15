import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/audit";
import type { SessionPayload } from "@/lib/session";

function generateTempPassword(): string {
  // Legible y suficientemente fuerte para credenciales temporales de DEMO;
  // en producción esto debería forzar cambio de contraseña en primer login
  // (funcionalidad marcada como pendiente, ver README).
  return `Temp-${randomBytes(4).toString("hex")}`;
}

export async function createStudentForInstitution(
  institutionId: string,
  data: {
    firstName: string;
    lastName: string;
    internalCode: string;
    courseId: string;
    guardianFirstName: string;
    guardianLastName: string;
    guardianPhone: string;
    guardianRelationship: string;
  },
  session: SessionPayload,
  request: Request,
) {
  const course = await prisma.course.findUnique({ where: { id: data.courseId } });
  if (!course || course.institutionId !== institutionId) {
    throw new ForbiddenError("El curso no pertenece a esta institución");
  }

  const existing = await prisma.student.findUnique({
    where: { institutionId_internalCode: { institutionId, internalCode: data.internalCode } },
  });
  if (existing) throw new ConflictError("Ya existe un estudiante con ese código interno");

  const guardian = await prisma.guardian.create({
    data: {
      firstName: data.guardianFirstName,
      lastName: data.guardianLastName,
      phone: data.guardianPhone,
      relationship: data.guardianRelationship,
    },
  });

  const student = await prisma.student.create({
    data: {
      institutionId,
      campusId: course.campusId,
      courseId: course.id,
      guardianId: guardian.id,
      firstName: data.firstName,
      lastName: data.lastName,
      internalCode: data.internalCode,
      jornada: course.jornada,
    },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "STUDENT_CREATE",
    resource: "Student",
    resourceId: student.id,
    newValue: { firstName: data.firstName, lastName: data.lastName, internalCode: data.internalCode },
    request,
  });

  return student;
}

export async function createTeacherForInstitution(
  institutionId: string,
  data: {
    firstName: string;
    lastName: string;
    internalCode: string;
    email: string;
    campusId: string;
    phone?: string | null;
  },
  session: SessionPayload,
  request: Request,
) {
  const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
  if (!campus || campus.institutionId !== institutionId) {
    throw new ForbiddenError("La sede no pertenece a esta institución");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) throw new ConflictError("Ya existe un usuario con ese correo");

  const existingCode = await prisma.teacher.findUnique({
    where: { institutionId_internalCode: { institutionId, internalCode: data.internalCode } },
  });
  if (existingCode) throw new ConflictError("Ya existe un docente con ese código interno");

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
      role: "DOCENTE",
      institutionId,
      passwordHash,
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      institutionId,
      campusId: data.campusId,
      firstName: data.firstName,
      lastName: data.lastName,
      internalCode: data.internalCode,
      phone: data.phone ?? null,
    },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "TEACHER_CREATE",
    resource: "Teacher",
    resourceId: teacher.id,
    newValue: { firstName: data.firstName, lastName: data.lastName, email: data.email },
    request,
  });

  return { teacher, tempPassword };
}

export async function createInstitution(
  data: { name: string; code: string; address?: string | null },
  session: SessionPayload,
  request: Request,
) {
  const existing = await prisma.institution.findUnique({ where: { code: data.code } });
  if (existing) throw new ConflictError("Ya existe una institución con ese código");

  const institution = await prisma.institution.create({
    data: { name: data.name, code: data.code, address: data.address ?? null },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId: institution.id,
    action: "INSTITUTION_CREATE",
    resource: "Institution",
    resourceId: institution.id,
    newValue: data,
    request,
  });

  return institution;
}

export async function toggleInstitutionStatus(
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new NotFoundError("Institución no encontrada");
  if (institution.deletedAt) throw new ConflictError("La institución está eliminada");

  const newStatus = institution.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await prisma.institution.update({ where: { id: institutionId }, data: { status: newStatus } });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "INSTITUTION_STATUS_CHANGE",
    resource: "Institution",
    resourceId: institutionId,
    oldValue: { status: institution.status },
    newValue: { status: newStatus },
    request,
  });
}

export async function updateInstitution(
  institutionId: string,
  data: { name?: string; address?: string | null },
  session: SessionPayload,
  request: Request,
) {
  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution || institution.deletedAt) throw new NotFoundError("Institución no encontrada");

  const updated = await prisma.institution.update({
    where: { id: institutionId },
    data: { name: data.name ?? institution.name, address: data.address ?? institution.address },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "INSTITUTION_UPDATE",
    resource: "Institution",
    resourceId: institutionId,
    oldValue: { name: institution.name, address: institution.address },
    newValue: data,
    request,
  });

  return updated;
}

/**
 * Eliminación lógica (sección 22 del spec): nunca se borra físicamente una
 * institución ni se elimina en cascada su información histórica. Los
 * usuarios de la institución quedan bloqueados para iniciar sesión (ver
 * verificación en /api/auth/login) pero sus registros permanecen intactos.
 */
export async function softDeleteInstitution(
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) throw new NotFoundError("Institución no encontrada");
  if (institution.deletedAt) throw new ConflictError("La institución ya está eliminada");

  await prisma.institution.update({
    where: { id: institutionId },
    data: { deletedAt: new Date(), deletedBy: session.sub, status: "INACTIVE" },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "INSTITUTION_DELETE",
    resource: "Institution",
    resourceId: institutionId,
    request,
  });
}

// ---------------------------------------------------------------------------
// DOCENTES — edición y eliminación lógica
// ---------------------------------------------------------------------------

export async function updateTeacherForInstitution(
  teacherId: string,
  institutionId: string,
  data: { firstName?: string; lastName?: string; campusId?: string; phone?: string | null },
  session: SessionPayload,
  request: Request,
) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.institutionId !== institutionId || teacher.deletedAt) {
    throw new NotFoundError("Docente no encontrado");
  }

  if (data.campusId) {
    const campus = await prisma.campus.findUnique({ where: { id: data.campusId } });
    if (!campus || campus.institutionId !== institutionId) {
      throw new ForbiddenError("La sede no pertenece a esta institución");
    }
  }

  const updated = await prisma.teacher.update({
    where: { id: teacherId },
    data: {
      firstName: data.firstName ?? teacher.firstName,
      lastName: data.lastName ?? teacher.lastName,
      campusId: data.campusId ?? teacher.campusId,
      phone: data.phone === undefined ? teacher.phone : data.phone,
    },
  });

  if (data.firstName || data.lastName) {
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { name: `${updated.firstName} ${updated.lastName}` },
    });
  }

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "TEACHER_UPDATE",
    resource: "Teacher",
    resourceId: teacherId,
    oldValue: {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      campusId: teacher.campusId,
      phone: teacher.phone,
    },
    newValue: data,
    request,
  });

  return updated;
}

/**
 * Eliminación lógica de un docente: se marca deletedAt/deletedBy y se
 * desactiva su cuenta de usuario (no puede volver a iniciar sesión), pero
 * su historial de asistencia registrada NUNCA se borra ni se desvincula.
 */
export async function softDeleteTeacher(
  teacherId: string,
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher || teacher.institutionId !== institutionId) {
    throw new NotFoundError("Docente no encontrado");
  }
  if (teacher.deletedAt) throw new ConflictError("El docente ya está eliminado");

  await prisma.$transaction([
    prisma.teacher.update({
      where: { id: teacherId },
      data: { deletedAt: new Date(), deletedBy: session.sub, status: "INACTIVE" },
    }),
    prisma.user.update({ where: { id: teacher.userId }, data: { status: "INACTIVE" } }),
  ]);

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "TEACHER_DELETE",
    resource: "Teacher",
    resourceId: teacherId,
    request,
  });
}

// ---------------------------------------------------------------------------
// ESTUDIANTES — edición y eliminación lógica
// ---------------------------------------------------------------------------

export async function updateStudentForInstitution(
  studentId: string,
  institutionId: string,
  data: {
    firstName?: string;
    lastName?: string;
    courseId?: string;
    guardianFirstName?: string;
    guardianLastName?: string;
    guardianPhone?: string;
    guardianRelationship?: string;
  },
  session: SessionPayload,
  request: Request,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || student.institutionId !== institutionId || student.deletedAt) {
    throw new NotFoundError("Estudiante no encontrado");
  }

  let campusId = student.campusId;
  let jornada = student.jornada;
  if (data.courseId) {
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course || course.institutionId !== institutionId) {
      throw new ForbiddenError("El curso no pertenece a esta institución");
    }
    campusId = course.campusId;
    jornada = course.jornada;
  }

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: {
      firstName: data.firstName ?? student.firstName,
      lastName: data.lastName ?? student.lastName,
      courseId: data.courseId ?? student.courseId,
      campusId,
      jornada,
    },
  });

  const hasGuardianChanges =
    data.guardianFirstName || data.guardianLastName || data.guardianPhone || data.guardianRelationship;
  if (hasGuardianChanges) {
    if (student.guardianId) {
      await prisma.guardian.update({
        where: { id: student.guardianId },
        data: {
          firstName: data.guardianFirstName,
          lastName: data.guardianLastName,
          phone: data.guardianPhone,
          relationship: data.guardianRelationship,
        },
      });
    } else {
      const guardian = await prisma.guardian.create({
        data: {
          firstName: data.guardianFirstName ?? "Sin nombre",
          lastName: data.guardianLastName ?? "",
          phone: data.guardianPhone ?? "",
          relationship: data.guardianRelationship ?? "Tutor/a",
        },
      });
      await prisma.student.update({ where: { id: studentId }, data: { guardianId: guardian.id } });
    }
  }

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "STUDENT_UPDATE",
    resource: "Student",
    resourceId: studentId,
    oldValue: { firstName: student.firstName, lastName: student.lastName, courseId: student.courseId },
    newValue: data,
    request,
  });

  return updated;
}

/**
 * Eliminación lógica de un estudiante: desaparece de los listados activos
 * y del roster de asistencia (attendance.ts ya filtra por status/deletedAt),
 * pero su historial de asistencia, alertas y casos de seguimiento
 * permanecen intactos para trazabilidad.
 */
export async function softDeleteStudent(
  studentId: string,
  institutionId: string,
  session: SessionPayload,
  request: Request,
) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || student.institutionId !== institutionId) {
    throw new NotFoundError("Estudiante no encontrado");
  }
  if (student.deletedAt) throw new ConflictError("El estudiante ya está eliminado");

  await prisma.student.update({
    where: { id: studentId },
    data: { deletedAt: new Date(), deletedBy: session.sub, status: "INACTIVE" },
  });

  await writeAuditLog({
    userId: session.sub,
    role: session.role,
    institutionId,
    action: "STUDENT_DELETE",
    resource: "Student",
    resourceId: studentId,
    request,
  });
}
