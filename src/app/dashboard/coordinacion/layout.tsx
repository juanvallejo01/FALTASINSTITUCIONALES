import { requirePageRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/navigation";

export default async function CoordinacionLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("COORDINADOR");
  return (
    <AppShell nav={NAV.coordinacion} userName={session.name}>
      {children}
    </AppShell>
  );
}
