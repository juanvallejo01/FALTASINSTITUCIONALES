import { requirePageRole } from "@/lib/rbac";
import { ProfileView } from "@/components/layout/ProfileView";

export default async function PerfilAdminPage() {
  const session = await requirePageRole("SUPER_ADMIN");
  return (
    <ProfileView
      name={session.name}
      role={session.role}
      rows={[
        { label: "Correo", value: session.email },
        { label: "Alcance", value: "Todas las instituciones" },
      ]}
    />
  );
}
