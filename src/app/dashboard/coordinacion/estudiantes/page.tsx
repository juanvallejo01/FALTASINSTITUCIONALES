import Link from "next/link";
import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export default async function EstudiantesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; courseId?: string }>;
}) {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;
  const { page: pageParam, courseId } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const where = { institutionId, status: "ACTIVE" as const, ...(courseId ? { courseId } : {}) };

  const [students, total, courses] = await Promise.all([
    prisma.student.findMany({
      where,
      include: { course: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.student.count({ where }),
    prisma.course.findMany({ where: { institutionId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Estudiantes ({total})</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/coordinacion/estudiantes"
            className={`badge ${!courseId ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}
          >
            Todos
          </Link>
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/coordinacion/estudiantes?courseId=${c.id}`}
              className={`badge ${courseId === c.id ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Código</th>
              <th className="px-4 py-2.5">Nombre</th>
              <th className="px-4 py-2.5">Curso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2.5 text-slate-500">{s.internalCode}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">
                  {s.lastName} {s.firstName}
                </td>
                <td className="px-4 py-2.5">{s.course.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/dashboard/coordinacion/estudiantes?page=${p}${courseId ? `&courseId=${courseId}` : ""}`}
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
