import { requirePageRole } from "@/lib/rbac";
import { DashboardNav } from "@/components/layout/DashboardNav";

const LINKS = [
  { href: "/dashboard/institucion", label: "Inicio" },
  { href: "/dashboard/institucion/docentes", label: "Docentes" },
  { href: "/dashboard/institucion/estudiantes", label: "Estudiantes" },
  { href: "/dashboard/institucion/cursos", label: "Cursos" },
  { href: "/dashboard/institucion/alertas", label: "Alertas" },
  { href: "/dashboard/institucion/reportes", label: "Reportes" },
  { href: "/dashboard/institucion/perfil", label: "Perfil" },
];

export default async function InstitucionLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  return (
    <div className="min-h-dvh bg-slate-50">
      <DashboardNav title="Panel Institucional" userName={session.name} links={LINKS} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
