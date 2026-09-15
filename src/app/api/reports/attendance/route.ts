import { requireRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";
import { formatDateOnlyEs } from "@/lib/tz";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Exportación CSV de asistencia (sección 23 del spec). Respeta el mismo
 * aislamiento por institución que el resto de la app: un ADMIN_INSTITUCIONAL
 * o COORDINADOR solo exporta su propia institución.
 */
export async function GET(request: Request) {
  try {
    const session = await requireRole("ADMIN_INSTITUCIONAL", "COORDINADOR", "SUPER_ADMIN");
    const institutionId = scopedInstitutionId(session);
    const { searchParams } = new URL(request.url);
    const requestedInstitutionId = searchParams.get("institutionId");

    const where =
      institutionId != null
        ? { institutionId }
        : requestedInstitutionId
          ? { institutionId: requestedInstitutionId }
          : {};

    const records = await prisma.attendanceRecord.findMany({
      where: { session: where },
      include: {
        student: true,
        session: { include: { course: { include: { institution: true } }, subject: true, teacher: true } },
      },
      orderBy: { session: { date: "desc" } },
      take: 5000,
    });

    const header = [
      "fecha",
      "institucion",
      "curso",
      "materia",
      "docente",
      "estudiante_codigo",
      "estudiante_nombre",
      "estado",
      "observacion",
    ];

    const rows = records.map((r) =>
      [
        formatDateOnlyEs(r.session.date),
        r.session.course.institution.name,
        r.session.course.name,
        r.session.subject.name,
        `${r.session.teacher.firstName} ${r.session.teacher.lastName}`,
        r.student.internalCode,
        `${r.student.lastName} ${r.student.firstName}`,
        r.status,
        r.observation ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    );

    const csv = [header.join(","), ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="asistencia_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
