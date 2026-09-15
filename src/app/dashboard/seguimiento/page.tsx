import Link from "next/link";
import { requirePageRole, scopedInstitutionId } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/layout/StatCard";

export default async function SeguimientoHomePage() {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  const institutionId = scopedInstitutionId(session);
  const where = { deletedAt: null, institutionId: institutionId ?? undefined };

  const [pendiente, enGestion, contactado, cerrado] = await Promise.all([
    prisma.followUpCase.count({ where: { ...where, status: "PENDIENTE" } }),
    prisma.followUpCase.count({ where: { ...where, status: "EN_GESTION" } }),
    prisma.followUpCase.count({ where: { ...where, status: "CONTACTADO" } }),
    prisma.followUpCase.count({ where: { ...where, status: "CERRADO" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Casos de seguimiento</h1>
        <p className="text-sm text-slate-500">
          Estudiantes con ausencias que requieren contacto con el acudiente.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pendientes" value={pendiente} tone={pendiente > 0 ? "danger" : "success"} />
        <StatCard label="En gestión" value={enGestion} tone="warning" />
        <StatCard label="Contactados" value={contactado} tone="success" />
        <StatCard label="Cerrados" value={cerrado} />
      </div>
      <Link href="/dashboard/seguimiento/casos" className="btn-primary">
        Ver todos los casos
      </Link>
    </div>
  );
}
