import { requirePageRole } from "@/lib/rbac";
import { DashboardNav } from "@/components/layout/DashboardNav";

const LINKS = [
  { href: "/dashboard/coordinacion", label: "Inicio" },
  { href: "/dashboard/coordinacion/asistencia", label: "Asistencia" },
  { href: "/dashboard/coordinacion/cursos", label: "Cursos" },
  { href: "/dashboard/coordinacion/estudiantes", label: "Estudiantes" },
  { href: "/dashboard/coordinacion/alertas", label: "Alertas" },
  { href: "/dashboard/coordinacion/reportes", label: "Reportes" },
  { href: "/dashboard/coordinacion/perfil", label: "Perfil" },
];

export default async function CoordinacionLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("COORDINADOR");
  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav title="Panel Coordinación" userName={session.name} links={LINKS} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
