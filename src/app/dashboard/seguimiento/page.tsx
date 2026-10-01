import Link from "next/link";
import { requirePageRole } from "@/lib/rbac";
import { countFollowUpCasesByStatus } from "@/lib/followup";
import { formatLongDateEs } from "@/lib/tz";
import { PageHeader } from "@/components/ui/PageHeader";
import { AttentionList, type AttentionItem } from "@/components/ui/AttentionList";
import { StatCard } from "@/components/layout/StatCard";
import { Icon } from "@/components/ui/Icon";

const CASES = "/dashboard/seguimiento/casos";

export default async function SeguimientoHomePage() {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  const counts = await countFollowUpCasesByStatus(session);
  const n = (status: string) => counts[status] ?? 0;

  const attention: AttentionItem[] = [];
  if (n("PENDIENTE") > 0) {
    attention.push({
      tone: "danger",
      text: `${n("PENDIENTE")} ${n("PENDIENTE") === 1 ? "caso sin" : "casos sin"} gestionar`,
      detail: "Aún no se ha contactado al acudiente",
      href: `${CASES}?status=PENDIENTE`,
    });
  }
  if (n("NO_CONTACTADO") > 0) {
    attention.push({
      tone: "warning",
      text: `${n("NO_CONTACTADO")} ${n("NO_CONTACTADO") === 1 ? "acudiente" : "acudientes"} sin contactar`,
      detail: "Vuelve a intentar la comunicación",
      href: `${CASES}?status=NO_CONTACTADO`,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Seguimiento" subtitle={formatLongDateEs()} />

      <AttentionList items={attention} allClearText="No hay casos pendientes por gestionar." />

      <section>
        <h2 className="section-title">Casos por estado</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard label="Pendientes" value={n("PENDIENTE")} icon="alert" tone={n("PENDIENTE") ? "danger" : "success"} href={`${CASES}?status=PENDIENTE`} />
          <StatCard label="En gestión" value={n("EN_GESTION")} icon="phone" tone={n("EN_GESTION") ? "warning" : "default"} href={`${CASES}?status=EN_GESTION`} />
          <StatCard label="No contactados" value={n("NO_CONTACTADO")} icon="x" tone={n("NO_CONTACTADO") ? "warning" : "default"} href={`${CASES}?status=NO_CONTACTADO`} />
          <StatCard label="Contactados" value={n("CONTACTADO")} icon="check" tone="success" href={`${CASES}?status=CONTACTADO`} />
          <StatCard label="Justificados" value={n("JUSTIFICADO")} icon="shield" tone="info" href={`${CASES}?status=JUSTIFICADO`} />
          <StatCard label="Cerrados" value={n("CERRADO")} icon="folder" href={`${CASES}?status=CERRADO`} />
        </div>
      </section>

      <Link href={CASES} className="btn-primary w-full sm:w-auto">
        Ver todos los casos
        <Icon name="chevron-right" className="h-4 w-4" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
