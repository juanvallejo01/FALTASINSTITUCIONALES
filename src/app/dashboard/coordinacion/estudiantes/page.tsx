import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SegmentedLinks } from "@/components/ui/SegmentedLinks";
import { Pagination } from "@/components/ui/Pagination";
import { Icon } from "@/components/ui/Icon";

const PAGE_SIZE = 20;
const BASE = "/dashboard/coordinacion/estudiantes";

export default async function EstudiantesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; courseId?: string; q?: string }>;
}) {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;
  const { page: pageParam, courseId, q: rawQ } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const q = rawQ?.trim().slice(0, 80) || undefined;

  const baseWhere = { institutionId, status: "ACTIVE" as const, ...(courseId ? { courseId } : {}) };

  // Búsqueda sin distinguir tildes ni mayúsculas ("gomez" encuentra "Gómez"): Postgres no
  // ignora tildes sin la extensión unaccent, así que se filtra en memoria sobre los nombres
  // de la institución (pocos cientos de filas) y luego se pagina por id.
  let where: typeof baseWhere & { id?: { in: string[] } } = baseWhere;
  if (q) {
    const needle = normalize(q);
    const candidates = await prisma.student.findMany({
      where: baseWhere,
      select: { id: true, firstName: true, lastName: true, internalCode: true },
    });
    const ids = candidates
      .filter((c) => normalize(`${c.firstName} ${c.lastName} ${c.lastName} ${c.firstName} ${c.internalCode}`).includes(needle))
      .map((c) => c.id);
    where = { ...baseWhere, id: { in: ids } };
  }

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
  const href = (params: { courseId?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params.courseId) sp.set("courseId", params.courseId);
    if (q) sp.set("q", q);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return qs ? `${BASE}?${qs}` : BASE;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Estudiantes" subtitle={`${total} ${total === 1 ? "estudiante" : "estudiantes"}`} />

      <form action={BASE} className="relative">
        {courseId && <input type="hidden" name="courseId" value={courseId} />}
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o código"
          aria-label="Buscar estudiante"
          className="input bg-slate-200/50 pl-10 focus:bg-white"
        />
      </form>

      <SegmentedLinks
        label="Filtrar por curso"
        items={[
          { href: href({}), label: "Todos", active: !courseId },
          ...courses.map((c) => ({ href: href({ courseId: c.id }), label: c.name, active: courseId === c.id })),
        ]}
      />

      {students.length === 0 ? (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description={q ? `No hay estudiantes que coincidan con "${q}".` : "No hay estudiantes en este curso."}
        />
      ) : (
        <ul className="list-group">
          {students.map((s) => (
            <li key={s.id} className="list-row">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[12px] font-semibold text-slate-600">
                {s.lastName[0]}
                {s.firstName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {s.lastName} {s.firstName}
                </p>
                <p className="truncate text-[13px] text-slate-500">{s.internalCode}</p>
              </div>
              <span className="badge bg-slate-100 text-slate-600">{s.course.name}</span>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => href({ courseId, page: p })} />
    </div>
  );
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
