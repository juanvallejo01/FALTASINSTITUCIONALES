import { prisma } from "@/lib/prisma";
import { formatShortDateOnlyEs } from "@/lib/tz";
import { ALERT_LEVEL, labelOf } from "@/lib/labels";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";

/** Estudiantes con alerta de asistencia abierta (coordinación e institución). */
export async function AlertsList({ institutionId }: { institutionId: string }) {
  const alerts = await prisma.alert.findMany({
    where: { institutionId, status: "ABIERTA" },
    include: { student: { include: { course: true } } },
    orderBy: [{ level: "desc" }, { absenceCount: "desc" }],
  });

  const critical = alerts.filter((a) => a.level === "ALERTA");
  const watch = alerts.filter((a) => a.level !== "ALERTA");

  return (
    <div>
      <PageHeader
        title="Alertas"
        subtitle={
          alerts.length === 0
            ? "Estudiantes con ausencias que requieren seguimiento"
            : `${alerts.length} ${alerts.length === 1 ? "estudiante requiere" : "estudiantes requieren"} seguimiento`
        }
      />
      {alerts.length === 0 ? (
        <EmptyState
          tone="success"
          title="Sin estudiantes en alerta"
          description="Ningún estudiante supera el umbral de ausencias en este momento."
        />
      ) : (
        <div className="space-y-8">
          {[
            { title: "Alerta", hint: "Ausencias críticas", items: critical },
            { title: "En seguimiento", hint: "Vigilar", items: watch },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <section key={group.title}>
                <h2 className="section-title">
                  {group.title} ({group.items.length})
                </h2>
                <ul className="list-group">
                  {group.items.map((a) => {
                    const level = labelOf(ALERT_LEVEL, a.level);
                    const pct = a.attendancePercentage;
                    return (
                      <li key={a.id} className="list-row">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {a.student.lastName} {a.student.firstName}
                          </p>
                          <p className="text-[13px] text-slate-500">
                            {a.student.course.name}
                            {a.lastAbsenceDate ? ` · última ausencia ${formatShortDateOnlyEs(a.lastAbsenceDate)}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[15px] font-semibold tabular-nums text-slate-900">
                            {a.absenceCount} <span className="text-[13px] font-normal text-slate-500">ausencias</span>
                          </p>
                          <p
                            className={`text-[13px] tabular-nums ${pct < 80 ? "text-red-600" : pct < 90 ? "text-amber-600" : "text-slate-500"}`}
                          >
                            {pct.toFixed(0)}% asistencia
                          </p>
                        </div>
                        <span className="hidden sm:inline-flex">
                          <Badge tone={level.tone}>{level.label}</Badge>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
