import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatShortDateOnlyEs } from "@/lib/tz";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

export default async function HistorialDocentePage() {
  const session = await requirePageRole("DOCENTE");
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.sub } });

  if (!teacher) {
    return <EmptyState icon="user" title="Perfil de docente no encontrado" />;
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: { teacherId: teacher.id, status: "REGISTRADA" },
    include: { course: true, subject: true, records: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 30,
  });

  // Agrupar por día para leer el historial como un diario.
  const byDay = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = formatShortDateOnlyEs(s.date);
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }

  return (
    <div>
      <PageHeader title="Historial" subtitle="Tus últimas 30 clases registradas" />
      {sessions.length === 0 ? (
        <EmptyState
          icon="clock"
          title="Aún no hay registros"
          description="Cuando registres la asistencia de una clase, aparecerá aquí."
        />
      ) : (
        <div className="space-y-6">
          {[...byDay.entries()].map(([day, items]) => (
            <section key={day}>
              <h2 className="section-title capitalize">{day}</h2>
              <ul className="list-group">
                {items.map((s) => {
                  const count = (status: string) => s.records.filter((r) => r.status === status).length;
                  const absent = count("AUSENTE");
                  const late = count("TARDE");
                  return (
                    <li key={s.id}>
                      <Link href={`/dashboard/docente/asistencia/${s.id}?from=historial`} className="list-row">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {s.course.name} · {s.subject.name}
                          </p>
                          <p className="text-[13px] text-slate-500">{s.startTime}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-[13px] tabular-nums">
                          <span className="text-emerald-600">{count("PRESENTE")} P</span>
                          <span className={absent ? "font-semibold text-red-600" : "text-slate-400"}>{absent} A</span>
                          <span className={late ? "font-semibold text-amber-600" : "text-slate-400"}>{late} T</span>
                        </div>
                        <Icon name="chevron-right" className="h-4 w-4 text-slate-300" strokeWidth={2.2} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <p className="px-1 text-[12px] text-slate-400">P = presentes · A = ausentes · T = tarde</p>
        </div>
      )}
    </div>
  );
}
