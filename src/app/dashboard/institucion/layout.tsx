import { requirePageRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/navigation";

export default async function InstitucionLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("ADMIN_INSTITUCIONAL");
  return (
    <AppShell nav={NAV.institucion} userName={session.name}>
      {children}
    </AppShell>
  );
}
