import { requirePageRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/navigation";

export default async function DocenteLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("DOCENTE");
  return (
    <AppShell nav={NAV.docente} userName={session.name}>
      {children}
    </AppShell>
  );
}
