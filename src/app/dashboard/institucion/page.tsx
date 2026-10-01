import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { getInstitutionOverview } from "@/lib/coordination";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { AttentionList, type AttentionItem } from "@/components/ui/AttentionList";
import { formatLongDateEs } from "@/lib/tz";

const BASE = "/dashboard/institucion";

export default async function InstitucionHomePage() {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  const institutionId = scopedInstitutionId(session)!;
  const o = await getInstitutionOverview(institutionId);

  const attention: AttentionItem[] = [];
  if (o.openAlerts > 0) {
    attention.push({
      tone: "danger",
      text: `${o.openAlerts} ${o.openAlerts === 1 ? "estudiante" : "estudiantes"} en alerta`,
      detail: "Ausencias que superan el umbral de seguimiento",
      href: `${BASE}/alertas`,
    });
  }
  if (o.classesPending > 0) {
    attention.push({
      tone: "warning",
      text: `${o.classesPending} ${o.classesPending === 1 ? "clase sin" : "clases sin"} registrar hoy`,
      detail: "Los docentes aún no han tomado asistencia",
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Institución" subtitle={formatLongDateEs()} />

      <AttentionList items={attention} allClearText="Todo al día: asistencia registrada y sin alertas abiertas." />

      <section>
        <h2 className="section-title">Seguimiento</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="En alerta"
            value={o.openAlerts}
            icon="bell"
            tone={o.openAlerts > 0 ? "danger" : "success"}
            href={`${BASE}/alertas`}
          />
          <StatCard
            label="Casos activos"
            value={o.pendingCases}
            icon="folder"
            tone={o.pendingCases > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Clases registradas hoy"
            value={`${o.classesRegistered}/${o.classesToday}`}
            icon="checklist"
            tone={o.classesPending > 0 ? "warning" : "success"}
          />
        </div>
      </section>

      <section>
        <h2 className="section-title">Gestión</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Estudiantes" value={o.studentCount} icon="users" hint="Gestionar" href={`${BASE}/estudiantes`} />
          <StatCard label="Docentes" value={o.teacherCount} icon="user" hint="Gestionar" href={`${BASE}/docentes`} />
          <StatCard label="Cursos" value={o.courseCount} icon="book" hint="Estructura académica" href={`${BASE}/cursos`} />
        </div>
      </section>
    </div>
  );
}
