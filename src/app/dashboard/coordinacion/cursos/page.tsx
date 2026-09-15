import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function CursosPage() {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;

  const courses = await prisma.course.findMany({
    where: { institutionId, status: "ACTIVE" },
    include: { campus: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">Cursos</h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Curso</th>
              <th className="px-4 py-2.5">Sede</th>
              <th className="px-4 py-2.5">Jornada</th>
              <th className="px-4 py-2.5 text-right">Estudiantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-2.5">{c.campus.name}</td>
                <td className="px-4 py-2.5">{c.jornada}</td>
                <td className="px-4 py-2.5 text-right">{c._count.students}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
