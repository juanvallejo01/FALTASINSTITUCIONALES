import { requirePageRole } from "@/lib/rbac";
import { DashboardNav } from "@/components/layout/DashboardNav";

const LINKS = [
  { href: "/dashboard/admin", label: "Inicio" },
  { href: "/dashboard/admin/instituciones", label: "Instituciones" },
  { href: "/dashboard/admin/auditoria", label: "Auditoría" },
  { href: "/dashboard/admin/perfil", label: "Perfil" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("SUPER_ADMIN");
  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav title="Administración General" userName={session.name} links={LINKS} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
