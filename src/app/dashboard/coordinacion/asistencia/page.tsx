import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { getTodayClassesForInstitution } from "@/lib/coordination";
import { formatLongDateEs, formatTimeEs } from "@/lib/tz";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

type ClassRow = Awaited<ReturnType<typeof getTodayClassesForInstitution>>[number];

export default async function AsistenciaHoyPage() {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;
  const classes = await getTodayClassesForInstitution(institutionId);

  const pending = classes.filter((c) => c.status === "PENDIENTE");
  const registered = classes.filter((c) => c.status === "REGISTRADA");

  return (
    <div>
      <PageHeader title="Asistencia de hoy" subtitle={formatLongDateEs()} />

      {classes.length === 0 ? (
        <EmptyState icon="calendar" title="No hay clases programadas hoy" />
      ) : (
        <div className="space-y-8">
          <div className="card p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[17px] font-semibold text-slate-900">
                {registered.length} de {classes.length} clases registradas
              </p>
              <p className="text-[13px] text-slate-500">{Math.round((registered.length / classes.length) * 100)}%</p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(registered.length / classes.length) * 100}%` }}
              />
            </div>
          </div>

          <section>
            <h2 className="section-title">Sin registrar ({pending.length})</h2>
            {pending.length === 0 ? (
              <EmptyState tone="success" title="Todos los docentes registraron asistencia hoy" />
            ) : (
              <ClassList rows={pending} />
            )}
          </section>

          {registered.length > 0 && (
            <section>
              <h2 className="section-title">Registradas ({registered.length})</h2>
              <ClassList rows={registered} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ClassList({ rows }: { rows: ClassRow[] }) {
  return (
    <ul className="list-group">
      {rows.map((r) => {
        const done = r.status === "REGISTRADA";
        return (
          <li key={r.assignmentId} className="list-row">
            <span className="w-12 shrink-0 text-[15px] font-semibold tabular-nums text-slate-900">{r.startTime}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-900">
                {r.courseName} · {r.subjectName}
              </p>
              <p className="truncate text-[13px] text-slate-500">
                {r.teacherName}
                {done && r.registeredAt ? ` · registrada ${formatTimeEs(r.registeredAt)}` : ""}
              </p>
            </div>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                done ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}
              title={done ? "Registrada" : "Pendiente"}
            >
              <Icon name={done ? "check" : "clock"} className="h-4 w-4" strokeWidth={2.4} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
