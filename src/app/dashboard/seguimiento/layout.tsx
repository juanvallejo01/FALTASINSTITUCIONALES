import { requirePageRole } from "@/lib/rbac";
import { DashboardNav } from "@/components/layout/DashboardNav";

const LINKS = [
  { href: "/dashboard/seguimiento", label: "Inicio" },
  { href: "/dashboard/seguimiento/casos", label: "Casos" },
  { href: "/dashboard/seguimiento/perfil", label: "Perfil" },
];

export default async function SeguimientoLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav title="Panel de Seguimiento" userName={session.name} links={LINKS} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
