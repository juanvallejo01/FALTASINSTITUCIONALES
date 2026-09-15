import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { getGlobalOverview } from "@/lib/coordination";
import { StatCard } from "@/components/layout/StatCard";
import { formatDateEs } from "@/lib/tz";

export default async function AdminHomePage() {
  await requirePageRole("SUPER_ADMIN");
  const overview = await getGlobalOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Panel de administración general</h1>
        <p className="text-sm text-slate-500">{formatDateEs(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Instituciones activas" value={overview.institutionCount} />
        <StatCard label="Estudiantes" value={overview.studentCount} />
        <StatCard label="Docentes" value={overview.teacherCount} />
        <StatCard label="Cursos" value={overview.courseCount} />
        <StatCard label="Clases de hoy" value={overview.sessionsToday} />
        <StatCard
          label="Pendientes hoy"
          value={overview.pendingToday}
          tone={overview.pendingToday > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Estudiantes en alerta"
          value={overview.openAlerts}
          tone={overview.openAlerts > 0 ? "danger" : "success"}
        />
        <StatCard label="Casos de seguimiento activos" value={overview.pendingCases} tone="warning" />
      </div>

      {overview.institutionsWithPending.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Instituciones con docentes pendientes hoy
          </h2>
          <ul className="space-y-1 text-sm">
            {overview.institutionsWithPending.map((i) => (
              <li key={i.institutionId} className="flex justify-between">
                <span>{i.name}</span>
                <span className="font-medium text-amber-600">{i.pending} pendientes</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/dashboard/admin/instituciones" className="btn-primary inline-block">
        Gestionar instituciones
      </Link>
    </div>
  );
}
