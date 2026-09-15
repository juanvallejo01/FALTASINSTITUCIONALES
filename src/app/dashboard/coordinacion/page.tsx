import Link from "next/link";
import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { getInstitutionOverview } from "@/lib/coordination";
import { StatCard } from "@/components/layout/StatCard";
import { formatDateEs } from "@/lib/tz";

export default async function CoordinacionHomePage() {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;
  const overview = await getInstitutionOverview(institutionId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Panel de coordinación</h1>
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
        <StatCard label="Presentes hoy" value={overview.presentToday} tone="success" />
        <StatCard label="Ausentes hoy" value={overview.absentToday} tone="danger" />
        <StatCard label="Tardanzas hoy" value={overview.lateToday} tone="warning" />
        <StatCard
          label="Estudiantes en alerta"
          value={overview.openAlerts}
          tone={overview.openAlerts > 0 ? "danger" : "success"}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/coordinacion/asistencia" className="btn-secondary">
          Ver asistencia de hoy
        </Link>
        <Link href="/dashboard/coordinacion/alertas" className="btn-secondary">
          Ver estudiantes en alerta ({overview.openAlerts})
        </Link>
      </div>
    </div>
  );
}
