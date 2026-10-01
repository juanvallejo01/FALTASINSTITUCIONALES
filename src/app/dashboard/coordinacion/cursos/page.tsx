import Link from "next/link";
import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { JORNADA } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

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
      <PageHeader title="Cursos" subtitle={`${courses.length} cursos activos`} />
      {courses.length === 0 ? (
        <EmptyState icon="book" title="No hay cursos activos" />
      ) : (
        <ul className="list-group">
          {courses.map((c) => (
            <li key={c.id}>
              <Link href={`/dashboard/coordinacion/estudiantes?courseId=${c.id}`} className="list-row">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-[14px] font-bold text-brand-700">
                  {c.name}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">Curso {c.name}</p>
                  <p className="truncate text-[13px] text-slate-500">
                    {c.campus.name} · Jornada {JORNADA[c.jornada]?.toLowerCase() ?? c.jornada}
                  </p>
                </div>
                <span className="text-[13px] tabular-nums text-slate-500">{c._count.students} estudiantes</span>
                <Icon name="chevron-right" className="h-4 w-4 text-slate-300" strokeWidth={2.2} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
