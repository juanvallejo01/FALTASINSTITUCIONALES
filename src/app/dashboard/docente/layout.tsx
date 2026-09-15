import { requirePageRole } from "@/lib/rbac";
import { DashboardNav } from "@/components/layout/DashboardNav";

const LINKS = [
  { href: "/dashboard/docente", label: "Inicio" },
  { href: "/dashboard/docente/historial", label: "Historial" },
  { href: "/dashboard/docente/perfil", label: "Perfil" },
];

export default async function DocenteLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("DOCENTE");
  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav title="Panel Docente" userName={session.name} links={LINKS} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
