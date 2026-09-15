import Link from "next/link";
import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { getInstitutionOverview } from "@/lib/coordination";
import { StatCard } from "@/components/layout/StatCard";
import { formatDateEs } from "@/lib/tz";

export default async function InstitucionHomePage() {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  const institutionId = scopedInstitutionId(session)!;
  const overview = await getInstitutionOverview(institutionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Panel institucional</h1>
        <p className="text-sm text-slate-500">{formatDateEs(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Estudiantes" value={overview.studentCount} />
        <StatCard label="Docentes" value={overview.teacherCount} />
        <StatCard label="Cursos" value={overview.courseCount} />
        <StatCard
          label="Clases pendientes hoy"
          value={overview.classesPending}
          tone={overview.classesPending > 0 ? "warning" : "success"}
        />
        <StatCard label="Casos de seguimiento activos" value={overview.pendingCases} tone="warning" />
        <StatCard
          label="Estudiantes en alerta"
          value={overview.openAlerts}
          tone={overview.openAlerts > 0 ? "danger" : "success"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/institucion/docentes" className="btn-secondary">
          Gestionar docentes
        </Link>
        <Link href="/dashboard/institucion/estudiantes" className="btn-secondary">
          Gestionar estudiantes
        </Link>
      </div>
    </div>
  );
}
