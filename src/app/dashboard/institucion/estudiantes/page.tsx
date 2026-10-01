import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { StudentsManager } from "@/components/admin/StudentsManager";

const PAGE_SIZE = 20;

export default async function EstudiantesInstitucionPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  const institutionId = scopedInstitutionId(session)!;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const where = { institutionId, status: "ACTIVE" as const, deletedAt: null };

  const [students, total, courses] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { course: true, guardian: true },
      orderBy: [{ lastName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({ where }),
    prisma.course.findMany({ where: { institutionId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader title="Estudiantes" subtitle={`${total} ${total === 1 ? "estudiante" : "estudiantes"}`} />
      <StudentsManager
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        initialStudents={students.map((s) => ({
          id: s.id,
          internalCode: s.internalCode,
          firstName: s.firstName,
          lastName: s.lastName,
          courseId: s.courseId,
          courseName: s.course.name,
          guardianName: s.guardian ? `${s.guardian.firstName} ${s.guardian.lastName}` : null,
          guardianPhone: s.guardian?.phone ?? null,
          guardianRelationship: s.guardian?.relationship ?? null,
        }))}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        hrefFor={(p) => (p > 1 ? `/dashboard/institucion/estudiantes?page=${p}` : "/dashboard/institucion/estudiantes")}
      />
    </div>
  );
}
