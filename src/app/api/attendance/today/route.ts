import { requireRole } from "@/lib/rbac";
import { getTodaySessionsForTeacher } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { handleApiError, ok, fail } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireRole("DOCENTE");
    const teacher = await prisma.teacher.findUnique({ where: { userId: session.sub } });
    if (!teacher) return fail("Perfil de docente no encontrado", 404);
    const sessions = await getTodaySessionsForTeacher(teacher.id);
    return ok({ sessions, teacherName: `${teacher.firstName} ${teacher.lastName}` });
  } catch (error) {
    return handleApiError(error);
  }
}
