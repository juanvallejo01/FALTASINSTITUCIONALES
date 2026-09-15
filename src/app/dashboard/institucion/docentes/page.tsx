import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { TeachersManager } from "@/components/admin/TeachersManager";

export default async function DocentesPage() {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  const institutionId = scopedInstitutionId(session)!;

  const [teachers, campuses] = await Promise.all([
    prisma.teacher.findMany({
      where: { institutionId, status: "ACTIVE", deletedAt: null },
      include: { user: true, campus: true, assignments: { include: { course: true, subject: true } } },
      orderBy: [{ lastName: "asc" }],
    }),
    prisma.campus.findMany({ where: { institutionId, status: "ACTIVE" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Docentes ({teachers.length})</h1>
      <TeachersManager
        campuses={campuses.map((c) => ({ id: c.id, name: c.name }))}
        initialTeachers={teachers.map((t) => ({
          id: t.id,
          internalCode: t.internalCode,
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.user.email,
          phone: t.phone,
          campusId: t.campusId,
          campusName: t.campus.name,
          courseCount: new Set(t.assignments.map((a) => a.courseId)).size,
        }))}
      />
    </div>
  );
}
