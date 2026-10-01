import { requirePageRole } from "@/lib/rbac";
import { getGlobalOverview } from "@/lib/coordination";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { formatLongDateEs } from "@/lib/tz";

export default async function AdminHomePage() {
  await requirePageRole("SUPER_ADMIN");
  const o = await getGlobalOverview();

  return (
    <div className="space-y-8">
      <PageHeader title="Administración" subtitle={formatLongDateEs()} />

      <section>
        <h2 className="section-title">Hoy en todas las instituciones</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Clases registradas"
            value={`${o.registeredToday}/${o.sessionsToday}`}
            icon="checklist"
            tone={o.pendingToday > 0 ? "warning" : "success"}
            hint={o.pendingToday > 0 ? `${o.pendingToday} pendientes` : "Todas al día"}
          />
          <StatCard
            label="Estudiantes en alerta"
            value={o.openAlerts}
            icon="bell"
            tone={o.openAlerts > 0 ? "danger" : "success"}
          />
          <StatCard
            label="Casos activos"
            value={o.pendingCases}
            icon="folder"
            tone={o.pendingCases > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Instituciones activas"
            value={o.institutionCount}
            icon="building"
            href="/dashboard/admin/instituciones"
          />
        </div>
      </section>

      {o.institutionsWithPending.length > 0 && (
        <section>
          <h2 className="section-title">Instituciones con clases sin registrar hoy</h2>
          <ul className="list-group">
            {o.institutionsWithPending.map((i) => (
              <li key={i.institutionId} className="list-row">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Icon name="building" className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-900">{i.name}</span>
                <span className="text-[13px] tabular-nums text-slate-500">
                  {i.total - i.pending}/{i.total} registradas
                </span>
                <span className="badge bg-amber-50 text-amber-700">
                  {i.pending} {i.pending === 1 ? "pendiente" : "pendientes"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="section-title">Totales</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Estudiantes" value={o.studentCount} icon="users" />
          <StatCard label="Docentes" value={o.teacherCount} icon="user" />
          <StatCard label="Cursos" value={o.courseCount} icon="book" />
        </div>
      </section>
    </div>
  );
}
