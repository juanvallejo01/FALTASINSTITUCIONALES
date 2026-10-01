import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { getInstitutionOverview } from "@/lib/coordination";
import { StatCard } from "@/components/layout/StatCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { AttentionList, type AttentionItem } from "@/components/ui/AttentionList";
import { formatLongDateEs } from "@/lib/tz";

const BASE = "/dashboard/coordinacion";

export default async function CoordinacionHomePage() {
  const session = await requirePageRole("COORDINADOR");
  const institutionId = scopedInstitutionId(session)!;
  const o = await getInstitutionOverview(institutionId);

  const attention: AttentionItem[] = [];
  if (o.classesPending > 0) {
    attention.push({
      tone: "warning",
      text: `${o.classesPending} ${o.classesPending === 1 ? "clase sin" : "clases sin"} registrar hoy`,
      detail: "Revisa qué docentes faltan por tomar asistencia",
      href: `${BASE}/asistencia`,
    });
  }
  if (o.openAlerts > 0) {
    attention.push({
      tone: "danger",
      text: `${o.openAlerts} ${o.openAlerts === 1 ? "estudiante" : "estudiantes"} en alerta`,
      detail: "Ausencias que superan el umbral de seguimiento",
      href: `${BASE}/alertas`,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Coordinación" subtitle={formatLongDateEs()} />

      <AttentionList items={attention} allClearText="Todo al día: asistencia registrada y sin alertas abiertas." />

      <section>
        <h2 className="section-title">Hoy</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Clases registradas"
            value={`${o.classesRegistered}/${o.classesToday}`}
            icon="checklist"
            tone={o.classesPending > 0 ? "warning" : "success"}
            href={`${BASE}/asistencia`}
          />
          <StatCard label="Presentes" value={o.presentToday} icon="check" tone="success" />
          <StatCard label="Ausentes" value={o.absentToday} icon="x" tone={o.absentToday > 0 ? "danger" : "default"} />
          <StatCard label="Tardanzas" value={o.lateToday} icon="clock" tone={o.lateToday > 0 ? "warning" : "default"} />
        </div>
      </section>

      <section>
        <h2 className="section-title">Institución</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="En alerta"
            value={o.openAlerts}
            icon="bell"
            tone={o.openAlerts > 0 ? "danger" : "success"}
            href={`${BASE}/alertas`}
          />
          <StatCard label="Estudiantes" value={o.studentCount} icon="users" href={`${BASE}/estudiantes`} />
          <StatCard label="Docentes" value={o.teacherCount} icon="user" />
          <StatCard label="Cursos" value={o.courseCount} icon="book" href={`${BASE}/cursos`} />
        </div>
      </section>
    </div>
  );
}
