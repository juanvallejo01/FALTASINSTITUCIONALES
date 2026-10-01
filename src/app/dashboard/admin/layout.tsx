import { requirePageRole } from "@/lib/rbac";
import { AppShell } from "@/components/layout/AppShell";
import { NAV } from "@/lib/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageRole("SUPER_ADMIN");
  return (
    <AppShell nav={NAV.admin} userName={session.name}>
      {children}
    </AppShell>
  );
}
