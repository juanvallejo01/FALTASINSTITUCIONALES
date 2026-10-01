import { requirePageRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/navigation";

export default async function SeguimientoLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("GESTOR_SEGUIMIENTO");
  return (
    <AppShell nav={NAV.seguimiento} userName={session.name}>
      {children}
    </AppShell>
  );
}
