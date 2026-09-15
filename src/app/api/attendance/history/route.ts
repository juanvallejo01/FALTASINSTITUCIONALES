import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, fail } from "@/lib/api-response";

export async function GET(request: Request) {
  try {
    const session = await requireRole("DOCENTE");
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.sub } });
    if (!teacher) return fail("Perfil de docente no encontrado", 404);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = 20;

    const [sessions, total] = await Promise.all([
      prisma.attendanceSession.findMany({
        where: { teacherId: teacher.id, status: "REGISTRADA" },
        include: { course: true, subject: true, records: true },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.attendanceSession.count({ where: { teacherId: teacher.id, status: "REGISTRADA" } }),
    ]);

    return ok({
      page,
      pageSize,
      total,
      sessions: sessions.map((s) => ({
        id: s.id,
        date: s.date,
        startTime: s.startTime,
        courseName: s.course.name,
        subjectName: s.subject.name,
        present: s.records.filter((r) => r.status === "PRESENTE").length,
        absent: s.records.filter((r) => r.status === "AUSENTE").length,
        late: s.records.filter((r) => r.status === "TARDE").length,
        justified: s.records.filter((r) => r.status === "JUSTIFICADO").length,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
