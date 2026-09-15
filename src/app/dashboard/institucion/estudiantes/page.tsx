import Link from "next/link";
import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Estudiantes ({total})</h1>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/institucion/estudiantes?page=${p}`}
              className={`rounded px-2.5 py-1 ${p === page ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
